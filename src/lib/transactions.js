/**
 * Transaction utilities for normalizing and processing orders/expenses
 * 
 * Provides a unified interface for handling mixed transaction types,
 * making sorting, filtering, and display consistent across the app.
 */

import { toLocalDayKey } from './dateUtils';

/**
 * Normalize orders and expenses into a unified transaction array
 * 
 * @param {Array} orders - Array of order records
 * @param {Array} expenses - Array of expense records
 * @param {Object} options - Configuration options
 * @param {Function} options.getNetProfit - Function to calculate net profit from order
 * @returns {Array} Unified transaction array sorted by created_at desc
 */
export function normalizeTransactions(orders, expenses, { getNetProfit = defaultGetNetProfit } = {}) {
  const normalizedOrders = (orders || []).map(order => ({
    id: order.id,
    kind: 'order',
    type: 'income', // for backward compatibility
    created_at: order.created_at,
    amount: getNetProfit(order),
    displayAmount: getNetProfit(order),
    category: 'Order',
    note: order.distance ? `${order.distance} km` : '',
    raw: order,
    // Additional fields that might be useful
    dayKey: toLocalDayKey(order.created_at),
  }));

  const normalizedExpenses = (expenses || []).map(expense => ({
    id: expense.id,
    kind: 'expense',
    type: 'expense', // for backward compatibility
    created_at: expense.created_at,
    amount: parseFloat(expense.amount) || 0,
    displayAmount: parseFloat(expense.amount) || 0,
    category: expense.category || 'Lainnya',
    note: expense.note || expense.description || '',
    raw: expense,
    dayKey: toLocalDayKey(expense.created_at),
  }));

  // Combine and sort by created_at descending
  return [...normalizedOrders, ...normalizedExpenses].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Default function to get net profit from an order
 * Can be overridden with custom logic that considers settings
 * 
 * @param {Object} order - Order record
 * @returns {number} Net profit value
 */
function defaultGetNetProfit(order) {
  const storedNet = parseFloat(order.net_profit);
  if (Number.isFinite(storedNet)) return storedNet;
  
  const fallbackPrice = parseFloat(order.price);
  if (Number.isFinite(fallbackPrice)) return fallbackPrice;
  
  return 0;
}

/**
 * Group transactions by day key
 * 
 * @param {Array} transactions - Normalized transaction array
 * @returns {Object} Object keyed by dayKey with arrays of transactions
 */
export function groupByDay(transactions) {
  return transactions.reduce((acc, tx) => {
    const key = tx.dayKey;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(tx);
    return acc;
  }, {});
}

/**
 * Calculate daily recap from transactions
 * 
 * @param {Array} transactions - Normalized transaction array
 * @returns {Array} Array of daily recap objects sorted by date desc
 */
export function calculateDailyRecap(transactions) {
  const byDay = groupByDay(transactions);
  
  const recap = Object.entries(byDay).map(([dayKey, txs]) => {
    const income = txs
      .filter(tx => tx.kind === 'order')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = txs
      .filter(tx => tx.kind === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      dayKey,
      date: new Date(txs[0].created_at), // Use first transaction's date
      income,
      expense,
      net: income - expense,
      orderCount: txs.filter(tx => tx.kind === 'order').length,
      expenseCount: txs.filter(tx => tx.kind === 'expense').length,
    };
  });
  
  // Sort by date descending
  return recap.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Filter transactions by kind
 * 
 * @param {Array} transactions - Normalized transaction array
 * @param {'order' | 'expense'} kind - Transaction kind to filter by
 * @returns {Array} Filtered transactions
 */
export function filterByKind(transactions, kind) {
  return transactions.filter(tx => tx.kind === kind);
}

/**
 * Calculate totals from transactions
 * 
 * @param {Array} transactions - Normalized transaction array
 * @returns {Object} Totals object
 */
export function calculateTotals(transactions) {
  const orders = filterByKind(transactions, 'order');
  const expenses = filterByKind(transactions, 'expense');
  
  const totalIncome = orders.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  
  return {
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    orderCount: orders.length,
    expenseCount: expenses.length,
  };
}
