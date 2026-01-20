/**
 * Finance Metrics Helper
 * Provides aggregation functions for financial calculations
 */

import { getTodayKey, toLocalDayKey } from './dateUtils';

/**
 * Parse a numeric value safely
 */
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Sum expenses by category with optional scope filtering
 * @param {Array} expenses - Array of expense objects
 * @param {string} category - Category to filter by (e.g., 'Bensin', 'Makan')
 * @param {Object} options - Options object
 * @param {string} options.scope - 'day' for today only, 'month' for current month
 * @returns {number} Total amount for the category
 */
export function sumExpensesByCategory(expenses, category, options = {}) {
  if (!Array.isArray(expenses)) return 0;
  
  const { scope } = options;
  
  // First, filter out deleted expenses
  let filteredExpenses = expenses.filter(expense => {
    return expense && !expense.deleted_at;
  });
  
  // Apply scope filter if needed
  if (scope === 'day') {
    const todayKey = getTodayKey();
    filteredExpenses = filteredExpenses.filter(expense => {
      return toLocalDayKey(expense.created_at) === todayKey;
    });
  }
  // For month scope, expenses array should already be scoped to current month
  
  // Filter by category and sum amounts
  return filteredExpenses
    .filter(expense => {
      // Case-insensitive category comparison
      return expense.category?.toLowerCase() === category?.toLowerCase();
    })
    .reduce((sum, expense) => sum + parseNumber(expense.amount), 0);
}

/**
 * Get fuel expense metrics for day and month
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Object with fuelToday and fuelMonth
 */
export function getFuelMetrics(expenses) {
  return {
    fuelToday: sumExpensesByCategory(expenses, 'Bensin', { scope: 'day' }),
    fuelMonth: sumExpensesByCategory(expenses, 'Bensin', { scope: 'month' })
  };
}
