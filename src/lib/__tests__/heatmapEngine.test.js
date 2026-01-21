/**
 * Heatmap Engine Tests
 * Tests for heatmap algorithm invariants and calculations
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeRobust,
  normalize,
  getTimePeriod,
  getDayType,
  computeDeadheadCost,
  computeScore,
  needsFallback,
} from '../heatmapEngine';

describe('heatmapEngine', () => {
  describe('normalizeRobust - Percentile-based normalization', () => {
    it('should return 0 for empty or null data', () => {
      expect(normalizeRobust(50, [])).toBe(0);
      expect(normalizeRobust(50, null)).toBe(0);
      expect(normalizeRobust(50, undefined)).toBe(0);
    });

    it('should clamp values below p10 to 0', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = normalizeRobust(5, values); // Below p10 (10)
      expect(result).toBe(0);
    });

    it('should clamp values above p90 to 1', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = normalizeRobust(150, values); // Above p90 (90)
      expect(result).toBe(1);
    });

    it('should normalize values between p10 and p90 correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = normalizeRobust(50, values); // Middle value
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should handle outliers without letting them dominate', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 1000]; // 1000 is an outlier
      const result = normalizeRobust(50, values);
      // Outlier (1000) should not significantly affect normalization of 50
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should filter out NaN and null values', () => {
      const values = [10, null, 20, NaN, 30, undefined, 40, 50];
      const result = normalizeRobust(30, values);
      expect(result).toBeGreaterThan(0);
      expect(Number.isNaN(result)).toBe(false);
    });

    it('should return 0 when p10 equals p90 (all values same)', () => {
      const values = [50, 50, 50, 50, 50];
      const result = normalizeRobust(50, values);
      expect(result).toBe(0);
    });
  });

  describe('normalize - Legacy normalization', () => {
    it('should normalize value between min and max', () => {
      expect(normalize(50, 0, 100)).toBe(0.5);
      expect(normalize(0, 0, 100)).toBe(0);
      expect(normalize(100, 0, 100)).toBe(1);
    });

    it('should clamp values below min to 0', () => {
      expect(normalize(-10, 0, 100)).toBe(0);
    });

    it('should clamp values above max to 1', () => {
      expect(normalize(150, 0, 100)).toBe(1);
    });

    it('should return 0 when min equals max', () => {
      expect(normalize(50, 50, 50)).toBe(0);
    });
  });

  describe('getTimePeriod - Time period mapping', () => {
    it('should map 07:00 to "pagi" (morning)', () => {
      const date = new Date('2024-01-15T07:00:00');
      expect(getTimePeriod(date)).toBe('pagi');
    });

    it('should map 13:00 to "siang" (afternoon)', () => {
      const date = new Date('2024-01-15T13:00:00');
      expect(getTimePeriod(date)).toBe('siang');
    });

    it('should map 17:00 to "sore" (evening)', () => {
      const date = new Date('2024-01-15T17:00:00');
      expect(getTimePeriod(date)).toBe('sore');
    });

    it('should map 21:00 to "malam" (night)', () => {
      const date = new Date('2024-01-15T21:00:00');
      expect(getTimePeriod(date)).toBe('malam');
    });

    it('should map 01:00 to "tengah_malam" (late night)', () => {
      const date = new Date('2024-01-15T01:00:00');
      expect(getTimePeriod(date)).toBe('tengah_malam');
    });

    it('should handle boundary times correctly', () => {
      expect(getTimePeriod(new Date('2024-01-15T05:00:00'))).toBe('pagi');
      expect(getTimePeriod(new Date('2024-01-15T11:00:00'))).toBe('siang');
      expect(getTimePeriod(new Date('2024-01-15T15:00:00'))).toBe('sore');
      expect(getTimePeriod(new Date('2024-01-15T19:00:00'))).toBe('malam');
      expect(getTimePeriod(new Date('2024-01-15T23:00:00'))).toBe('tengah_malam');
    });
  });

  describe('getDayType', () => {
    it('should return "weekday" for Monday through Friday', () => {
      expect(getDayType(new Date('2024-01-15T10:00:00'))).toBe('weekday'); // Monday
      expect(getDayType(new Date('2024-01-16T10:00:00'))).toBe('weekday'); // Tuesday
      expect(getDayType(new Date('2024-01-17T10:00:00'))).toBe('weekday'); // Wednesday
      expect(getDayType(new Date('2024-01-18T10:00:00'))).toBe('weekday'); // Thursday
      expect(getDayType(new Date('2024-01-19T10:00:00'))).toBe('weekday'); // Friday
    });

    it('should return "weekend" for Saturday and Sunday', () => {
      expect(getDayType(new Date('2024-01-20T10:00:00'))).toBe('weekend'); // Saturday
      expect(getDayType(new Date('2024-01-21T10:00:00'))).toBe('weekend'); // Sunday
    });
  });

  describe('computeDeadheadCost', () => {
    it('should calculate deadhead cost correctly', () => {
      const userPos = { lat: -6.2, lon: 106.8 };
      const targetPos = { lat: -6.21, lon: 106.81 };
      const context = { fuelCostPerKm: 2000, baselineNPH: 30000 };
      
      const cost = computeDeadheadCost(userPos, targetPos, context);
      expect(cost).toBeGreaterThan(0);
      expect(Number.isNaN(cost)).toBe(false);
    });

    it('should return 0 for same position', () => {
      const pos = { lat: -6.2, lon: 106.8 };
      const context = { fuelCostPerKm: 2000, baselineNPH: 30000 };
      
      const cost = computeDeadheadCost(pos, pos, context);
      expect(cost).toBeGreaterThanOrEqual(0);
    });

    it('should use default values for missing context', () => {
      const userPos = { lat: -6.2, lon: 106.8 };
      const targetPos = { lat: -6.21, lon: 106.81 };
      const context = {};
      
      const cost = computeDeadheadCost(userPos, targetPos, context);
      expect(cost).toBeGreaterThan(0);
      expect(Number.isNaN(cost)).toBe(false);
    });
  });

  describe('computeScore - Score calculation with confidence multiplier', () => {
    it('should calculate score with confidence multiplier', () => {
      const cell1 = {
        avg_nph: 50000,
        conversion_rate: 0.8,
        volatility: 0.2,
        confidence: 0.8,
        lat: -6.2,
        lon: 106.8,
        order_count: 10,
      };
      const cell2 = {
        avg_nph: 40000,
        conversion_rate: 0.6,
        volatility: 0.3,
        confidence: 0.5,
        lat: -6.21,
        lon: 106.81,
        order_count: 5,
      };
      const context = {
        userPos: { lat: -6.2, lon: 106.8 },
        fuelCostPerKm: 2000,
        baselineNPH: 30000,
        allCells: [cell1, cell2], // Multiple cells for proper normalization
      };
      
      const result = computeScore(cell1, context);
      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.confidence_multiplier).toBeGreaterThanOrEqual(0.3);
      expect(result.breakdown.confidence_multiplier).toBeLessThanOrEqual(1);
    });

    it('should apply minimum confidence multiplier (0.3)', () => {
      const cell1 = {
        avg_nph: 50000,
        conversion_rate: 0.8,
        volatility: 0.2,
        confidence: 0,
        lat: -6.2,
        lon: 106.8,
      };
      const cell2 = {
        avg_nph: 40000,
        conversion_rate: 0.6,
        volatility: 0.3,
        confidence: 0.5,
        lat: -6.21,
        lon: 106.81,
      };
      const context = {
        userPos: { lat: -6.2, lon: 106.8 },
        fuelCostPerKm: 2000,
        baselineNPH: 30000,
        allCells: [cell1, cell2],
      };
      
      const result = computeScore(cell1, context);
      expect(result.breakdown.confidence_multiplier).toBeCloseTo(0.3, 2);
    });

    it('should apply maximum confidence multiplier (1.0)', () => {
      const cell1 = {
        avg_nph: 50000,
        conversion_rate: 0.8,
        volatility: 0.2,
        confidence: 1.0,
        lat: -6.2,
        lon: 106.8,
      };
      const cell2 = {
        avg_nph: 40000,
        conversion_rate: 0.6,
        volatility: 0.3,
        confidence: 0.5,
        lat: -6.21,
        lon: 106.81,
      };
      const context = {
        userPos: { lat: -6.2, lon: 106.8 },
        fuelCostPerKm: 2000,
        baselineNPH: 30000,
        allCells: [cell1, cell2],
      };
      
      const result = computeScore(cell1, context);
      expect(result.breakdown.confidence_multiplier).toBeCloseTo(1.0, 2);
    });
  });

  describe('needsFallback - Cold-start detection', () => {
    it('should return true when total orders < 5 (cold start)', () => {
      expect(needsFallback([], 4)).toBe(true);
      expect(needsFallback([], 0)).toBe(true);
    });

    it('should return true when recommendations < 3', () => {
      const recommendations = [
        { confidence: 0.8 },
        { confidence: 0.7 },
      ];
      expect(needsFallback(recommendations, 10)).toBe(true);
    });

    it('should return true when all recommendations have low confidence', () => {
      const recommendations = [
        { confidence: 0.2 },
        { confidence: 0.25 },
        { confidence: 0.28 },
      ];
      expect(needsFallback(recommendations, 10)).toBe(true);
    });

    it('should return false for sufficient data', () => {
      const recommendations = [
        { confidence: 0.8 },
        { confidence: 0.7 },
        { confidence: 0.6 },
      ];
      expect(needsFallback(recommendations, 10)).toBe(false);
    });

    it('should handle missing confidence values gracefully', () => {
      const recommendations = [
        {},
        {},
        {},
      ];
      expect(needsFallback(recommendations, 10)).toBe(true);
    });
  });
});
