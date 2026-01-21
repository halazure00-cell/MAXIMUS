# Regression Smoke Test - MAXIMUS PWA

## Purpose

This document provides a streamlined 10-step regression test suite covering critical user journeys and features. Use this checklist to quickly verify that core functionality works after code changes, deployments, or infrastructure updates.

---

## Test Environment Setup

### Prerequisites
- [ ] Fresh browser session or incognito mode
- [ ] Valid Supabase credentials
- [ ] Database migration 0004 applied and verified
- [ ] Network throttling tools available (Chrome/Edge DevTools)
- [ ] Test user account with sample data

### Test Data Preparation
- Create a test user or use existing credentials
- Ensure at least 2-3 existing orders in the database
- Ensure at least 1-2 existing expenses in the database
- Clear browser cache if testing PWA installation

---

## 10-Step Regression Test Suite

### Step 1: Login & Authentication
**Objective:** Verify user can authenticate and access the application

**Actions:**
1. Navigate to application URL
2. Enter valid credentials (email for Magic Link or existing session)
3. Submit login form
4. Wait for authentication redirect

**Expected Results:**
- [ ] Login page loads without errors
- [ ] Authentication succeeds
- [ ] User redirected to home page (ProfitEngine)
- [ ] User profile data loads correctly
- [ ] No console errors in DevTools
- [ ] SyncStatusBanner displays "Synced" or "Offline" status

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 2: Add Order (Online Mode)
**Objective:** Verify order creation in online mode with profit calculation

**Actions:**
1. Navigate to home page (ProfitEngine)
2. Enter order price: `25000` (IDR)
3. Enter distance: `7` (km)
4. Review calculated profit
5. Click "Terima Order" button
6. Wait for success animation

**Expected Results:**
- [ ] Profit calculation displays correctly (order price - commission - operational cost)
- [ ] "Terima Order" button is enabled
- [ ] Success animation plays
- [ ] Toast notification appears: "Order berhasil disimpan"
- [ ] Order immediately appears in Riwayat (History) page
- [ ] Sync status shows "Synced" with 0 pending operations
- [ ] Order has a unique `client_tx_id` in database

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 3: Add Expense (Online Mode)
**Objective:** Verify expense tracking functionality

**Actions:**
1. Navigate to Riwayat (History) page
2. Click "+" or "Add Expense" button
3. Enter amount: `15000` (IDR)
4. Select category: "Bensin" (Fuel)
5. Add optional note: "Isi bensin Pertamax"
6. Click "Save" or "Simpan" button

**Expected Results:**
- [ ] Expense form opens correctly
- [ ] All input fields are functional
- [ ] Category dropdown displays options
- [ ] Save button submits form
- [ ] Toast notification appears: "Pengeluaran berhasil disimpan"
- [ ] Expense appears in transaction list immediately
- [ ] Daily recap updates (expense total increases)
- [ ] Monthly metrics update correctly

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 4: Offline Add (Order Creation While Offline)
**Objective:** Verify offline-first architecture with optimistic UI updates

**Actions:**
1. Open Chrome/Edge DevTools → Network tab
2. Set throttling to "Offline" mode
3. Navigate to ProfitEngine (home)
4. Enter order price: `30000` (IDR)
5. Enter distance: `10` (km)
6. Click "Terima Order" button
7. Observe UI behavior

**Expected Results:**
- [ ] SyncStatusBanner shows "Offline" status with warning/yellow indicator
- [ ] Order creation form still works (not disabled)
- [ ] Success animation plays (optimistic UI)
- [ ] Toast notification appears
- [ ] Order appears in Riwayat immediately
- [ ] SyncStatusBanner shows "X pending operations" (count increases)
- [ ] No error messages displayed
- [ ] IndexedDB contains the pending operation

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 5: Manual Sync Trigger
**Objective:** Verify manual sync functionality and UI feedback

