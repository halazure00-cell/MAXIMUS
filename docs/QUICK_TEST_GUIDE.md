# 🧪 Quick Testing Guide - Sync Fix Validation

## Prerequisites
- Chrome/Edge/Firefox browser (latest version)
- Active Supabase account
- Internet connection

---

## Test 1: Basic Sync Functionality ⚡

**Time:** ~3 minutes

1. Open app and login
2. Open Console (F12)
3. Look for these logs:
   ```
   ✅ [SyncContext] Local database initialized
   ✅ [Riwayat] Import result: {success: true, ...}
   ```
4. Navigate to **Riwayat** tab
5. **Expected:** Data should load within 2 seconds

**Pass Criteria:** ✅ No errors in console, data visible

---

## Test 2: Offline Mode 📵

**Time:** ~5 minutes

1. Go to **Riwayat** tab
2. Open DevTools → Network tab → Select "Offline"
3. Try to create a new order
4. **Expected:** Order created locally, SyncStatusBanner shows "1 pending"
5. Switch back to "Online"
6. **Expected:** Auto-sync within 60 seconds, banner disappears

**Pass Criteria:** ✅ Order saved offline and synced when online

---

## Test 3: Debug Utils 🔧

**Time:** ~2 minutes

1. Open Console (F12)
2. Type: `syncDebug.checkHealth()`
3. **Expected Output:**
   ```
   🔍 Sync Health Check
   📊 Database Stats: {...}
   📈 Health Score: 100/100
   ✅ No issues found
   ```

**Pass Criteria:** ✅ Health score > 80, no critical issues

---

## Test 4: Force Reimport 🔄

**Time:** ~3 minutes

1. Clear IndexedDB:
   - DevTools → Application → Storage → IndexedDB
   - Right-click `maximus_local` → Delete
2. Refresh page
3. Login again
4. Navigate to Riwayat
5. **Expected:** Data loads automatically

**Pass Criteria:** ✅ Data restored without manual intervention

---

## Test 5: Multiple Edits 📝

**Time:** ~5 minutes

1. Edit an existing order
2. Wait 2 seconds
3. Edit the same order again
4. Check SyncStatusBanner
5. **Expected:** Shows "2 pending" then auto-syncs
6. Open Console, run: `syncDebug.showPendingOps()`
7. **Expected:** Empty or minimal pending ops

**Pass Criteria:** ✅ All edits synced successfully

---

## Test 6: Logout/Login Cycle 🔐

**Time:** ~3 minutes

1. Create 1 order
2. Wait for sync (banner disappears)
3. Logout
4. Login with same account
5. Go to Riwayat
6. **Expected:** Previously created order is visible

**Pass Criteria:** ✅ Data persists across sessions

---

## Quick Debug Commands

Run these in Console for instant checks:

```javascript
// Overall health
syncDebug.checkHealth()

// See what's waiting to sync
syncDebug.showPendingOps()

// See failed operations
syncDebug.showFailedOps()

// Real-time monitoring (updates every 5s)
syncDebug.monitor.start()
// Stop with: syncDebug.monitor.stop()

// Export debug data
syncDebug.exportSyncData()
```

---

## Common Issues & Quick Fixes

### Issue: "IndexedDB not available"
**Fix:** Disable private/incognito mode

### Issue: "Data not loading"
**Fix 1:** Run `syncDebug.checkHealth()` to see score  
**Fix 2:** Hard refresh (Ctrl+Shift+R)  
**Fix 3:** Clear browser cache

### Issue: "Sync stuck at 'pending'"
**Fix 1:** Check internet connection  
**Fix 2:** Click "Sync Now" button  
**Fix 3:** Run `syncDebug.showPendingOps()` to see details

### Issue: "Failed operations > 0"
**Fix 1:** Logout and login again (auth refresh)  
**Fix 2:** Check Supabase dashboard for errors  
**Fix 3:** Clear failed ops: `syncDebug.clearFailedOperations()`

---

## Performance Benchmarks

**Expected Performance:**

| Metric | Target | Good | Acceptable |
|--------|--------|------|------------|
| Initial Load | < 2s | < 3s | < 5s |
| Sync Latency | < 5s | < 10s | < 30s |
| Pending Ops | 0-5 | 5-10 | < 20 |
| Failed Ops | 0 | 0 | 1-2 |
| Health Score | 90-100 | 70-89 | 50-69 |

---

## Acceptance Criteria ✅

All tests must pass with:
- [ ] No console errors
- [ ] Health score > 80
- [ ] Pending ops < 10
- [ ] Failed ops = 0
- [ ] Data loads within 3 seconds
- [ ] Offline mode works correctly
- [ ] Debug utils available and functional

**If all checked:** ✅ **READY FOR PRODUCTION**

---

## Report Issues

If any test fails:

1. Run `syncDebug.exportSyncData()` → saves JSON file
2. Take screenshot of Console errors
3. Note exact steps to reproduce
4. Create GitHub issue with:
   - Test number that failed
   - Exported JSON file
   - Console screenshot
   - Browser & version
