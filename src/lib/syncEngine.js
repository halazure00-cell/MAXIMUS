/**
 * Sync Engine
 * Handles bidirectional sync between local cache and Supabase
 */

import { supabase } from './supabaseClient';
import {
  getPendingOps,
  removeFromOplog,
  updateOplogRetry,
  moveToFailedOps,
  setLastSyncAt,
  setSyncStatus,
  getLastSyncAt,
  putCachedOrder,
  putCachedExpense,
  softDeleteCachedOrder,
  softDeleteCachedExpense,
  getCachedOrder,
  getCachedExpense,
} from './localDb';
import { createLogger } from './logger';

const logger = createLogger('syncEngine');

// Maximum retry count before giving up
const MAX_RETRIES = 3;

/**
 * Check if an error is a schema-related error that shouldn't be retried
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is a non-retryable schema error
 */
function isSchemaError(error) {
  const errorMsg = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';
  
  // PostgreSQL error codes and messages for missing columns/tables
  return (
    (errorMsg.includes('column') && errorMsg.includes('does not exist')) ||
    (errorMsg.includes('relation') && errorMsg.includes('does not exist')) ||
    errorCode === '42703' || // undefined_column
    errorCode === '42P01'    // undefined_table
  );
}

// Sync state listeners
const listeners = new Set();

/**
 * Subscribe to sync state changes
 */
export function onSyncStateChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Notify all listeners of sync state change
 */
function notifyListeners(state) {
  listeners.forEach(callback => {
    try {
      callback(state);
    } catch (error) {
      console.error('[syncEngine] Listener error:', error);
    }
  });
}

// ==================== PUSH (LOCAL → SUPABASE) ====================

/**
 * Push pending operations to Supabase
 * @param {string} userId - User ID for validation
 * @returns {Promise<Object>} Sync result
 */
export async function pushToSupabase(userId) {
  const ops = await getPendingOps();
  
  if (ops.length === 0) {
    return { success: true, processed: 0, failed: 0 };
  }
  
  let processed = 0;
  let failed = 0;
  const errors = [];
  
  for (const op of ops) {
    try {
      // Validate user_id matches
      if (op.payload?.user_id !== userId) {
        console.warn('[syncEngine] Skipping op with mismatched user_id:', op);
        await removeFromOplog(op.op_id);
        continue;
      }
      
      if (op.op === 'upsert') {
        await pushUpsert(op);
      } else if (op.op === 'delete') {
        await pushDelete(op);
      }
      
      // Success - remove from queue
      await removeFromOplog(op.op_id);
      processed++;
    } catch (error) {
      console.error('[syncEngine] Failed to push op:', op, error);
      
      // Check if it's an auth error (stop sync)
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        errors.push({ op, error: 'Authentication error - please re-login' });
        failed++;
        break; // Stop processing
      }
      
      // Check if it's a schema error (non-retryable, permanent issue)
      if (isSchemaError(error)) {
        const schemaError = 'Database schema error. Migration 0004_offline_first required. Contact administrator.';
        logger.error('Schema error detected - non-retryable', { op, error: error.message });
        
        // Immediately move to failed_ops without retrying
        await moveToFailedOps(op);
        await removeFromOplog(op.op_id);
        
        // Notify about schema error
        notifyListeners({
          type: 'operation_failed',
          table: op.table,
          clientTxId: op.client_tx_id,
          error: schemaError,
          schemaError: true,
        });
        
        errors.push({ op, error: schemaError, schemaError: true });
        failed++;
        continue; // Continue processing other ops
      }
      
      // Update retry count
      await updateOplogRetry(op.op_id, error.message);
      
      // If max retries exceeded, move to failed_ops
      if ((op.retry_count || 0) >= MAX_RETRIES - 1) {
        logger.error('Max retries exceeded, moving to failed_ops', { op });
        await moveToFailedOps(op);
        await removeFromOplog(op.op_id);
        
        // Notify about failed operation
        notifyListeners({
          type: 'operation_failed',
          table: op.table,
          clientTxId: op.client_tx_id,
          error: error.message,
        });
      }
      
      errors.push({ op, error: error.message });
      failed++;
    }
  }
  
  return { success: failed === 0, processed, failed, errors };
}

/**
 * Push upsert operation to Supabase
 */