**Actions:**
1. Re-enable network (turn off "Offline" mode in DevTools)
2. Wait for automatic sync detection OR
3. Click "Sync Now" button in SyncStatusBanner
4. Observe sync process

**Expected Results:**
- [ ] SyncStatusBanner changes to "Syncing..." status
- [ ] Spinner/loading animation appears
- [ ] Sync completes within 5 seconds
- [ ] SyncStatusBanner shows "Synced" status
- [ ] Pending operations count returns to 0
- [ ] Last sync timestamp updates
- [ ] Offline-created order now exists in Supabase with `client_tx_id`
- [ ] No error banners or failed operations

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 6: Delete Transaction
**Objective:** Verify soft delete functionality and sync behavior

**Actions:**
1. Navigate to Riwayat (History)
2. Find an existing order or expense
3. Click "Hapus" (Delete) button
4. Confirm deletion in modal dialog
5. Wait for sync (online) or check pending ops (offline)

**Expected Results:**
- [ ] Confirmation modal appears: "Yakin ingin menghapus transaksi ini?"
- [ ] Cancel button dismisses modal without deleting
- [ ] Confirm button deletes transaction
- [ ] Transaction disappears from UI immediately (optimistic)
- [ ] Toast notification appears: "Transaksi berhasil dihapus"
- [ ] Sync completes successfully
- [ ] Database shows `deleted_at` timestamp (soft delete, not hard delete)
- [ ] Transaction does not reappear after page refresh

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 7: Heatmap View (Smart Strategy Map)
**Objective:** Verify interactive map functionality and data visualization

**Actions:**
1. Navigate to Insight or Map page
2. Locate the heatmap/strategy map component
3. Interact with map controls (zoom, pan)
4. Check for location markers or heatmap overlays
5. Click on a marker or region (if applicable)

**Expected Results:**
- [ ] Map loads using Leaflet library
- [ ] Base tiles (OpenStreetMap or similar) display correctly
- [ ] Zoom controls (+/-) work
- [ ] Pan/drag to move map works
- [ ] Heatmap overlay or markers display (if data exists)
- [ ] No console errors related to Leaflet or mapping
- [ ] Map is responsive on mobile viewport
- [ ] Location markers show relevant data (tooltips/popups)

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 8: History Edit (Modify Past Transaction)
**Objective:** Verify transaction editing and data update functionality

**Actions:**
1. Navigate to Riwayat (History)
2. Find an existing order
3. Click "Edit" button/icon
4. Edit modal opens
5. Change distance from current value to `12` (km)
6. Change timestamp to 1 hour earlier (if editable)
7. Click "Save" or "Update"

**Expected Results:**
- [ ] Edit modal opens with pre-filled data
- [ ] All fields are editable (distance, timestamp, etc.)
- [ ] Save button submits changes
- [ ] Toast notification: "Order berhasil diperbarui"
- [ ] Updated values reflect in transaction list immediately
- [ ] Profit calculation recalculates based on new distance
- [ ] Daily/monthly recap updates accordingly
- [ ] Sync completes (if online)
- [ ] Database `updated_at` timestamp changes

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 9: Profile Settings
**Objective:** Verify user settings management and persistence

**Actions:**
1. Navigate to Profile or Settings page
2. Toggle dark mode switch
3. Modify operational cost settings (if configurable)
4. Change notification preferences (if applicable)
5. Update profile information (name, driver ID, etc.)
6. Click "Save Settings" or equivalent
7. Refresh the page

**Expected Results:**
- [ ] Settings page loads without errors
- [ ] Dark mode toggle switches theme immediately
- [ ] Theme preference persists after refresh
- [ ] Operational cost changes saved to Supabase
- [ ] Profile updates sync successfully
- [ ] Toast notification confirms save: "Pengaturan berhasil disimpan"
- [ ] Settings data reloads correctly after page refresh
- [ ] No data loss or reset to defaults

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

### Step 10: End-to-End Offline-to-Online Flow
**Objective:** Verify complete offline-first workflow with data integrity

