/**
 * Local Database Layer using IndexedDB
 * Provides offline-first storage for transactions and sync queue
 */

import { openDB } from 'idb';

const DB_NAME = 'maximus_local';
const DB_VERSION = 3; // Bumped to add heatmap_cache store

let dbPromise = null;

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== 'undefined';
  } catch (error) {
    return false;
  }
}

/**
 * Initialize IndexedDB with all required stores
 */
export async function initLocalDb() {
  if (!isIndexedDBAvailable()) {
    console.warn('[localDb] IndexedDB not available - offline features disabled');
    throw new Error('IndexedDB not available');
  }
  
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create orders_cache store
      if (!db.objectStoreNames.contains('orders_cache')) {
        const ordersStore = db.createObjectStore('orders_cache', { 
          keyPath: 'client_tx_id' 
        });
        ordersStore.createIndex('user_id', 'user_id');
        ordersStore.createIndex('created_at', 'created_at');
        ordersStore.createIndex('updated_at', 'updated_at');
        ordersStore.createIndex('deleted_at', 'deleted_at');
      }

      // Create expenses_cache store
      if (!db.objectStoreNames.contains('expenses_cache')) {
        const expensesStore = db.createObjectStore('expenses_cache', { 
          keyPath: 'client_tx_id' 
        });
        expensesStore.createIndex('user_id', 'user_id');
        expensesStore.createIndex('created_at', 'created_at');
        expensesStore.createIndex('updated_at', 'updated_at');
        expensesStore.createIndex('deleted_at', 'deleted_at');
      }

      // Create oplog store (operation log for sync queue)
      if (!db.objectStoreNames.contains('oplog')) {
        const oplogStore = db.createObjectStore('oplog', { 
          keyPath: 'op_id',
          autoIncrement: true 
        });
        oplogStore.createIndex('created_at', 'created_at');
        oplogStore.createIndex('table', 'table');
      }

      // Create meta store for sync metadata
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      // V2: Create failed_ops store (for operations that exceeded max retries)
      if (oldVersion < 2 && !db.objectStoreNames.contains('failed_ops')) {
        const failedOpsStore = db.createObjectStore('failed_ops', { 
          keyPath: 'op_id',
          autoIncrement: true 
        });
        failedOpsStore.createIndex('created_at', 'created_at');
        failedOpsStore.createIndex('table', 'table');
        failedOpsStore.createIndex('failed_at', 'failed_at');
      }

      // V3: Create heatmap_cache store (for driver recommendations)
      if (oldVersion < 3 && !db.objectStoreNames.contains('heatmap_cache')) {
        const heatmapStore = db.createObjectStore('heatmap_cache', { 
          keyPath: 'id' 
        });
        heatmapStore.createIndex('cell_id', 'cell_id');
        heatmapStore.createIndex('hour_bucket', 'hour_bucket');
        heatmapStore.createIndex('day_type', 'day_type');
        heatmapStore.createIndex('expires_at', 'expires_at');
        heatmapStore.createIndex('fetched_at', 'fetched_at');
      }
    },
  });

  return dbPromise;
}

/**
 * Get database instance
 */
async function getDb() {
  if (!dbPromise) {
    await initLocalDb();
  }
  return dbPromise;
}

// ==================== META OPERATIONS ====================

/**
 * Get metadata value
 */
export async function getMetaValue(key) {
  const db = await getDb();
  const value = await db.get('meta', key);
  return value?.value;
}

/**
 * Set metadata value
 */
export async function setMetaValue(key, value) {
  const db = await getDb();
  await db.put('meta', { key, value });
}

/**
 * Get device ID (generate if not exists)
 */
