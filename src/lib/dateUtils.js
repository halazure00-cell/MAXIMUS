/**
 * Date/Time utilities for consistent timezone handling
 * 
 * All financial apps need consistent date handling. This module provides:
 * - Local day key generation for daily grouping (WIB/local timezone)
 * - Input conversion for datetime-local fields
 * - Consistent "today" detection based on local timezone
 */

/**
 * Convert an ISO date string to a local day key (YYYY-MM-DD)
 * Uses the user's local timezone for grouping
 * 
 * @param {string|Date} dateISO - ISO date string or Date object
 * @returns {string} Day key in YYYY-MM-DD format (local timezone)
 */
export function toLocalDayKey(dateISO) {
  const d = dateISO instanceof Date ? dateISO : new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get today's date key in local timezone
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function getTodayKey() {
  return toLocalDayKey(new Date());
}

/**
 * Check if a date is today in local timezone
 * @param {string|Date} dateISO - ISO date string or Date object
 * @returns {boolean}
 */
export function isToday(dateISO) {
  return toLocalDayKey(dateISO) === getTodayKey();
}

/**
 * Get the start and end of today in local timezone as ISO strings
 * @returns {{ startISO: string, endISO: string }}
 */
export function getTodayRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  
  const start = new Date(y, m, d, 0, 0, 0, 0);
  const end = new Date(y, m, d, 23, 59, 59, 999);
  
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

/**
 * Get the month key for a date (YYYY-MM)
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} Month key in YYYY-MM format
 */
export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Convert a datetime-local input value to ISO string
 * datetime-local gives us "YYYY-MM-DDTHH:mm" without timezone
 * This treats the value as local time and converts to ISO/UTC
 * 
 * @param {string} value - datetime-local input value (e.g., "2026-01-17T21:30")
 * @returns {string} ISO string representation
 */
export function localDateTimeToISO(value) {
  if (!value) return '';
  // Parsing "YYYY-MM-DDTHH:mm" directly creates a local time Date
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

/**
 * Convert an ISO string to datetime-local input format
 * Returns the local time representation suitable for <input type="datetime-local">
 * 
 * @param {string} iso - ISO date string from database
 * @returns {string} Format: "YYYY-MM-DDTHH:mm" in local timezone
 */
export function isoToLocalDateTimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

/**
 * Format a date for display in local timezone
 * @param {string|Date} dateISO - ISO date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatLocalDate(dateISO, options = {}) {
  const d = dateISO instanceof Date ? dateISO : new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return d.toLocaleDateString('id-ID', defaultOptions);
}

/**
 * Format time only in local timezone
 * @param {string|Date} dateISO - ISO date string or Date object
 * @returns {string} Time in HH:mm format
 */
export function formatLocalTime(dateISO) {
  const d = dateISO instanceof Date ? dateISO : new Date(dateISO);
  if (isNaN(d.getTime())) return '--:--';
  
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Check if a date falls within a range (inclusive)
 * @param {string|Date} dateISO - Date to check
 * @param {Date} start - Range start
 * @param {Date} end - Range end
 * @returns {boolean}
 */
export function isWithinRange(dateISO, start, end) {
  const d = dateISO instanceof Date ? dateISO : new Date(dateISO);
  if (isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

/**
 * Parse an ISO date string safely
 * @param {string} value - Date string to parse
 * @returns {Date|null} Parsed Date or null if invalid
 */
export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
