/**
 * Finance Metrics Tests
 * Tests for profit, fee, and net calculations
 */

import { describe, it, expect } from 'vitest';
import { sumExpensesByCategory, getFuelMetrics } from '../financeMetrics';

describe('financeMetrics', () => {
  describe('sumExpensesByCategory', () => {
    it('should return 0 for empty expenses array', () => {
      const result = sumExpensesByCategory([], 'Bensin');
      expect(result).toBe(0);
    });

    it('should return 0 for null or undefined expenses', () => {
      expect(sumExpensesByCategory(null, 'Bensin')).toBe(0);
      expect(sumExpensesByCategory(undefined, 'Bensin')).toBe(0);
    });

    it('should sum expenses correctly for a specific category', () => {
      const expenses = [
        { category: 'Bensin', amount: 50000, created_at: '2024-01-15T10:00:00Z' },
        { category: 'Bensin', amount: 30000, created_at: '2024-01-15T11:00:00Z' },
        { category: 'Makan', amount: 20000, created_at: '2024-01-15T12:00:00Z' },
      ];
      
      const result = sumExpensesByCategory(expenses, 'Bensin');
      expect(result).toBe(80000);
    });

    it('should handle case-insensitive category matching', () => {
      const expenses = [
        { category: 'Bensin', amount: 50000, created_at: '2024-01-15T10:00:00Z' },
        { category: 'bensin', amount: 30000, created_at: '2024-01-15T11:00:00Z' },
        { category: 'BENSIN', amount: 20000, created_at: '2024-01-15T12:00:00Z' },
      ];
      
      const result = sumExpensesByCategory(expenses, 'Bensin');
      expect(result).toBe(100000);
    });

    it('should filter out deleted expenses', () => {
      const expenses = [
        { category: 'Bensin', amount: 50000, created_at: '2024-01-15T10:00:00Z' },
        { category: 'Bensin', amount: 30000, created_at: '2024-01-15T11:00:00Z', deleted_at: '2024-01-15T12:00:00Z' },
      ];
      
      const result = sumExpensesByCategory(expenses, 'Bensin');
      expect(result).toBe(50000);
    });

    it('should handle null, undefined, and empty string amounts', () => {
      const expenses = [
        { category: 'Bensin', amount: 50000, created_at: '2024-01-15T10:00:00Z' },
        { category: 'Bensin', amount: null, created_at: '2024-01-15T11:00:00Z' },
        { category: 'Bensin', amount: undefined, created_at: '2024-01-15T12:00:00Z' },
        { category: 'Bensin', amount: '', created_at: '2024-01-15T13:00:00Z' },
        { category: 'Bensin', amount: 30000, created_at: '2024-01-15T14:00:00Z' },
      ];
      
      const result = sumExpensesByCategory(expenses, 'Bensin');
      expect(result).toBe(80000);
    });

    it('should handle invalid numeric amounts gracefully', () => {
      const expenses = [
        { category: 'Bensin', amount: 50000, created_at: '2024-01-15T10:00:00Z' },
        { category: 'Bensin', amount: 'invalid', created_at: '2024-01-15T11:00:00Z' },
        { category: 'Bensin', amount: NaN, created_at: '2024-01-15T12:00:00Z' },
      ];
      
      const result = sumExpensesByCategory(expenses, 'Bensin');
      expect(result).toBe(50000);
      expect(Number.isNaN(result)).toBe(false);
    });
  });

  describe('getFuelMetrics', () => {
    it('should return 0 for fuelToday and fuelMonth with empty expenses', () => {
      const result = getFuelMetrics([]);
      expect(result.fuelToday).toBe(0);
      expect(result.fuelMonth).toBe(0);
    });

    it('should return fuel metrics for day and month scopes', () => {
      const today = new Date().toISOString().split('T')[0];
      const expenses = [
        { category: 'Bensin', amount: 50000, created_at: `${today}T10:00:00Z` },
        { category: 'Bensin', amount: 30000, created_at: `${today}T11:00:00Z` },
      ];
      
      const result = getFuelMetrics(expenses);
      expect(result.fuelToday).toBeGreaterThan(0);
      expect(result.fuelMonth).toBeGreaterThan(0);
    });

    it('should never return NaN values', () => {
      const expenses = [
        { category: 'Bensin', amount: null, created_at: '2024-01-15T10:00:00Z' },
        { category: 'Bensin', amount: undefined, created_at: '2024-01-15T11:00:00Z' },
      ];
      
      const result = getFuelMetrics(expenses);
      expect(Number.isNaN(result.fuelToday)).toBe(false);
      expect(Number.isNaN(result.fuelMonth)).toBe(false);
    });
  });
});
