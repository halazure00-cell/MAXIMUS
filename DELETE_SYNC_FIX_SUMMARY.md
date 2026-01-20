# Delete Sync Fix - Implementation Summary

## Problem Statement
Deleting an order in the app leads to sync error or conflict. Conflict banner indicates server-wins and references an order ID (e.g., "orders - cda18818"). Records were being resurrected (deleted locally but reappearing after sync).

## Root Causes Identified

1. **Resurrection Bug**: `applyOrderToCache()` and `applyExpenseToCache()` didn't check if local record had `deleted_at` before overwriting with server non-deleted version
2. **RLS Errors Not Detected**: Permission denied errors were retried 3 times unnecessarily
3. **Delete-Before-Create**: No handling for offline create→delete before first sync
4. **Generic Conflict Messages**: Didn't clarify what happened during deletion conflicts

## Changes Made

### 1. syncEngine.js - Prevent Resurrection in Pull Conflict Resolver

**Functions Modified**: `applyOrderToCache()`, `applyExpenseToCache()`

**Logic Added**:
- Check if local record has `deleted_at` (tombstone exists)
- If local is deleted but server is not:
  - **Keep local tombstone** (do not resurrect)
  - Log warning: "Preventing resurrection - local tombstone wins over server non-deleted"
  - Notify with conflict: `resolution: 'tombstone-preserved'`
- If both are deleted:
  - Keep the one with later `deleted_at` or `updated_at`
  - Apply server tombstone only if newer

**Result**: Deleted records never reappear, even if server has a non-deleted version.

---

### 2. syncEngine.js - RLS/Permission Error Detection

**Functions Added/Modified**:
- `checkPermanentError(error)` - New function replacing `isSchemaError()`
- Returns: `{ isPermanent: boolean, errorType: string, message: string }`

**Error Detection**:
- **Schema Errors**: Missing columns/tables (PostgreSQL codes 42703, 42P01)
- **RLS/Permission Errors**: 
  - PostgreSQL code 42501 (insufficient_privilege)
  - Supabase code PGRST301 (RLS violation)
  - Message patterns: "permission denied", "policy", "row-level security"

**Behavior**:
- Permanent errors moved to `failed_ops` immediately
- No retry attempts (was retrying 3 times)
- Clear error messages distinguish schema vs permission issues

---

### 3. syncEngine.js - Delete-Before-Create Handling

**Functions Added**: `coalesceOplog(ops)`

**Logic**:
1. First pass: Map all upsert/create operations by `client_tx_id`
2. Second pass: Find delete operations for same `client_tx_id`
3. Mark both create and delete as skippable (never synced to server)
4. Remove both from oplog

**Function Modified**: `pushDelete(op)`

**Added Check**:
- Query server for row existence before update
- If row doesn't exist: just mark local tombstone, return success
- If row exists: perform soft delete update as before

**Result**: 
- Handles edge case where coalescing missed a create→delete pair
- No server error when deleting non-existent row

---

### 4. SyncStatusBanner.jsx - Improved Conflict Messaging

**Change**: Display per-conflict message from conflict event

**Messages**:
- **Tombstone Preserved**: "Data dihapus di perangkat Anda; penghapusan dipertahankan (tidak dikembalikan)."
- **Server Wins**: "Perubahan Anda bentrok dengan update dari device lain. Data dari server diterapkan (server-wins)."

**UI Update**: Shows message below each conflict in the conflict details panel

---

## Files Changed

1. **src/lib/syncEngine.js** (237 lines changed)
   - Added: `checkPermanentError()` function
   - Added: `coalesceOplog()` function
   - Modified: `applyOrderToCache()` - resurrection prevention
   - Modified: `applyExpenseToCache()` - resurrection prevention
   - Modified: `pushToSupabase()` - uses `checkPermanentError()`, calls `coalesceOplog()`
   - Modified: `pushDelete()` - checks row existence before update

2. **src/components/SyncStatusBanner.jsx** (18 lines changed)
   - Modified: Conflict details display to show per-conflict messages
   - Removed generic message, now uses message from conflict event

## Testing Instructions

See **TESTING_DELETE_SYNC.md** for detailed manual testing procedures.

**Quick Test**:
1. Offline: Create order → Delete order → Go online → Sync
   - Expected: No error, order doesn't appear on server
2. Online: Delete order → Sync
   - Expected: Order has `deleted_at` timestamp on server
3. Multi-device: Device A deletes, Device B updates same row
   - Expected: Deletion wins, no resurrection

## Verification

**Before Deployment**:
- [x] Linter passes (npm run lint)
- [x] Syntax check passes (node -c)
- [x] No compilation errors
- [ ] Manual testing (requires live environment)

**After Deployment**:
- [ ] Scenario 1: Offline create→delete→sync
- [ ] Scenario 2: Online delete→sync
- [ ] Scenario 3: Multi-device conflict
- [ ] Scenario 4: RLS error handling
- [ ] Check Supabase: deleted_at timestamps correct
- [ ] Check IndexedDB: tombstones preserved
- [ ] Check failed_ops: permanent errors not retried

## Migration Requirements

**No migration needed** - Uses existing schema from 0004_offline_first.sql:
- `deleted_at` column already exists
- `updated_at` column and trigger already exists
- `client_tx_id` unique constraint already exists
- RLS policies already allow UPDATE operations

## Rollback Plan

If issues occur:
```bash
git revert 99de501
```

Or manually revert changes in:
- src/lib/syncEngine.js
- src/components/SyncStatusBanner.jsx

## Performance Impact

**Minimal**:
- `coalesceOplog()`: O(n) where n = pending ops (typically < 100)
- `checkPermanentError()`: O(1) string matching
- `pushDelete()`: One additional SELECT query per delete (minimal overhead)

## Security Considerations

**Improved**:
- RLS violations now properly handled (not retried)
- Permission errors clearly reported
- No data loss from incorrect resurrection

## Future Enhancements

1. **Server-side tombstone cleanup**: Periodic job to hard-delete old tombstones (deleted_at > 90 days)
2. **Conflict resolution UI**: Let user choose between local and server version
3. **Optimistic locking**: Use version numbers instead of timestamps
4. **Delta sync**: Only sync changed fields, not entire records

## Known Limitations

1. Clock skew between devices may affect timestamp comparison
2. Failed operations require manual intervention (retry or clear)
3. No UI to view/manage failed_ops store

## Commit History

- **99de501**: fix(sync): prevent resurrection and add RLS error handling
  - Prevent resurrection: tombstone wins over server non-deleted
  - Add RLS/permission error detection as non-retryable
  - Handle delete-before-create with oplog coalescing
  - Improve conflict messaging for deletion scenarios