**Actions:**
1. Go offline (DevTools → Network → Offline)
2. Create 1 order
3. Create 1 expense
4. Edit an existing order
5. Delete an existing expense
6. Verify pending operations count = 4
7. Refresh the page (while still offline)
8. Verify all changes persist after refresh
9. Go back online
10. Wait for auto-sync or trigger manual sync
11. Verify all operations sync successfully

**Expected Results:**
- [ ] All 4 operations succeed while offline (optimistic UI)
- [ ] Pending operations count shows "4 pending"
- [ ] Page refresh preserves all offline changes (IndexedDB)
- [ ] SyncStatusBanner still shows "4 pending" after refresh
- [ ] Auto-sync detects network reconnection
- [ ] All pending operations process successfully
- [ ] Pending count returns to 0
- [ ] No error messages or failed operations
- [ ] Verify in Supabase: new order exists, new expense exists, edited order updated, deleted expense has `deleted_at` timestamp
- [ ] No duplicate records in database

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_________________________________________________________________________________

---

## Summary Report

### Test Execution Details

**Test Date:** _________________  
**Tested By:** _________________  
**Environment:** ☐ Production ☐ Staging ☐ Development  
**Browser:** _________________  
**Device:** _________________  
**App Version:** _________________  
**Commit SHA:** _________________  

### Results Summary

**Steps Passed:** _____ / 10  
**Steps Failed:** _____ / 10  
**Overall Status:** ☐ PASS ☐ FAIL ☐ PARTIAL

### Critical Issues Found

| Step | Issue Description | Severity | Status |
|------|-------------------|----------|--------|
| 1    |                   |          |        |
| 2    |                   |          |        |
| 3    |                   |          |        |

### Non-Critical Issues

| Step | Issue Description | Notes |
|------|-------------------|-------|
|      |                   |       |
|      |                   |       |

### Recommendations

- [ ] Proceed with deployment
- [ ] Fix critical issues before deployment
- [ ] Re-test after fixes
- [ ] Defer non-critical issues to next release

### Additional Notes
_________________________________________________________________________________
_________________________________________________________________________________
_________________________________________________________________________________
_________________________________________________________________________________

---

## Regression Test Best Practices

### Before Running Tests
1. **Clear Cache:** Use incognito mode or clear browser data
2. **Check Database:** Verify migrations are applied
3. **Network Tools:** Keep DevTools open to monitor network/console
4. **Baseline Data:** Ensure test account has representative data

### During Testing
1. **Document Everything:** Note exact steps that fail
2. **Screenshots:** Capture errors and unexpected behavior
3. **Console Logs:** Copy any error messages from DevTools Console
4. **Network Logs:** Check for failed API requests in Network tab

### After Testing
1. **Report Issues:** Create detailed bug reports for failures
2. **Share Results:** Communicate pass/fail status to team
3. **Verify Fixes:** Re-test after bug fixes deployed
4. **Update Docs:** Note any test procedure changes needed

---

## Appendix: Quick Troubleshooting

### Common Issues & Solutions

**Issue:** Sync stuck in "Syncing..." state  
**Solution:** Check Network tab for failed requests, verify Supabase credentials, check RLS policies

**Issue:** Offline operations not queuing  
**Solution:** Verify Service Worker is registered, check IndexedDB for `offline_ops` store

**Issue:** Data not persisting after refresh  
**Solution:** Check IndexedDB in DevTools → Application → Storage, verify cache layer working

**Issue:** Heatmap not loading  
**Solution:** Check console for Leaflet errors, verify map tile URLs, check internet connection

**Issue:** Dark mode not toggling  
**Solution:** Verify localStorage/settings persistence, check theme CSS classes applied

---

## Related Documentation

- `SMOKE_TEST_CHECKLIST.md` - Full comprehensive smoke test
- `docs/RELEASE_BASELINE.md` - Release candidate baseline snapshot
- `docs/SYNC_TROUBLESHOOTING.md` - Detailed sync debugging guide
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification steps
