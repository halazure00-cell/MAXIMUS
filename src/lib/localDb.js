/**
 * Local Database Layer using IndexedDB
 * Provides offline-first storage for transactions and sync queue
 */

import { openDB } from 'idb';

const DB_NAME = 'maximus_local';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Initialize IndexedDB with all required stores
 */
export async function initLocalDb() {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
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
    db.clear('meta'),
  ]);
}

/**
 * Get database stats
 */
export async function getDbStats() {
  const db = await getDb();
  const [ordersCount, expensesCount, oplogCount] = await Promise.all([
    db.count('orders_cache'),
    db.count('expenses_cache'),
    db.count('oplog'),
  ]);
  
  return {
    ordersCount,
    expensesCount,
    oplogCount,
    lastSync: await getLastSyncAt(),
    syncStatus: await getSyncStatus(),
  };
}