async function pushUpsert(op) {
  const { table, payload } = op;
  
  // Prepare data for Supabase (remove IndexedDB-only fields)
  const data = {
    ...payload,
  };
  
  // For new records without a server-assigned ID, remove the id field
  // Server will generate bigserial id, we keep client_tx_id for matching
  if (data.id && !Number.isInteger(data.id)) {
    // Only remove if it's not a proper server-assigned integer
    delete data.id;
  }
  
  // Upsert by (user_id, client_tx_id)
  const { data: result, error } = await supabase
    .from(table)
    .upsert(data, {
      onConflict: 'user_id,client_tx_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update local cache with server version (server is truth)
  if (result) {
    if (table === 'orders') {
      await putCachedOrder(result);
    } else if (table === 'expenses') {
      await putCachedExpense(result);
    }
  }
}

/**
 * Push delete operation to Supabase
 */
async function pushDelete(op) {
  const { table, payload, client_tx_id } = op;
  
  // Soft delete: update deleted_at
  const { error } = await supabase
    .from(table)
    .update({
      deleted_at: payload.deleted_at,
      updated_at: payload.updated_at,
    })
    .eq('user_id', payload.user_id)
    .eq('client_tx_id', client_tx_id);
  
  if (error) throw error;
  
  // Ensure local cache is also marked as deleted
  if (table === 'orders') {
    await softDeleteCachedOrder(client_tx_id);
  } else if (table === 'expenses') {
    await softDeleteCachedExpense(client_tx_id);
  }
}

// ==================== PULL (SUPABASE → LOCAL) ====================

/**
 * Pull changes from Supabase
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Pull result
 */
export async function pullFromSupabase(userId) {
  const lastSync = await getLastSyncAt();
  const sinceTimestamp = lastSync || '2000-01-01T00:00:00.000Z'; // Far past if never synced
  
  try {
    logger.info('Starting pull from Supabase', { lastSync, sinceTimestamp });
    
    // Fetch orders changed since last sync
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceTimestamp)
      .order('updated_at', { ascending: true });
    
    if (ordersError) throw ordersError;
    
    // Fetch expenses changed since last sync
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceTimestamp)
      .order('updated_at', { ascending: true });
    
    if (expensesError) throw expensesError;
    
    logger.info('Fetched changes from Supabase', { 
      orders: orders?.length || 0, 
      expenses: expenses?.length || 0 
    });
    
    // Apply to cache
    let ordersUpdated = 0;
    let expensesUpdated = 0;
    let maxUpdatedAt = sinceTimestamp; // Track max updated_at for server time
    
    for (const order of orders || []) {
      await applyOrderToCache(order);
      ordersUpdated++;
      
      // Track the latest updated_at from server
      if (order.updated_at && order.updated_at > maxUpdatedAt) {
        maxUpdatedAt = order.updated_at;
      }
    }
    
    for (const expense of expenses || []) {
      await applyExpenseToCache(expense);
      expensesUpdated++;
      
      // Track the latest updated_at from server
      if (expense.updated_at && expense.updated_at > maxUpdatedAt) {
        maxUpdatedAt = expense.updated_at;
      }
    }
    
    // Use server time from the latest record, or current time if no records
    // This prevents clock skew issues
    const serverTime = maxUpdatedAt !== sinceTimestamp ? maxUpdatedAt : new Date().toISOString();
    await setLastSyncAt(serverTime);
    
    logger.info('Pull complete', { ordersUpdated, expensesUpdated, serverTime });
    
    return {
      success: true,
      ordersUpdated,
      expensesUpdated,
    };
  } catch (error) {
    logger.error('Pull failed', error);
    
    // Check if it's a schema error and provide clear message
    if (isSchemaError(error)) {
      const schemaError = new Error('Database schema error. Migration 0004_offline_first required. Contact administrator.');
      schemaError.isSchemaError = true;
      schemaError.originalError = error.message;
      throw schemaError;
    }
    
    throw error;
  }
}

/**
 * Apply order from Supabase to local cache
 */
async function applyOrderToCache(order) {
  const existing = await getCachedOrder(order.client_tx_id);
  
  // Conflict detection: server updated_at > local updated_at
  if (existing && existing.updated_at) {
    const serverTime = new Date(order.updated_at).getTime();
    const localTime = new Date(existing.updated_at).getTime();
    
    if (localTime > serverTime) {
      // Local is newer - potential conflict
      // Strategy: Server-wins (server data overwrites local)
      logger.warn('Conflict detected for order - server wins', { 
        clientTxId: order.client_tx_id,
        localTime: new Date(localTime).toISOString(),
        serverTime: new Date(serverTime).toISOString(),
      });
      notifyListeners({
        type: 'conflict',
        table: 'orders',
        clientTxId: order.client_tx_id,
        resolution: 'server-wins',
        localData: existing,
        serverData: order,
      });
    }
  }
  
  // Apply server version to cache
  if (order.deleted_at) {
    await softDeleteCachedOrder(order.client_tx_id);
  } else {
    await putCachedOrder(order);
  }
}

