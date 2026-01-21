/**
 * Sync Engine Helper Tests
 * Tests for deletion/tombstone logic invariants
 */

import { describe, it, expect } from 'vitest';
import {
  compareTimestamps,
  shouldPreserveTombstone,
  resolveDeletedConflict,
  identifyCoalescedOps,
} from '../syncHelpers';

describe('syncHelpers', () => {
  describe('compareTimestamps', () => {
    it('should return positive when server is newer', () => {
      const serverRecord = { updated_at: '2024-01-15T12:00:00Z' };
      const localRecord = { updated_at: '2024-01-15T11:00:00Z' };
      
      expect(compareTimestamps(serverRecord, localRecord)).toBeGreaterThan(0);
    });

    it('should return negative when local is newer', () => {
      const serverRecord = { updated_at: '2024-01-15T11:00:00Z' };
      const localRecord = { updated_at: '2024-01-15T12:00:00Z' };
      
      expect(compareTimestamps(serverRecord, localRecord)).toBeLessThan(0);
    });

    it('should return 0 when timestamps are equal', () => {
      const timestamp = '2024-01-15T12:00:00Z';
      const serverRecord = { updated_at: timestamp };
      const localRecord = { updated_at: timestamp };
      
      expect(compareTimestamps(serverRecord, localRecord)).toBe(0);
    });

    it('should handle custom field comparison', () => {
      const serverRecord = { deleted_at: '2024-01-15T12:00:00Z' };
      const localRecord = { deleted_at: '2024-01-15T11:00:00Z' };
      
      expect(compareTimestamps(serverRecord, localRecord, 'deleted_at')).toBeGreaterThan(0);
    });

    it('should fallback to updated_at when custom field is missing', () => {
      const serverRecord = { updated_at: '2024-01-15T12:00:00Z' };
      const localRecord = { updated_at: '2024-01-15T11:00:00Z' };
      
      expect(compareTimestamps(serverRecord, localRecord, 'missing_field')).toBeGreaterThan(0);
    });
  });

  describe('shouldPreserveTombstone - Prevent resurrection', () => {
    it('should return true when local has deleted_at but server does not', () => {
      const existing = { id: 1, deleted_at: '2024-01-15T12:00:00Z' };
      const serverRecord = { id: 1, deleted_at: null };
      
      expect(shouldPreserveTombstone(existing, serverRecord)).toBe(true);
    });

    it('should return false when local is not deleted', () => {
      const existing = { id: 1, deleted_at: null };
      const serverRecord = { id: 1, deleted_at: null };
      
      expect(shouldPreserveTombstone(existing, serverRecord)).toBe(false);
    });

    it('should return false when both are deleted', () => {
      const existing = { id: 1, deleted_at: '2024-01-15T11:00:00Z' };
      const serverRecord = { id: 1, deleted_at: '2024-01-15T12:00:00Z' };
      
      expect(shouldPreserveTombstone(existing, serverRecord)).toBe(false);
    });

    it('should return false when local does not exist', () => {
      const existing = null;
      const serverRecord = { id: 1, deleted_at: null };
      
      expect(shouldPreserveTombstone(existing, serverRecord)).toBe(false);
    });

    it('should prevent resurrection - critical invariant', () => {
      // User deletes order on device A
      const localDeleted = { 
        id: 1, 
        client_tx_id: 'abc123',
        deleted_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };
      
      // Device B has older non-deleted version
      const serverNonDeleted = { 
        id: 1, 
        client_tx_id: 'abc123',
        deleted_at: null,
        updated_at: '2024-01-15T11:00:00Z',
      };
      
      // Local deletion should win
      expect(shouldPreserveTombstone(localDeleted, serverNonDeleted)).toBe(true);
    });
  });

  describe('resolveDeletedConflict', () => {
    it('should return "local" when local tombstone is newer', () => {
      const existing = { 
        deleted_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };
      const serverRecord = { 
        deleted_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };
      
      expect(resolveDeletedConflict(existing, serverRecord)).toBe('local');
    });

    it('should return "server" when server tombstone is newer', () => {
      const existing = { 
        deleted_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };
      const serverRecord = { 
        deleted_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };
      
      expect(resolveDeletedConflict(existing, serverRecord)).toBe('server');
    });

    it('should return "local" when tombstones have same timestamp', () => {
      const timestamp = '2024-01-15T12:00:00Z';
      const existing = { deleted_at: timestamp, updated_at: timestamp };
      const serverRecord = { deleted_at: timestamp, updated_at: timestamp };
      
      expect(resolveDeletedConflict(existing, serverRecord)).toBe('local');
    });

    it('should return null when not both deleted', () => {
      const existing = { deleted_at: null };
      const serverRecord = { deleted_at: '2024-01-15T12:00:00Z' };
      
      expect(resolveDeletedConflict(existing, serverRecord)).toBeNull();
    });
  });

  describe('identifyCoalescedOps - Create-delete pair optimization', () => {
    it('should identify create-delete pair for same client_tx_id', () => {
      const ops = [
        { op_id: 1, op: 'upsert', client_tx_id: 'abc123' },
        { op_id: 2, op: 'delete', client_tx_id: 'abc123' },
      ];
      
      const skipped = identifyCoalescedOps(ops);
      expect(skipped.has(1)).toBe(true);
      expect(skipped.has(2)).toBe(true);
      expect(skipped.size).toBe(2);
    });

    it('should not skip operations for different client_tx_ids', () => {
      const ops = [
        { op_id: 1, op: 'upsert', client_tx_id: 'abc123' },
        { op_id: 2, op: 'delete', client_tx_id: 'xyz789' },
      ];
      
      const skipped = identifyCoalescedOps(ops);
      expect(skipped.size).toBe(0);
    });

    it('should handle multiple create-delete pairs', () => {
      const ops = [
        { op_id: 1, op: 'upsert', client_tx_id: 'abc123' },
        { op_id: 2, op: 'upsert', client_tx_id: 'def456' },
        { op_id: 3, op: 'delete', client_tx_id: 'abc123' },
        { op_id: 4, op: 'delete', client_tx_id: 'def456' },
      ];
      
      const skipped = identifyCoalescedOps(ops);
      expect(skipped.has(1)).toBe(true);
      expect(skipped.has(2)).toBe(true);
      expect(skipped.has(3)).toBe(true);
      expect(skipped.has(4)).toBe(true);
      expect(skipped.size).toBe(4);
    });

    it('should handle empty operations array', () => {
      const skipped = identifyCoalescedOps([]);
      expect(skipped.size).toBe(0);
    });

    it('should only coalesce first create with corresponding delete', () => {
      const ops = [
        { op_id: 1, op: 'upsert', client_tx_id: 'abc123' },
        { op_id: 2, op: 'upsert', client_tx_id: 'abc123' }, // Second create
        { op_id: 3, op: 'delete', client_tx_id: 'abc123' },
      ];
      
      const skipped = identifyCoalescedOps(ops);
      expect(skipped.has(1)).toBe(true);
      expect(skipped.has(3)).toBe(true);
      expect(skipped.has(2)).toBe(false); // Second create should not be skipped
    });

    it('should return no-op for create+delete pair - critical optimization', () => {
      // User creates order offline, then deletes it before sync
      const ops = [
        { op_id: 1, op: 'upsert', client_tx_id: 'temp-order-123', payload: { gross_profit: 50000 } },
        { op_id: 2, op: 'delete', client_tx_id: 'temp-order-123', payload: { deleted_at: '2024-01-15T12:00:00Z' } },
      ];
      
      // Both operations should be coalesced (no need to sync to server)
      const skipped = identifyCoalescedOps(ops);
      expect(skipped.has(1)).toBe(true);
      expect(skipped.has(2)).toBe(true);
    });
  });
});
