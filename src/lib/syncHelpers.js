/**
 * Sync Engine Helper Functions
 * Pure helper functions extracted for testing
 * NO BEHAVIOR CHANGE - just exports for testing
 */

/**
 * Compare timestamps between server and local records
 * @returns {number} - Positive if server is newer, negative if local is newer, 0 if equal
 */
export function compareTimestamps(serverRecord, localRecord, field = 'updated_at') {
  const serverTimestamp = serverRecord[field] || serverRecord.updated_at || new Date(0).toISOString();
  const localTimestamp = localRecord[field] || localRecord.updated_at || new Date(0).toISOString();
  
  const serverTime = new Date(serverTimestamp).getTime();
  const localTime = new Date(localTimestamp).getTime();
  
  return serverTime - localTime;
}

/**
 * Check if tombstone should be preserved
 * Returns true if local deletion should win over server non-deleted record
 * @param {object} existing - Local cached record
 * @param {object} serverRecord - Server record
 * @returns {boolean}
 */
export function shouldPreserveTombstone(existing, serverRecord) {
  // If local tombstone exists (deleted_at not null), never overwrite with non-deleted server row
  if (existing && existing.deleted_at) {
    // Local is deleted
    if (!serverRecord.deleted_at) {
      // Server has non-deleted version - local deletion wins (tombstone preservation)
      return true;
    }
  }
  return false;
}

/**
 * Determine which tombstone to keep when both are deleted
 * Returns 'local', 'server', or null if not applicable
 * @param {object} existing - Local cached record
 * @param {object} serverRecord - Server record
 * @returns {string|null}
 */
export function resolveDeletedConflict(existing, serverRecord) {
  if (existing && existing.deleted_at && serverRecord.deleted_at) {
    // Both deleted - keep the one with later deleted_at/updated_at
    const timeDiff = compareTimestamps(serverRecord, existing, 'deleted_at');
    if (timeDiff <= 0) {
      // Local tombstone is newer or same age
      return 'local';
    }
    // Server tombstone is newer
    return 'server';
  }
  return null;
}

/**
 * Optimize oplog by identifying create-delete pairs
 * Returns set of op_ids to skip
 * @param {Array} ops - All pending operations
 * @returns {Set} Set of op_ids to skip
 */
export function identifyCoalescedOps(ops) {
  const createOps = new Map(); // client_tx_id -> op_id
  const skippedOps = new Set(); // op_ids to skip (both creates and deletes)
  
  // First pass: identify creates/upserts for each client_tx_id
  for (const op of ops) {
    if (op.op === 'upsert' && op.client_tx_id) {
      if (!createOps.has(op.client_tx_id)) {
        createOps.set(op.client_tx_id, op.op_id);
      }
    }
  }
  
  // Second pass: identify delete operations that follow a create for the same client_tx_id
  for (const op of ops) {
    if (op.op === 'delete' && op.client_tx_id) {
      const createOpId = createOps.get(op.client_tx_id);
      if (createOpId !== undefined) {
        // Found a create-delete pair - skip both
        skippedOps.add(createOpId);
        skippedOps.add(op.op_id);
      }
    }
  }
  
  return skippedOps;
}