/**
 * Apply expense from Supabase to local cache
 */
async function applyExpenseToCache(expense) {
  const existing = await getCachedExpense(expense.client_tx_id);
  
  // Conflict detection
  if (existing && existing.updated_at) {
    const serverTime = new Date(expense.updated_at).getTime();
    const localTime = new Date(existing.updated_at).getTime();
    
    if (localTime > serverTime) {
      logger.warn('Conflict detected for expense - server wins', { 
        clientTxId: expense.client_tx_id,
        localTime: new Date(localTime).toISOString(),
        serverTime: new Date(serverTime).toISOString(),
      });
      notifyListeners({
        type: 'conflict',
        table: 'expenses',
        clientTxId: expense.client_tx_id,
        resolution: 'server-wins',
        localData: existing,
        serverData: expense,
      });
    }
  }
  
  // Apply server version to cache
  if (expense.deleted_at) {
    await softDeleteCachedExpense(expense.client_tx_id);
  } else {
    await putCachedExpense(expense);
  }
}

// ==================== FULL SYNC ====================

/**
 * Full bidirectional sync
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Sync result
 */
export async function syncAll(userId) {
  if (!userId) {
    throw new Error('User ID required for sync');
  }
  
  await setSyncStatus('syncing');
  notifyListeners({ type: 'status', status: 'syncing' });
  
  try {
    // Push first (local changes to server)
    const pushResult = await pushToSupabase(userId);
    
    // Then pull (server changes to local)
    const pullResult = await pullFromSupabase(userId);
    
    await setSyncStatus('idle');
    notifyListeners({ 
      type: 'status', 
      status: 'idle',
      lastSync: new Date().toISOString(),
    });
    
    return {
      success: true,
      push: pushResult,
      pull: pullResult,
    };
  } catch (error) {
    console.error('[syncEngine] Sync failed:', error);
    await setSyncStatus('error');
    notifyListeners({ 
      type: 'status', 
      status: 'error',
      error: error.message,
    });
    throw error;
  }
}

// ==================== NETWORK LISTENERS ====================

let onlineListener = null;
let syncInterval = null;

/**
 * Start listening for online events and auto-sync
 * @param {string} userId - User ID
 * @param {Object} options - Options
 * @param {number} options.intervalMs - Auto-sync interval in milliseconds (default: 60000)
 */
export function startAutoSync(userId, options = {}) {
  const { intervalMs = 60000 } = options;
  
  // Online event listener
  if (!onlineListener) {
    onlineListener = async () => {
      console.log('[syncEngine] Back online, triggering sync');
      try {
        await syncAll(userId);
      } catch (error) {
        console.error('[syncEngine] Auto-sync on online failed:', error);
      }
    };
    window.addEventListener('online', onlineListener);
  }
  
  // Periodic sync when online
  if (!syncInterval && intervalMs > 0) {
    syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          await syncAll(userId);
        } catch (error) {
          console.error('[syncEngine] Auto-sync interval failed:', error);
        }
      }
    }, intervalMs);
  }
  
  // Initial sync if online
  if (navigator.onLine) {
    syncAll(userId).catch(error => {
      console.error('[syncEngine] Initial sync failed:', error);
    });
  }
}

/**
 * Stop auto-sync listeners
 */
