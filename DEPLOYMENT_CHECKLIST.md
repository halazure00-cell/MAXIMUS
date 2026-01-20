# Verification and Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [x] Syntax validation passed (node -c)
- [x] Linter passed with 0 errors (npm run lint)
- [x] Code review completed - all issues addressed
- [x] No compilation errors
- [x] Performance optimized (O(n²) → O(n))
- [x] Code duplication reduced (~100 lines)

### ✅ Functionality Implemented
- [x] Prevent resurrection of deleted records
- [x] RLS/permission errors non-retryable
- [x] Delete-before-create handling
- [x] Improved conflict messaging
- [x] Helper functions and constants extracted

### 📋 Documentation
- [x] TESTING_DELETE_SYNC.md created
- [x] DELETE_SYNC_FIX_SUMMARY.md created
- [x] Code comments comprehensive
- [x] Commit messages clear

## Deployment Steps

### 1. Verify Migration Status
Before deploying, ensure migration 0004_offline_first.sql is applied:

```sql
-- Check if columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('orders', 'expenses')
  AND column_name IN ('client_tx_id', 'updated_at', 'deleted_at')
ORDER BY table_name, column_name;

-- Expected: 6 rows (3 columns × 2 tables)
```

### 2. Deploy Application
- Push to main branch (merge PR)
- Vercel/Netlify will auto-deploy
- Monitor build logs for errors

### 3. Post-Deployment Verification

#### A. Check Application Loads
- [ ] Visit application URL
- [ ] Login works
- [ ] No console errors in browser DevTools

#### B. Basic Sync Test
- [ ] Create an order (online)
- [ ] Verify sync status shows "Synced"
- [ ] Check Supabase: order exists with client_tx_id

#### C. Delete Sync Test (Online)
- [ ] Delete the order
- [ ] Wait for sync or trigger manual sync
- [ ] Verify no error banner
- [ ] Check Supabase: order has deleted_at timestamp (not null)
- [ ] Verify order doesn't appear in UI

#### D. Offline Create-Delete Test
1. [ ] Open browser DevTools → Network tab
2. [ ] Set to "Offline" mode
3. [ ] Create a new order
4. [ ] Delete the same order
5. [ ] Go back "Online"
6. [ ] Trigger manual sync
7. [ ] Expected: No error, order doesn't appear on server
8. [ ] Check console: "Coalescing create-delete pair"

#### E. Multi-Device Conflict Test
**Device A (Browser 1):**
1. [ ] Go offline
2. [ ] Delete an order

**Device B (Browser 2 or Supabase):**
3. [ ] Update the same order (change amount)

**Device A:**
4. [ ] Go online
5. [ ] Trigger sync
6. [ ] Expected: Conflict banner with "Data dihapus di perangkat Anda; penghapusan dipertahankan"
7. [ ] Verify order stays deleted (not resurrected)

#### F. RLS Error Test (if possible)
**Only if you can temporarily modify RLS policy:**
1. [ ] Modify RLS policy to deny updates
2. [ ] Delete an order
3. [ ] Wait for sync
4. [ ] Expected: Error "Permission denied. Row-level security policy issue."
5. [ ] Check failed_ops count increases
6. [ ] Restore RLS policy

## Monitoring

### Metrics to Watch (First 24 Hours)
- [ ] Error rate in logs (should not increase)
- [ ] Failed operations count (check failed_ops store)
- [ ] User reports of deleted records reappearing (should be 0)
- [ ] Sync conflict frequency

### Browser Console Checks
Look for these log messages:
- ✅ `[syncEngine] Coalescing create-delete pair` (when applicable)
- ✅ `[syncEngine] Preventing resurrection - local tombstone wins` (multi-device)
- ✅ `[syncEngine] Permanent error detected - non-retryable` (RLS/schema errors)
- ❌ Any unhandled exceptions or errors

### Database Checks

#### Check deleted records have timestamps:
```sql
SELECT 
  COUNT(*) as total_deleted,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as missing_deleted_at
FROM orders
WHERE user_id = 'YOUR_USER_ID';

-- Expected: missing_deleted_at = 0
```

#### Check for orphaned records (created but never synced):
```sql
SELECT 
  COUNT(*) 
FROM orders
WHERE client_tx_id IS NULL;

-- Expected: 0 (all should have client_tx_id after migration)
```

## Rollback Plan

### If Critical Issues Occur:

#### Option 1: Revert PR
```bash
# On main branch
git revert cf0a4dc  # Revert bug fixes
git revert 07734f8  # Revert refactoring
git revert 139a0a4  # Revert documentation
git revert 99de501  # Revert core changes
git push origin main
```

#### Option 2: Redeploy Previous Version
- In Vercel/Netlify dashboard
- Select previous deployment
- Click "Promote to Production"

#### Option 3: Emergency Fix
If only specific issue:
- Create hotfix branch
- Fix specific issue
- Fast-track review and deploy

### After Rollback:
1. [ ] Notify users of temporary revert
2. [ ] Analyze logs to identify root cause
3. [ ] Fix issue in development
4. [ ] Re-test thoroughly
5. [ ] Redeploy when stable

## Success Criteria

### Must Have (Blocking)
- [x] No application errors on load
- [ ] Delete operations succeed without errors
- [ ] Deleted records don't reappear
- [ ] Sync completes without permanent failures

### Should Have (Important)
- [ ] Oplog coalescing works (console logs confirm)
- [ ] Conflict messages display correctly
- [ ] RLS errors handled gracefully

### Nice to Have (Optional)
- [ ] Performance improvement visible
- [ ] User feedback positive
- [ ] No increase in support tickets

## Known Limitations

1. **Clock Skew**: Devices with incorrect time may have unexpected conflict resolution
2. **Failed Operations**: Require manual intervention (no UI to retry/clear yet)
3. **I18n**: Messages are in Indonesian only (need i18n system)
4. **Server Time**: Pull uses server's updated_at, but delete uses client time for deleted_at

## Future Enhancements

### Short Term (Next Sprint)
- [ ] Add UI to view/manage failed_ops
- [ ] Add retry button for failed operations
- [ ] Implement i18n for conflict messages

### Medium Term (Next Quarter)
- [ ] Server-side tombstone cleanup job (delete old tombstones)
- [ ] Conflict resolution UI (let user choose)
- [ ] Better offline detection and messaging

### Long Term (Future)
- [ ] Optimistic locking with version numbers
- [ ] Delta sync (only changed fields)
- [ ] Conflict resolution strategies (last-write-wins, user-choice, merge)

## Contact & Support

### For Issues During Deployment:
- Check browser console first
- Check Supabase logs
- Review TESTING_DELETE_SYNC.md for expected behavior
- Review DELETE_SYNC_FIX_SUMMARY.md for implementation details

### Code Owners:
- GitHub Copilot (implementation)
- halazure00-cell (review and deployment)

### Related Documentation:
- TESTING_DELETE_SYNC.md - Manual testing procedures
- DELETE_SYNC_FIX_SUMMARY.md - Implementation summary
- supabase/migrations/0004_offline_first.sql - Database schema
- src/lib/syncEngine.js - Sync engine implementation
- src/lib/offlineOps.js - Offline operations layer
- src/lib/localDb.js - IndexedDB cache layer
