/**
 * Centralized data layer for Supabase queries
 * 
 * This module provides a single source of truth for all database operations
 * to ensure consistent data fetching, proper abort handling, and uniform
 * date/time range calculations.
 */

import { supabase } from './supabaseClient';

/**
 * Calculate UTC month range for date queries
 * @param {Date} date - Reference date (defaults to current date)
 * @returns {{ startISO: string, endISO: string }} ISO strings for start (inclusive) and end (exclusive) of month
 */
export function monthRangeUTC(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0)); // exclusive
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/**
 * Calculate local month range for date queries
 * Uses local timezone (e.g., WIB for Indonesia) for accurate month boundaries
 * @param {Date} date - Reference date (defaults to current date)
 * @returns {{ startISO: string, endISO: string }} ISO strings for start (inclusive) and end (exclusive) of month
 */
export function monthRangeLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 1, 0, 0, 0, 0); // exclusive
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/**
 * Calculate day range in local timezone
 * @param {Date} date - Reference date (defaults to current date)
 * @returns {{ startISO: string, endISO: string }} ISO strings for start and end of day
 */
export function dayRangeLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const start = new Date(y, m, d, 0, 0, 0, 0);
  const end = new Date(y, m, d, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/**
 * Fetch orders within a date range
 * @param {string} userId - User ID
 * @param {string} startISO - Start date (ISO string, inclusive)
 * @param {string} endISO - End date (ISO string, exclusive)
 * @param {Object} options - Optional parameters
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Array>} Array of order records
 */
export async function fetchOrdersInRange(userId, startISO, endISO, { signal } = {}) {
  let query = supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('created_at', { ascending: false });

  // supabase-js v2 supports abortSignal
  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch expenses within a date range
 * @param {string} userId - User ID
 * @param {string} startISO - Start date (ISO string, inclusive)
 * @param {string} endISO - End date (ISO string, exclusive)
 * @param {Object} options - Optional parameters
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Array>} Array of expense records
 */
export async function fetchExpensesInRange(userId, startISO, endISO, { signal } = {}) {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('created_at', { ascending: false });

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch both orders and expenses in parallel for a date range
 * @param {string} userId - User ID
 * @param {string} startISO - Start date (ISO string, inclusive)
 * @param {string} endISO - End date (ISO string, exclusive)
 * @param {Object} options - Optional parameters
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<{ orders: Array, expenses: Array }>}
 */
export async function fetchOrdersAndExpenses(userId, startISO, endISO, { signal } = {}) {
  const [orders, expenses] = await Promise.all([
    fetchOrdersInRange(userId, startISO, endISO, { signal }),
    fetchExpensesInRange(userId, startISO, endISO, { signal }),
  ]);
  return { orders, expenses };
}

/**
 * Fetch strategic spots with optional caching
 * @param {Object} options - Optional parameters
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 * @returns {Promise<Array>} Array of strategic spot records
 */
export async function fetchStrategicSpots({ signal } = {}) {
  let query = supabase
    .from('strategic_spots')
    .select('*');

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Simple in-memory cache for data
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

/**
 * Generate a cache key for user + month combination
 * @param {string} userId 
 * @param {string} monthKey - YYYY-MM format
 * @returns {string}
 */
export function getCacheKey(userId, monthKey) {
  return `${userId}:${monthKey}`;
}

/**
 * Get cached data if still valid
 * @param {string} key 
 * @returns {Object|null}
 */
export function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store data in cache
 * @param {string} key 
 * @param {Object} data 
 */
export function setInCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache (e.g., after data mutation)
 * @param {string} [key] - Optional specific key to clear; if omitted, clears all
 */
export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Clear all cache entries for a specific user
 * @param {string} userId 
 */
export function clearUserCache(userId) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      cache.delete(key);
    }
  }
}
