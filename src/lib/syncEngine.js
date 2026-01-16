/**
 * Sync Engine
 * Handles bidirectional sync between local cache and Supabase
 */

import { supabase } from './supabaseClient';
import {
  getPendingOps,
  removeFromOplog,
  updateOplogRetry,
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

// Maximum retry count before giving up
const MAX_RETRIES = 3;

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
      
      // Update retry count
      await updateOplogRetry(op.op_id, error.message);
      
      // If max retries exceeded, remove from queue
      if ((op.retry_count || 0) >= MAX_RETRIES) {
        console.error('[syncEngine] Max retries exceeded, removing op:', op);
        await removeFromOplog(op.op_id);
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
  
  // Remove id if it's a new record (let DB generate it)
  // But keep client_tx_id for upsert matching
  if (!data.id || typeof data.id === 'string') {
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
    
    // Apply to cache
    let ordersUpdated = 0;
    let expensesUpdated = 0;
    
    for (const order of orders || []) {
      await applyOrderToCache(order);
      ordersUpdated++;
    }
    
    for (const expense of expenses || []) {
      await applyExpenseToCache(expense);
      expensesUpdated++;
    }
    
    // Update last sync timestamp
    await setLastSyncAt(new Date().toISOString());
    
    return {
      success: true,
      ordersUpdated,
      expensesUpdated,
    };
  } catch (error) {
    console.error('[syncEngine] Pull failed:', error);
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
      // Strategy: Last-Write-Wins (server wins)
      console.warn('[syncEngine] Conflict detected for order:', order.client_tx_id, 'Server wins');
      notifyListeners({
        type: 'conflict',
        table: 'orders',
        clientTxId: order.client_tx_id,
        resolution: 'server-wins',
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
      console.warn('[syncEngine] Conflict detected for expense:', expense.client_tx_id, 'Server wins');
      notifyListeners({
        type: 'conflict',
        table: 'expenses',
        clientTxId: expense.client_tx_id,
        resolution: 'server-wins',
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
