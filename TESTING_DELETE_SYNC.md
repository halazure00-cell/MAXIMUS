# Testing Guide: Delete Sync Fix

This document provides manual testing instructions for the delete synchronization fixes.

## Changes Summary

### 1. Prevent Resurrection of Deleted Records
- **File**: `src/lib/syncEngine.js`
- **Functions**: `applyOrderToCache()`, `applyExpenseToCache()`
- **Fix**: Local tombstone (deleted_at) now wins over server non-deleted version
- **Prevents**: Deleted records from reappearing after sync

### 2. RLS/Permission Error Detection
- **File**: `src/lib/syncEngine.js`
- **Function**: `checkPermanentError()`
- **Fix**: Detects RLS violations and permission errors as non-retryable
- **Error Codes**: 42501 (insufficient_privilege), PGRST301 (Supabase RLS violation)
- **Behavior**: Moves to failed_ops immediately without retry

### 3. Delete-Before-Create Handling
- **File**: `src/lib/syncEngine.js`
- **Function**: `coalesceOplog()`, `pushDelete()`
- **Fix**: Detects create→delete pairs before server push and skips both
- **Behavior**: Handles delete of records that were never synced to server

### 4. Improved Conflict Messaging
- **File**: `src/components/SyncStatusBanner.jsx`
- **Fix**: Shows specific messages for different conflict types
- **Messages**:
  - Tombstone preserved: "Data dihapus di perangkat Anda; penghapusan dipertahankan (tidak dikembalikan)."
  - Server wins: "Perubahan Anda bentrok dengan update dari device lain. Data dari server diterapkan (server-wins)."

## Test Scenarios

### Scenario 1: Offline Create → Delete → Sync
**Expected**: Record should not appear on server at all (oplog coalescing)

**Steps**:
1. Go offline (disable network)
2. Create a new order in the app
3. Delete the same order
4. Go online
5. Trigger sync (should happen automatically or use manual sync button)

**Expected Result**:
- No error in sync
- Order does not appear on server
- Order does not reappear in app
- Oplog should be empty after sync
- Console should show: "Coalescing create-delete pair"

### Scenario 2: Online Delete → Sync
**Expected**: Order marked as deleted on server with deleted_at timestamp

**Steps**:
1. Ensure online
2. Create an order and wait for sync
3. Delete the order
4. Wait for sync or trigger manual sync

**Expected Result**:
- Sync succeeds
- Order has deleted_at timestamp on server
- Order hidden from UI (not shown in transaction list)
- Can verify in Supabase dashboard: order row exists with deleted_at set

### Scenario 3: Multi-Device Conflict (Deletion vs Update)
**Expected**: Deletion tombstone wins, record stays deleted

**Steps**:
1. Device A: Go offline, delete an order
2. Device B (or Supabase directly): Update the same order (change amount, distance, etc.)
3. Device A: Go online and sync

**Expected Result**:
- Conflict notification appears with message: "Data dihapus di perangkat Anda; penghapusan dipertahankan (tidak dikembalikan)."
- Order stays deleted on Device A (tombstone preserved)
- Order is NOT resurrected despite server having non-deleted version
- Next sync will propagate deletion to server

### Scenario 4: RLS/Permission Error
**Expected**: Error marked as non-retryable, moved to failed_ops

**Steps** (requires temporarily breaking RLS policy):
1. In Supabase, modify RLS policy on orders table to deny updates
2. Delete an order in the app
3. Wait for sync

**Expected Result**:
- Sync shows error: "Permission denied. Row-level security policy issue."
- Operation appears in failed_ops (not retried)
- SyncStatusBanner shows failed operation count
- Console shows: "Permanent error detected - non-retryable"

### Scenario 5: Schema Error
**Expected**: Error marked as non-retryable, moved to failed_ops

**Steps** (simulated - don't actually break schema):
If migration 0004_offline_first.sql is not applied:
1. Delete an order
2. Sync should fail with missing column error

**Expected Result**:
- Error message: "Database schema error. Migration 0004_offline_first required."
- Operation moved to failed_ops
- No retry attempts (immediate failure)

## Verification Checklist

After each test scenario:

- [ ] Check browser console for errors (should be clean or only expected errors)
- [ ] Verify in Supabase dashboard:
  - [ ] Orders table: check deleted_at column
  - [ ] Verify row exists/doesn't exist as expected
- [ ] Check IndexedDB in browser DevTools:
  - [ ] Open Application → IndexedDB → maximus_local
  - [ ] Check orders_cache: deleted records should have deleted_at
  - [ ] Check oplog: should be empty after successful sync
  - [ ] Check failed_ops: should contain permanently failed ops
- [ ] UI verification:
  - [ ] Deleted orders don't appear in transaction list
  - [ ] SyncStatusBanner shows correct status
  - [ ] Conflict notifications display appropriate messages

## Manual Database Verification

### Check deleted records in Supabase:

```sql
-- View all orders including deleted ones
SELECT 
  id,
  client_tx_id,
  created_at,
  updated_at,
  deleted_at,
  user_id
FROM orders
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 20;

-- View only deleted orders
SELECT 
  id,
  client_tx_id,
  deleted_at,
  updated_at
FROM orders
WHERE user_id = 'YOUR_USER_ID'
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- Same for expenses
SELECT 
  id,
  client_tx_id,
  deleted_at,
  updated_at
FROM expenses
WHERE user_id = 'YOUR_USER_ID'
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

### Check IndexedDB in Browser DevTools:

1. Open DevTools (F12)
2. Go to "Application" tab
3. Expand "IndexedDB" → "maximus_local"
4. Inspect:
   - `orders_cache`: Check deleted_at field
   - `expenses_cache`: Check deleted_at field
   - `oplog`: Should be empty after successful sync
   - `failed_ops`: Check for permanently failed operations
   - `meta`: Check last_sync_at timestamp

## Console Logging

Expected console messages for each scenario:

### Scenario 1 (Create→Delete before sync):
```
[syncEngine] Coalescing create-delete pair { clientTxId: '...', createOpId: X, deleteOpId: Y }
[syncEngine] Coalesced operations { original: 2, optimized: 0, skipped: 2 }
```

### Scenario 2 (Normal delete):
```
[syncEngine] Push delete to Supabase { table: 'orders', clientTxId: '...' }
[syncEngine] Soft delete successful
```

### Scenario 3 (Resurrection prevented):
```
[syncEngine] Preventing resurrection - local tombstone wins over server non-deleted { clientTxId: '...' }
[syncEngine] Conflict detected - resolution: tombstone-preserved
```

### Scenario 4 (RLS error):
```
[syncEngine] Permanent error detected - non-retryable { errorType: 'permission', error: 'permission denied' }
[syncEngine] Moving to failed_ops
```

### Scenario 5 (Schema error):
```
[syncEngine] Permanent error detected - non-retryable { errorType: 'schema', error: 'column "deleted_at" does not exist' }
[syncEngine] Moving to failed_ops
```

## Known Limitations

1. **Server Time vs Local Time**: The fix uses timestamps for conflict resolution. Clock skew between devices may cause unexpected behavior.
2. **Permanent Failures**: Operations in failed_ops require manual intervention (retry or clear).
3. **Pull Frequency**: Deleted records from other devices only appear after pull sync runs.

## Rollback Plan

If issues occur:
1. Revert to previous version: `git revert <commit-hash>`
2. Or disable offline mode temporarily in settings
3. Clear IndexedDB to reset local state
4. Force full re-sync from server

## Support

For issues, check:
- Browser console for error messages
- IndexedDB state in DevTools
- Supabase logs for server-side errors
- Network tab for failed API requests
