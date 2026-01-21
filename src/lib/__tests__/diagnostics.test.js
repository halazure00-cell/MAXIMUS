/**
 * Diagnostics Tests
 * Tests for error classification, logging, and snapshot generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  classifyError,
  addErrorLog,
  getErrorLogs,
  clearErrorLogs,
  buildBugReportMessage,
} from '../diagnostics';

describe('diagnostics', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('classifyError', () => {
    it('should classify RLS denied errors', () => {
      const error = { message: 'permission denied for table orders' };
      const result = classifyError(error);
      
      expect(result.code).toBe('RLS_DENIED');
      expect(result.type).toBe('permission');
      expect(result.retryableHint).toBe(false);
      expect(result.messageShort).toContain('Akses ditolak');
    });

    it('should classify schema mismatch errors', () => {
      const error = { message: 'column "invalid_column" does not exist', pgCode: '42703' };
      const result = classifyError(error);
      
      expect(result.code).toBe('SCHEMA_MISMATCH');
      expect(result.type).toBe('schema');
      expect(result.retryableHint).toBe(false);
      expect(result.messageShort).toContain('Kolom/tabel');
    });

    it('should classify network offline errors', () => {
      const error = { message: 'failed to fetch' };
      const result = classifyError(error);
      
      expect(result.code).toBe('NETWORK_OFFLINE');
      expect(result.type).toBe('network');
      expect(result.retryableHint).toBe(true);
      expect(result.messageShort).toContain('Koneksi offline');
    });

    it('should classify rate limit errors', () => {
      const error = { message: 'too many requests', status: 429 };
      const result = classifyError(error);
      
      expect(result.code).toBe('RATE_LIMIT');
      expect(result.type).toBe('rate_limit');
      expect(result.retryableHint).toBe(true);
      expect(result.httpStatus).toBe(429);
    });

    it('should classify timeout errors', () => {
      const error = { message: 'request timeout', code: 'TIMEOUT' };
      const result = classifyError(error);
      
      expect(result.code).toBe('TIMEOUT');
      expect(result.type).toBe('timeout');
      expect(result.retryableHint).toBe(true);
    });

    it('should classify unknown errors', () => {
      const error = { message: 'some weird error' };
      const result = classifyError(error);
      
      expect(result.code).toBe('UNKNOWN');
      expect(result.type).toBe('unknown');
      expect(result.retryableHint).toBe(false);
    });
  });

  describe('error logging', () => {
    it('should add error log to localStorage', () => {
      addErrorLog({
        route: '/orders',
        code: 'RLS_DENIED',
        messageShort: 'Access denied',
        context: { op: 'update' },
      });

      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].route).toBe('/orders');
      expect(logs[0].code).toBe('RLS_DENIED');
      expect(logs[0].context.op).toBe('update');
    });

    it('should maintain max 20 error logs (ring buffer)', () => {
      // Add 25 logs
      for (let i = 0; i < 25; i++) {
        addErrorLog({
          route: `/test${i}`,
          code: 'TEST',
          messageShort: `Error ${i}`,
        });
      }

      const logs = getErrorLogs();
      expect(logs).toHaveLength(20);
      // Should keep the latest 20
      expect(logs[0].route).toBe('/test24'); // Most recent
      expect(logs[19].route).toBe('/test5'); // Oldest kept
    });

    it('should clear all error logs', () => {
      addErrorLog({ route: '/test', code: 'TEST', messageShort: 'Test' });
      expect(getErrorLogs()).toHaveLength(1);

      clearErrorLogs();
      expect(getErrorLogs()).toHaveLength(0);
    });

    it('should handle corrupted localStorage gracefully', () => {
      // Corrupt the localStorage
      localStorage.setItem('maximus_error_logs', 'invalid json');

      const logs = getErrorLogs();
      expect(logs).toEqual([]);
    });
  });

  describe('buildBugReportMessage', () => {
    it('should build WhatsApp message with template', () => {
      const snapshot = {
        app: { name: 'MAXIMUS', version: '1.1.0' },
        device: { userAgent: 'Test/1.0' },
        runtime: { route: '/orders', nowIso: '2024-01-01T00:00:00Z' },
        errors: { recent: [{ code: 'RLS_DENIED', messageShort: 'Access denied' }] },
      };

      const message = buildBugReportMessage(snapshot);

      expect(message).toContain('LAPORAN BUG MAXIMUS');
      expect(message).toContain('/orders');
      expect(message).toContain('RLS_DENIED');
      expect(message).toContain('Langkah kejadian');
      expect(message).toContain('Yang terjadi');
      expect(message).toContain('Yang seharusnya');
      expect(message).toContain('DIAGNOSTICS');
    });

    it('should shorten message if too long', () => {
      // Create large snapshot
      const largeErrors = [];
      for (let i = 0; i < 100; i++) {
        largeErrors.push({
          code: 'TEST',
          messageShort: 'Error '.repeat(50), // Long message
          route: `/test${i}`,
        });
      }

      const snapshot = {
        app: { name: 'MAXIMUS', version: '1.1.0' },
        device: { userAgent: 'Test/1.0' },
        runtime: { route: '/orders', nowIso: '2024-01-01T00:00:00Z' },
        errors: { recent: largeErrors },
        hints: ['hint1', 'hint2', 'hint3'],
      };

      const message = buildBugReportMessage(snapshot);

      // Should be shortened
      expect(message.length).toBeLessThan(8000);
      expect(message).toContain('DIAGNOSTICS');
    });
  });

  describe('snapshot generation', () => {
    it('should not include sensitive data in snapshot', async () => {
      // Mock getDiagnosticsSnapshot
      const { getDiagnosticsSnapshot } = await import('../diagnostics');
      
      const snapshot = await getDiagnosticsSnapshot({
        route: '/orders',
        syncState: {
          syncStatus: 'idle',
          pendingOps: 5,
          failedOps: 2,
        },
        settingsSummary: {
          darkMode: true,
          dailyTarget: 200000,
        },
      });

      // Should have safe fields
      expect(snapshot.app).toBeDefined();
      expect(snapshot.device).toBeDefined();
      expect(snapshot.runtime).toBeDefined();
      expect(snapshot.sync).toBeDefined();
      expect(snapshot.dbCounts).toBeDefined();
      expect(snapshot.settings).toBeDefined();
      expect(snapshot.errors).toBeDefined();

      // Should NOT have sensitive fields
      const jsonStr = JSON.stringify(snapshot);
      expect(jsonStr).not.toContain('token');
      expect(jsonStr).not.toContain('session');
      expect(jsonStr).not.toContain('email');
      expect(jsonStr).not.toContain('password');
      expect(jsonStr).not.toContain('apiKey');
    });
  });
});
