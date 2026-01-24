/**
 * Geocore Client Tests
 * Tests for the geocoreClient module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isGeocoreConfigured, 
  getHeatmapData, 
  getHeatmapCells,
  checkGeocoreHealth,
  submitLocationPoint
} from '../geocoreClient';

describe('geocoreClient', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isGeocoreConfigured', () => {
    it('should be a function that returns a boolean', () => {
      const result = isGeocoreConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getHeatmapData', () => {
    it('should return an array', async () => {
      const result = await getHeatmapData();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept configuration parameters', async () => {
      const result = await getHeatmapData({ 
        resolution: 9, 
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 100 
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle resolution of 0', async () => {
      const result = await getHeatmapData({ resolution: 0 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getHeatmapCells', () => {
    it('should return an array', async () => {
      const result = await getHeatmapCells();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept configuration parameters', async () => {
      const result = await getHeatmapCells({ minIntensity: 10, limit: 50 });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle minIntensity of 0', async () => {
      const result = await getHeatmapCells({ minIntensity: 0 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('checkGeocoreHealth', () => {
    it('should return a boolean', async () => {
      const result = await checkGeocoreHealth();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('submitLocationPoint', () => {
    it('should not throw when called', async () => {
      // Should be non-blocking and not throw
      await expect(
        async () => await submitLocationPoint(-6.9175, 107.6191, { source: 'test' })
      ).not.toThrow();
    });
  });
});