export async function getDeviceId() {
  let deviceId = await getMetaValue('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await setMetaValue('device_id', deviceId);
  }
  return deviceId;
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncAt() {
  return await getMetaValue('last_sync_at');
}

/**
 * Set last sync timestamp
 */
export async function setLastSyncAt(timestamp) {
  await setMetaValue('last_sync_at', timestamp);
}

/**
 * Get sync status
 */
export async function getSyncStatus() {
  return (await getMetaValue('sync_status')) || 'idle';
}

/**
 * Set sync status
 */
export async function setSyncStatus(status) {
  await setMetaValue('sync_status', status);
}

// ==================== CACHE OPERATIONS ====================

/**
 * Get all orders from cache (excluding soft-deleted)
 */
export async function getCachedOrders(userId, options = {}) {
  const db = await getDb();
  const tx = db.transaction('orders_cache', 'readonly');
  const index = tx.store.index('user_id');
  
  let orders = await index.getAll(userId);
  
  // Filter out soft-deleted unless explicitly requested
  if (!options.includeDeleted) {
    orders = orders.filter(o => !o.deleted_at);
  }
  
  return orders;
}

/**
 * Get all expenses from cache (excluding soft-deleted)
 */
export async function getCachedExpenses(userId, options = {}) {
  const db = await getDb();
  const tx = db.transaction('expenses_cache', 'readonly');
  const index = tx.store.index('user_id');
  
  let expenses = await index.getAll(userId);
  
  if (!options.includeDeleted) {
    expenses = expenses.filter(e => !e.deleted_at);
  }
  
  return expenses;
}

/**
 * Get single order by client_tx_id
 */
export async function getCachedOrder(clientTxId) {
  const db = await getDb();
  return await db.get('orders_cache', clientTxId);
}

/**
 * Get single expense by client_tx_id
 */
export async function getCachedExpense(clientTxId) {
  const db = await getDb();
  return await db.get('expenses_cache', clientTxId);
}

/**
 * Put order in cache
 */
export async function putCachedOrder(order) {
  const db = await getDb();
  await db.put('orders_cache', {
    ...order,
    updated_at: order.updated_at || new Date().toISOString(),
  });
}

/**
 * Put expense in cache
 */
export async function putCachedExpense(expense) {
  const db = await getDb();
  await db.put('expenses_cache', {
    ...expense,
    updated_at: expense.updated_at || new Date().toISOString(),
  });
}

/**
 * Soft delete order in cache
 */
export async function softDeleteCachedOrder(clientTxId) {
  const db = await getDb();
  const order = await db.get('orders_cache', clientTxId);
  if (order) {
    order.deleted_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();
    await db.put('orders_cache', order);
  }
}

/**
 * Soft delete expense in cache
 */
export async function softDeleteCachedExpense(clientTxId) {
  const db = await getDb();
  const expense = await db.get('expenses_cache', clientTxId);
  if (expense) {
    expense.deleted_at = new Date().toISOString();
    expense.updated_at = new Date().toISOString();
    await db.put('expenses_cache', expense);
  }
}

/**
 * Clear all cached orders for a user
 */
export async function clearCachedOrders(userId) {
  const db = await getDb();
  const tx = db.transaction('orders_cache', 'readwrite');
  const index = tx.store.index('user_id');
  const orders = await index.getAll(userId);
  
  for (const order of orders) {
    await tx.store.delete(order.client_tx_id);
  }
  
  await tx.done;
}

/**
 * Clear all cached expenses for a user
 */
export async function clearCachedExpenses(userId) {
  const db = await getDb();
  const tx = db.transaction('expenses_cache', 'readwrite');
  const index = tx.store.index('user_id');
  const expenses = await index.getAll(userId);
  
  for (const expense of expenses) {
    await tx.store.delete(expense.client_tx_id);
  }
  
  await tx.done;
}

// ==================== OPLOG OPERATIONS ====================

/**
 * Add operation to queue
 */
export async function addToOplog(operation) {
  const db = await getDb();
  const op = {
    ...operation,
    created_at: new Date().toISOString(),
    retry_count: 0,
    last_error: null,
  };
  
  const opId = await db.add('oplog', op);
  return opId;
}

/**
 * Get all pending operations
 */
export async function getPendingOps() {
  const db = await getDb();
  const ops = await db.getAll('oplog');
  return ops.sort((a, b) => a.op_id - b.op_id); // FIFO order
}

/**
 * Remove operation from queue
 */
export async function removeFromOplog(opId) {
  const db = await getDb();
  await db.delete('oplog', opId);
}

/**
 * Update operation retry count and error
 */
export async function updateOplogRetry(opId, error) {
  const db = await getDb();
  const op = await db.get('oplog', opId);
  if (op) {
    op.retry_count = (op.retry_count || 0) + 1;
    op.last_error = error;
    await db.put('oplog', op);
  }
}

/**
 * Clear all operations
 */
export async function clearOplog() {
  const db = await getDb();
  await db.clear('oplog');
}

/**
 * Get oplog count
 */
export async function getOplogCount() {
  const db = await getDb();
  return await db.count('oplog');
}

// ==================== FAILED OPS OPERATIONS ====================

/**
 * Move operation to failed_ops (max retries exceeded)
 */
export async function moveToFailedOps(op) {
  const db = await getDb();
  const failedOp = {
    ...op,
    failed_at: new Date().toISOString(),
  };
  await db.add('failed_ops', failedOp);
}

/**
 * Get all failed operations
 */
export async function getFailedOps() {
  const db = await getDb();
  return await db.getAll('failed_ops');
}

/**
 * Get failed ops count
 */
export async function getFailedOpsCount() {
  const db = await getDb();
  return await db.count('failed_ops');
}

/**
 * Remove failed operation
 */
export async function removeFailedOp(opId) {
  const db = await getDb();
  await db.delete('failed_ops', opId);
}

/**
 * Retry a failed operation (move back to oplog)
 */
export async function retryFailedOp(opId) {
  const db = await getDb();
  const failedOp = await db.get('failed_ops', opId);
  if (failedOp) {
    // Reset retry count and move back to oplog
    const op = {
      ...failedOp,
      retry_count: 0,
      last_error: null,
    };
    delete op.failed_at;
    delete op.op_id; // Let auto-increment assign new ID
    
    await db.add('oplog', op);
    await db.delete('failed_ops', opId);
  }
}

/**
 * Clear all failed operations
 */
export async function clearFailedOps() {
  const db = await getDb();
  await db.clear('failed_ops');
}

// ==================== UTILITY ====================

/**
 * Clear all local data (for logout or reset)
 */
export async function clearAllLocalData() {
  const db = await getDb();
  await Promise.all([
    db.clear('orders_cache'),
    db.clear('expenses_cache'),
    db.clear('oplog'),
    db.clear('failed_ops'),
    db.clear('meta'),
    db.clear('heatmap_cache'),
  ]);
}

/**
 * Get database stats
 */
export async function getDbStats() {
  const db = await getDb();
  const [ordersCount, expensesCount, oplogCount, failedOpsCount, heatmapCount] = await Promise.all([
    db.count('orders_cache'),
    db.count('expenses_cache'),
    db.count('oplog'),
    db.count('failed_ops'),
    db.count('heatmap_cache'),
  ]);
  
  return {
    ordersCount,
    expensesCount,
    oplogCount,
    failedOpsCount,
    heatmapCount,
    lastSync: await getLastSyncAt(),
    syncStatus: await getSyncStatus(),
  };
}

// ==================== HEATMAP CACHE OPERATIONS ====================

/**
 * Cache heatmap cells
 * @param {array} cells - Array of cell objects
 * @param {number} ttlHours - Time to live in hours (default: 1)
 */
export async function cacheHeatmapCells(cells, ttlHours = 1) {
  const db = await getDb();
  const now = Date.now();
  const expiresAt = now + (ttlHours * 60 * 60 * 1000);
  
  const tx = db.transaction('heatmap_cache', 'readwrite');
  const store = tx.objectStore('heatmap_cache');
  
  for (const cell of cells) {
    const cachedCell = {
      id: `cell_${cell.cell_id || cell.spot_id}_${cell.time_period || cell.hour_bucket || 'siang'}_${cell.day_type}`,
      cell_id: cell.cell_id || cell.spot_id,
      time_period: cell.time_period || 'siang',
      day_type: cell.day_type,
      score: cell.score || 0,
      avg_nph: cell.avg_nph || 0,
      confidence: cell.confidence || 0,
      metadata: {
        order_count: cell.order_count || 0,
        conversion_rate: cell.conversion_rate || 0,
        volatility: cell.volatility || 0,
        lat: cell.lat || cell.latitude,
        lon: cell.lon || cell.longitude,
        spot_name: cell.spot_name || cell.name,
        category: cell.category,
        is_estimate: cell.is_estimate || false,
      },
      fetched_at: now,
      expires_at: expiresAt,
    };
    
    await store.put(cachedCell);
  }
  
  await tx.done;
}

/**
 * Get cached heatmap cells
 * @param {object} filter - Filter {time_period, day_type}
 * @returns {array} Array of cached cells (only non-expired)
 */
export async function getCachedHeatmapCells(filter = {}) {
  const db = await getDb();
  const now = Date.now();
  let cells = await db.getAll('heatmap_cache');
  
  // Filter expired cells
  cells = cells.filter(cell => cell.expires_at > now);
  
  // Apply filters
  if (filter.time_period !== undefined) {
    cells = cells.filter(cell => cell.time_period === filter.time_period);
  }
  
  if (filter.day_type) {
    cells = cells.filter(cell => cell.day_type === filter.day_type);
  }
  
  return cells;
}

/**
 * Clear expired heatmap cache entries
 */
export async function clearExpiredHeatmapCache() {
  const db = await getDb();
  const now = Date.now();
  
  // Get all expired entries
  const tx = db.transaction('heatmap_cache', 'readwrite');
  const store = tx.objectStore('heatmap_cache');
  const index = store.index('expires_at');
  
  let cursor = await index.openCursor();
  
  while (cursor) {
    if (cursor.value.expires_at <= now) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
  
  await tx.done;
}

/**
 * Clear all heatmap cache
 */
export async function clearHeatmapCache() {
  const db = await getDb();
  await db.clear('heatmap_cache');
}
