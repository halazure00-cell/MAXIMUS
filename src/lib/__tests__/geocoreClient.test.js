/**
 * Geocore Client Tests
 * Tests for the geocoreClient module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isGeocoreConfigured, 
  getHeatmapData, 
  getHeatmapCells,
  checkGeocoreHealth 
} from '../geocoreClient';

describe('geocoreClient', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isGeocoreConfigured', () => {
    it('should return false when env vars are not set', () => {
      // Simulate missing env vars
      import.meta.env.VITE_GEOCORE_API_URL = '';
      import.meta.env.VITE_GEOCORE_API_KEY = '';
      
      expect(isGeocoreConfigured()).toBe(false);
    });

    it('should return true when env vars are set', () => {
      import.meta.env.VITE_GEOCORE_API_URL = 'http://api.test';
      import.meta.env.VITE_GEOCORE_API_KEY = 'test-key';
      
      expect(isGeocoreConfigured()).toBe(true);
    });
  });

  describe('getHeatmapData', () => {
    it('should return empty array when geocore is not configured', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = '';
      import.meta.env.VITE_GEOCORE_API_KEY = '';
      
      const result = await getHeatmapData();
      expect(result).toEqual([]);
    });

    it('should fetch heatmap data when configured', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = 'http://api.test';
      import.meta.env.VITE_GEOCORE_API_KEY = 'test-key';

      const mockData = [{ h3Index: '891f1d4a9ffffff', intensity: 50 }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getHeatmapData({ resolution: 9, limit: 100 });
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = 'http://api.test';
      import.meta.env.VITE_GEOCORE_API_KEY = 'test-key';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getHeatmapData()).rejects.toThrow();
    });
  });

  describe('getHeatmapCells', () => {
    it('should return empty array when geocore is not configured', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = '';
      import.meta.env.VITE_GEOCORE_API_KEY = '';
      
      const result = await getHeatmapCells();
      expect(result).toEqual([]);
    });

    it('should fetch heatmap cells when configured', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = 'http://api.test';
      import.meta.env.VITE_GEOCORE_API_KEY = 'test-key';

      const mockCells = [
        { h3Index: '891f1d4a9ffffff', intensity: 50, stats: {} }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCells,
      });

      const result = await getHeatmapCells({ minIntensity: 10, limit: 50 });
      expect(result).toEqual(mockCells);
    });
  });

  describe('checkGeocoreHealth', () => {
    it('should return false when geocore is not configured', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = '';
      import.meta.env.VITE_GEOCORE_API_KEY = '';
      
      const result = await checkGeocoreHealth();
      expect(result).toBe(false);
    });

    it('should return true when health check succeeds', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = 'http://api.test';
      import.meta.env.VITE_GEOCORE_API_KEY = 'test-key';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await checkGeocoreHealth();
      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      import.meta.env.VITE_GEOCORE_API_URL = 'http://api.test';
      import.meta.env.VITE_GEOCORE_API_KEY = 'test-key';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await checkGeocoreHealth();
      expect(result).toBe(false);
    });
  });
});