export function stopAutoSync() {
  if (onlineListener) {
    window.removeEventListener('online', onlineListener);
    onlineListener = null;
  }
  
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// ==================== OBSERVABLE SYNC ====================

/**
 * Get server time from Supabase
 * Uses PostgreSQL's now() function to get server timestamp (source of truth)
 * Falls back to local time if database query fails
 * 
 * Note: If using RPC, create this function in Supabase:
 * CREATE OR REPLACE FUNCTION get_server_time()
 * RETURNS timestamptz AS $$
 *   SELECT now();
 * $$ LANGUAGE sql STABLE;
 * 
 * @returns {Promise<string>} ISO timestamp from server
 */
async function getServerTime() {
  try {
    // Try to get server time using a simple query
    // This queries the database and returns the server's current timestamp
    const { data, error } = await supabase
      .rpc('get_server_time')
      .single();
    
    if (!error && data) {
      return data;
    }
    
    // Fallback: Use current time from server via any existing table
    // PostgreSQL's now() gives us server time, not client time
    const { data: timeData, error: timeError } = await supabase
      .from('orders')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!timeError && timeData?.created_at) {
      // Use the timestamp from the query which reflects server time
      // Even if the data is old, the query itself goes through server
      // For more accuracy, we'll use current local time but note it's a fallback
      console.warn('[syncEngine] Using fallback time method');
      return new Date().toISOString();
    }
    
    // Last resort: use local client time
    console.warn('[syncEngine] Could not get server time, using local time');
    return new Date().toISOString();
  } catch (err) {
    console.warn('[syncEngine] Error getting server time:', err);
    return new Date().toISOString();
  }
}

/**
 * Manual sync with structured result and observability
 * @param {Object} options - Sync options
 * @param {string} options.reason - Reason for sync (e.g., 'manual', 'auto', 'network')
 * @param {string} options.userId - User ID for sync
 * @returns {Promise<Object>} Structured sync result
 */
export async function syncNow({ reason = 'manual', userId } = {}) {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    console.log(`[syncEngine] 🔄 syncNow started - reason: ${reason}`);
  }
  
  if (!userId) {
    const error = 'User ID required for sync';
    if (isDev) {
      console.error(`[syncEngine] ❌ syncNow failed - ${error}`);
    }
    return {
      ok: false,
      stage: 'validation',
      error,
      stats: { pushed: 0, pulled: 0, failed: 0 },
      serverTime: null,
    };
  }
  
  let stage = 'init';
  let serverTime = null;
  
  try {
    // Set syncing status
    stage = 'status_update';
    if (isDev) {
      console.log('[syncEngine] 📝 Stage: status_update');
    }
    await setSyncStatus('syncing');
    notifyListeners({ type: 'status', status: 'syncing' });
    
    // Push local changes to server
    stage = 'push';
    if (isDev) {
      console.log('[syncEngine] ⬆️  Stage: push');
    }
    const pushResult = await pushToSupabase(userId);
    if (isDev) {
      console.log('[syncEngine] ⬆️  Push result:', pushResult);
    }
    
    // Pull server changes to local
    stage = 'pull';
    if (isDev) {
      console.log('[syncEngine] ⬇️  Stage: pull');
    }
    const pullResult = await pullFromSupabase(userId);
    if (isDev) {
      console.log('[syncEngine] ⬇️  Pull result:', pullResult);
    }
    
    // Get server time
    stage = 'server_time';
    if (isDev) {
      console.log('[syncEngine] ⏰ Stage: server_time');
    }
    serverTime = await getServerTime();
    
    // Update last sync timestamp with server time
    stage = 'finalize';
    if (isDev) {
      console.log('[syncEngine] ✅ Stage: finalize');
    }
    await setLastSyncAt(serverTime);
    await setSyncStatus('idle');
    notifyListeners({ 
      type: 'status', 
      status: 'idle',
      lastSync: serverTime,
    });
    
    const result = {
      ok: true,
      stage: 'complete',
      error: null,
      stats: {
        pushed: pushResult.processed || 0,
        pulled: (pullResult.ordersUpdated || 0) + (pullResult.expensesUpdated || 0),
        failed: pushResult.failed || 0,
      },
      serverTime,
    };
    
    if (isDev) {
      console.log('[syncEngine] ✅ syncNow completed:', result);
    }
    
    return result;
  } catch (error) {
    if (isDev) {
      console.error(`[syncEngine] ❌ syncNow failed at stage: ${stage}`, error);
    }
    
    await setSyncStatus('error');
    
    // Provide user-friendly error message for schema errors
    const errorMessage = error.isSchemaError 
      ? error.message 
      : error.message || 'Unknown sync error';
    
    notifyListeners({ 
      type: 'status', 
      status: 'error',
      error: errorMessage,
      isSchemaError: error.isSchemaError || false,
    });
    
    return {
      ok: false,
      stage,
      error: errorMessage,
      isSchemaError: error.isSchemaError || false,
      stats: { pushed: 0, pulled: 0, failed: 0 },
      serverTime,
    };
  }
}
