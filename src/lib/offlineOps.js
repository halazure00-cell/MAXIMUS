/**
 * Offline Operations Layer
 * Handles optimistic writes to local cache and queues operations for sync
 */

import {
  putCachedOrder,
  putCachedExpense,
  softDeleteCachedOrder,
  softDeleteCachedExpense,
  getCachedOrder,
  getCachedExpense,
  addToOplog,
} from './localDb';

/**
 * Generate a new client transaction ID
 */
function generateClientTxId() {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
function nowISO() {
  return new Date().toISOString();
}

// ==================== ORDER OPERATIONS ====================

/**
 * Create a new order (offline-first)
 * @param {Object} orderData - Order data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created order with client_tx_id
 */
export async function createOrder(orderData, userId) {
  const clientTxId = generateClientTxId();
  const now = nowISO();
  
  const order = {
    ...orderData,
    client_tx_id: clientTxId,
    user_id: userId,
    created_at: orderData.created_at || now,
    updated_at: now,
    deleted_at: null,
  };
  
  // Write to cache immediately (optimistic)
  await putCachedOrder(order);
  
  // Queue for sync
  await addToOplog({
    table: 'orders',
    op: 'upsert',
    client_tx_id: clientTxId,
    payload: order,
    base_updated_at: now,
  });
  
  return order;
}

/**
 * Update an existing order (offline-first)
 * @param {string} clientTxId - Client transaction ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrder(clientTxId, updates) {
  const existing = await getCachedOrder(clientTxId);
  if (!existing) {
    throw new Error(`Order not found: ${clientTxId}`);
  }
  
  const now = nowISO();
  const updated = {
    ...existing,
    ...updates,
    updated_at: now,
    // Don't allow overwriting these fields
    client_tx_id: existing.client_tx_id,
    user_id: existing.user_id,
    created_at: existing.created_at,
  };
  
  // Write to cache
  await putCachedOrder(updated);
  
  // Queue for sync
  await addToOplog({
    table: 'orders',
    op: 'upsert',
    client_tx_id: clientTxId,
    payload: updated,
    base_updated_at: existing.updated_at,
  });
  
  return updated;
}

/**
 * Soft delete an order (offline-first)
 * @param {string} clientTxId - Client transaction ID
 * @returns {Promise<void>}
 */
export async function deleteOrder(clientTxId) {
  const existing = await getCachedOrder(clientTxId);
  if (!existing) {
    throw new Error(`Order not found: ${clientTxId}`);
  }
  
  const now = nowISO();
  
  // Soft delete in cache
  await softDeleteCachedOrder(clientTxId);
  
  // Queue for sync
  await addToOplog({
    table: 'orders',
    op: 'delete',
    client_tx_id: clientTxId,
    payload: {
      client_tx_id: clientTxId,
      user_id: existing.user_id,
      deleted_at: now,
      updated_at: now,
    },
    base_updated_at: existing.updated_at,
  });
}

// ==================== EXPENSE OPERATIONS ====================

/**
 * Create a new expense (offline-first)
 * @param {Object} expenseData - Expense data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created expense with client_tx_id
 */
export async function createExpense(expenseData, userId) {
  const clientTxId = generateClientTxId();
  const now = nowISO();
  
  const expense = {
    ...expenseData,
    client_tx_id: clientTxId,
    user_id: userId,
    created_at: expenseData.created_at || now,
    updated_at: now,
    deleted_at: null,
  };
  
  // Write to cache immediately (optimistic)
  await putCachedExpense(expense);
  
  // Queue for sync
  await addToOplog({
    table: 'expenses',
    op: 'upsert',
    client_tx_id: clientTxId,
    payload: expense,
    base_updated_at: now,
  });
  
  return expense;
}

/**
 * Update an existing expense (offline-first)
 * @param {string} clientTxId - Client transaction ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated expense
 */
export async function updateExpense(clientTxId, updates) {
  const existing = await getCachedExpense(clientTxId);
  if (!existing) {
    throw new Error(`Expense not found: ${clientTxId}`);
  }
  
  const now = nowISO();
  const updated = {
    ...existing,
    ...updates,
    updated_at: now,
    // Don't allow overwriting these fields
    client_tx_id: existing.client_tx_id,
    user_id: existing.user_id,
    created_at: existing.created_at,
  };
  
  // Write to cache
  await putCachedExpense(updated);
  
  // Queue for sync
  await addToOplog({
    table: 'expenses',
    op: 'upsert',
    client_tx_id: clientTxId,
    payload: updated,
    base_updated_at: existing.updated_at,
  });
  
  return updated;
}

/**
 * Soft delete an expense (offline-first)
 * @param {string} clientTxId - Client transaction ID
 * @returns {Promise<void>}
 */
export async function deleteExpense(clientTxId) {
  const existing = await getCachedExpense(clientTxId);
  if (!existing) {
    throw new Error(`Expense not found: ${clientTxId}`);
  }
  
  const now = nowISO();
  
  // Soft delete in cache
  await softDeleteCachedExpense(clientTxId);
  
  // Queue for sync
  await addToOplog({
    table: 'expenses',
    op: 'delete',
    client_tx_id: clientTxId,
    payload: {
      client_tx_id: clientTxId,
      user_id: existing.user_id,
      deleted_at: now,
      updated_at: now,
    },
    base_updated_at: existing.updated_at,
  });
}

// ==================== MIGRATION HELPERS ====================

/**
 * Import existing data from Supabase into cache
 * Used for initial sync or when switching to offline-first mode
 * @param {Array} orders - Orders from Supabase
 * @param {Array} expenses - Expenses from Supabase
 */
export async function importFromSupabase(orders, expenses) {
  // Import orders
  for (const order of orders) {
    const cacheOrder = {
      ...order,
      // Generate client_tx_id if not present (for old records)
      client_tx_id: order.client_tx_id || crypto.randomUUID(),
      updated_at: order.updated_at || order.created_at || new Date().toISOString(),
      deleted_at: order.deleted_at || null,
    };
    await putCachedOrder(cacheOrder);
  }
  
  // Import expenses
  for (const expense of expenses) {
    const cacheExpense = {
      ...expense,
      client_tx_id: expense.client_tx_id || crypto.randomUUID(),
      updated_at: expense.updated_at || expense.created_at || new Date().toISOString(),
      deleted_at: expense.deleted_at || null,
    };
    await putCachedExpense(cacheExpense);
  }
}
