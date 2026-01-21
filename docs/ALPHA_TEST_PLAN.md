# MAXIMUS Alpha Test Plan (Manual Testing)

**Version:** 1.0  
**Date:** January 2026  
**Target:** MAXIMUS PWA - Financial Assistant for Maxim Drivers

---

## Table of Contents
1. [Test Environment Setup](#test-environment-setup)
2. [Offline-First Sync Testing](#offline-first-sync-testing)
3. [Deletion Conflict Behavior](#deletion-conflict-behavior)
4. [Heatmap Estimation Labeling](#heatmap-estimation-labeling)
5. [Settings Persistence](#settings-persistence)
6. [General Functionality](#general-functionality)

---

## Test Environment Setup

### Prerequisites
- [ ] **Pass/Fail**: MAXIMUS installed as PWA on test device
- [ ] **Pass/Fail**: Valid Supabase account configured
- [ ] **Pass/Fail**: Chrome DevTools or equivalent for network simulation
- [ ] **Pass/Fail**: Two devices (or browser profiles) for multi-device testing

### Test Data Preparation
- [ ] **Pass/Fail**: At least 10 sample orders created
- [ ] **Pass/Fail**: At least 5 sample expenses created
- [ ] **Pass/Fail**: Profile settings configured with custom values

---

## Offline-First Sync Testing

### TC-SYNC-001: Basic Offline Order Creation
**Objective:** Verify orders can be created while offline and sync when back online

**Steps:**
1. Open MAXIMUS and ensure initial sync is complete
2. Enable Airplane Mode or disable network in DevTools (Network tab → Offline)
3. Navigate to Profit Engine (/)
4. Create a new order:
   - Order price: Rp 25,000
   - Distance: 5 KM
   - Commission type: Priority (10%)
5. Submit the order
6. Verify "SyncStatusBanner" shows "Offline" with pending operations count
7. Re-enable network connection
8. Wait for auto-sync or trigger manual sync
9. Verify SyncStatusBanner shows "Online" and pending count = 0
10. Check Supabase database to confirm order exists

**Expected Result:**
- Order saved to IndexedDB while offline
- Oplog entry created in local database
- Order successfully pushed to Supabase when online
- No data loss or duplicate entries

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SYNC-002: Multiple Offline Operations Queue
**Objective:** Verify multiple operations are queued and synced in order

**Steps:**
1. Go offline
2. Create 3 orders with different amounts
3. Create 2 expenses (fuel, maintenance)
4. Edit 1 existing order (change price)
5. Delete 1 existing expense
6. Verify pending operations count = 6 (3 create + 2 create + 1 update + 1 delete)
7. Go online and wait for sync
8. Verify all operations applied correctly in Supabase

**Expected Result:**
- All operations queued in oplog
- Operations synced in FIFO order
- Final state in Supabase matches local state

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SYNC-003: Network Interruption During Sync
**Objective:** Verify sync recovery when network fails mid-sync

**Steps:**
1. Create 5 offline orders
2. Go online and immediately disable network after 2-3 seconds
3. Check oplog for remaining operations
4. Re-enable network
5. Verify sync resumes and completes successfully

**Expected Result:**
- Partial sync progress saved
- Remaining operations retry automatically
- No operations lost or duplicated

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SYNC-004: Sync Timestamp Tracking
**Objective:** Verify last_sync_at timestamp prevents duplicate pulls

**Steps:**
1. Perform complete sync
2. Note the "Last synced" timestamp in SyncStatusBanner
3. Add new order via Supabase Admin Panel (server-side)
4. Trigger manual sync in MAXIMUS
5. Verify only the new order is pulled (not all historical data)
6. Check IndexedDB meta store for updated last_sync_at

**Expected Result:**
- Incremental sync based on timestamp
- Only new/modified records pulled
- Bandwidth efficient

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SYNC-005: Failed Operation Permanent Error Handling
**Objective:** Verify permanent errors move to failed_ops without retry

**Steps:**
1. Simulate schema error (modify oplog entry to have invalid field)
2. Trigger sync
3. Check failed_ops table in IndexedDB
4. Verify invalid operation moved to failed_ops
5. Verify subsequent valid operations still sync normally

**Expected Result:**
- Permanent errors isolated in failed_ops
- Sync continues for valid operations
- Error visible in sync status (if implemented)

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

## Deletion Conflict Behavior

### TC-DEL-001: Basic Tombstone Preservation (Local Delete First)
**Objective:** Verify deleted records stay deleted when server has updates

**Steps:**
1. Device A: Create order "Order-Test-001" with price Rp 30,000
2. Sync both devices
3. Device A: Go offline
4. Device A: Delete "Order-Test-001"
5. Device B: Edit "Order-Test-001" price to Rp 35,000
6. Device B: Sync (pushes update to server)
7. Device A: Go online and sync

**Expected Result:**
- Order-Test-001 remains deleted on Device A (tombstone preserved)
- Device A local record has deleted_at timestamp
- Server update does NOT resurrect the deleted record

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-DEL-002: Server Wins Conflict (Edit vs Edit)
**Objective:** Verify server wins when both devices edit the same record

**Steps:**
1. Create order "Order-Test-002" with price Rp 20,000
2. Sync both devices
3. Device A: Go offline
4. Device A: Edit order price to Rp 22,000
5. Device B: Edit same order price to Rp 25,000
6. Device B: Sync (server updated to Rp 25,000)
7. Device A: Go online and sync

**Expected Result:**
- Device A local price overwritten to Rp 25,000 (server wins)
- Device A unsaved change discarded
- No duplicate records created

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-DEL-003: Simultaneous Deletion on Multiple Devices
**Objective:** Verify both devices keep deletion when both delete same record

**Steps:**
1. Create order "Order-Test-003"
2. Sync both devices
3. Both devices go offline
4. Device A: Delete order at 10:00:00
5. Device B: Delete order at 10:00:05
6. Both devices go online and sync

**Expected Result:**
- Order deleted on both devices
- Newer deleted_at timestamp preserved (10:00:05)
- No resurrection occurs

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-DEL-004: Create-Delete Pair Coalescing
**Objective:** Verify never-synced records don't push to server when deleted offline

**Steps:**
1. Go offline
2. Create order "Order-Temp-001"
3. Immediately delete "Order-Temp-001" (before sync)
4. Go online and sync
5. Check Supabase database

**Expected Result:**
- Order-Temp-001 never appears in Supabase
- Oplog coalesces create+delete operations
- Optimized sync (no unnecessary network calls)

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

## Heatmap Estimation Labeling

### TC-HEAT-001: Basic Heatmap Rendering with Recommendations
**Objective:** Verify heatmap displays and shows recommendation labels

**Steps:**
1. Ensure at least 10 orders exist with geolocation data
2. Navigate to Insight page (/insight)
3. Select time period "Pagi (5-11)"
4. Wait for heatmap to load
5. Verify colored H3 hexagons appear on map
6. Check for recommendation labels (e.g., "Recommended", "Consider", "Avoid")
7. Tap on a cell to see details

**Expected Result:**
- Heatmap renders with color-coded cells
- Labels indicate recommendation strength
- Cell details show: NPH, conversion rate, sample size
- Color intensity matches recommendation score

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-HEAT-002: Minimum Order Threshold for Recommendations
**Objective:** Verify cells with <5 orders don't get strong recommendations

**Steps:**
1. Create new area with only 2-3 orders
2. Navigate to Insight page
3. Select relevant time period
4. Locate the new area on heatmap

**Expected Result:**
- Area shown with low confidence indicator
- Label shows "Insufficient Data" or exploration bonus applied
- No strong "Recommended" label on sparse data

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-HEAT-003: Time Period Filtering Accuracy
**Objective:** Verify heatmap recalculates for different time periods

**Steps:**
1. Navigate to Insight page
2. Create orders in different time slots:
   - 3 orders at 07:00 (Pagi) in Area A
   - 3 orders at 20:00 (Malam) in Area B
3. Select "Pagi (5-11)" filter
4. Verify Area A shows data, Area B is empty/low
5. Switch to "Malam (19-23)" filter
6. Verify Area B shows data, Area A is empty/low

**Expected Result:**
- Time filtering correctly segments data
- Heatmap updates dynamically on filter change
- Accurate recommendations per time slot

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-HEAT-004: Net Per Hour (NPH) Calculation
**Objective:** Verify NPH scoring considers distance, price, and deadhead cost

**Steps:**
1. Create 2 orders in same H3 cell:
   - Order A: Rp 50,000 price, 10 KM distance, 30 min duration
   - Order B: Rp 30,000 price, 3 KM distance, 15 min duration
2. Refresh heatmap
3. Inspect cell details (enable debug mode ?debug=heatmap)
4. Verify NPH calculation:
   - Order B should have higher NPH (higher profit per time)

**Expected Result:**
- NPH accurately reflects (net_profit / hour)
- Shorter, profitable trips score higher
- Long, low-profit trips penalized

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-HEAT-005: Exploration Bonus for Untried Locations
**Objective:** Verify new areas get exploration bonus in recommendations

**Steps:**
1. Identify an H3 cell with 0 historical orders
2. Navigate to Insight page
3. Locate the empty cell on map
4. Verify label indicates exploration opportunity

**Expected Result:**
- Empty cells not marked as "Avoid"
- Exploration bonus applied (if feature enabled)
- Neutral or slight positive recommendation for discovery

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

## Settings Persistence

### TC-SET-001: Local Settings Save on Page Reload
**Objective:** Verify settings persist in localStorage across sessions

**Steps:**
1. Open ProfileSettings page
2. Change the following:
   - Driver Name: "Test Driver Alpha"
   - Daily Target: Rp 300,000
   - Vehicle Type: "matic_besar"
   - Fuel Efficiency: Rp 250/KM
3. Save settings
4. Close browser/PWA completely
5. Reopen MAXIMUS
6. Navigate to ProfileSettings

**Expected Result:**
- All settings restored exactly as saved
- No reversion to defaults
- localStorage contains maximus_settings key

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SET-002: Settings Sync to Supabase Cloud
**Objective:** Verify settings push to profiles table in Supabase

**Steps:**
1. Open ProfileSettings
2. Change daily target to Rp 350,000
3. Wait 500ms (debounce period)
4. Check Supabase profiles table in Admin Panel
5. Verify daily_target column updated to 350000

**Expected Result:**
- Settings saved to cloud within 1 second
- Profiles table reflects new values
- No errors in browser console

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SET-003: Multi-Device Settings Sync
**Objective:** Verify settings sync across devices

**Steps:**
1. Device A: Change driver name to "Device A Driver"
2. Device A: Sync (or wait for auto-sync)
3. Device B: Trigger manual sync or refresh app
4. Device B: Navigate to ProfileSettings
5. Verify driver name shows "Device A Driver"

**Expected Result:**
- Settings propagate to all devices
- Most recent change wins
- No settings lost

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SET-004: Dark Mode Auto-Toggle
**Objective:** Verify dark mode activates automatically during night hours

**Steps:**
1. Set device time to 19:30 (7:30 PM)
2. Open MAXIMUS or refresh page
3. Verify UI switches to dark mode
4. Change device time to 09:00 (9:00 AM)
5. Refresh page
6. Verify UI switches to light mode

**Expected Result:**
- Dark mode: 18:00 - 06:00
- Light mode: 06:00 - 18:00
- Smooth transition without page reload (if implemented)

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-SET-005: Settings Offline Modification and Sync
**Objective:** Verify settings can be changed offline and sync later

**Steps:**
1. Go offline
2. Change fuel efficiency to Rp 300/KM
3. Verify changes reflected immediately in UI
4. Check localStorage for updated value
5. Go online
6. Wait for sync
7. Verify Supabase profiles table updated

**Expected Result:**
- Offline changes save locally
- UI updates immediately
- Cloud sync occurs when reconnected

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

## General Functionality

### TC-GEN-001: Profit Engine Real-Time Calculation
**Objective:** Verify profit calculation updates instantly on input

**Steps:**
1. Navigate to Profit Engine (/)
2. Enter order price: Rp 50,000
3. Enter distance: 8 KM
4. Select "Priority (10%)" commission
5. Verify calculation shows:
   - Commission: Rp 5,000
   - Fuel cost: ~Rp 1,600 (8 KM × Rp 200/KM default)
   - Maintenance: Rp 500
   - Net profit: ~Rp 42,900

**Expected Result:**
- Calculations update without page reload
- Accurate commission deduction
- Fuel and maintenance costs applied correctly

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-GEN-002: Order History Edit Functionality
**Objective:** Verify past orders can be edited and changes persist

**Steps:**
1. Navigate to Riwayat (History) page
2. Select an existing order
3. Click Edit button
4. Change order price from Rp 30,000 to Rp 35,000
5. Save changes
6. Verify updated price in list
7. Trigger sync
8. Check Supabase for updated record

**Expected Result:**
- Edit modal opens with current values
- Changes save locally and sync to cloud
- Updated_at timestamp refreshed

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-GEN-003: Expense Tracking and Categorization
**Objective:** Verify expenses can be added with correct categories

**Steps:**
1. Navigate to Riwayat page
2. Click "Add Expense" button
3. Add expense:
   - Category: "Fuel"
   - Amount: Rp 15,000
   - Notes: "Pertamax 1 liter"
4. Save expense
5. Verify expense appears in list with correct category icon
6. Check 7-day chart includes expense in calculation

**Expected Result:**
- Expense saved with category
- Visible in transaction history
- Deducted from daily profit calculations

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-GEN-004: Daily Recap Accuracy
**Objective:** Verify daily recap shows correct totals

**Steps:**
1. Create 3 orders: Rp 25,000, Rp 30,000, Rp 20,000
2. Create 2 expenses: Rp 10,000 (fuel), Rp 5,000 (parking)
3. Navigate to Riwayat page
4. Check daily recap widget
5. Verify:
   - Total Income = sum of order net profits
   - Total Expenses = Rp 15,000
   - Net Profit = Income - Expenses

**Expected Result:**
- Accurate aggregation of daily data
- Correct profit/loss calculation
- Visual indicators for target achievement

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

### TC-GEN-005: PWA Installation and Offline Access
**Objective:** Verify app can be installed as PWA and accessed offline

**Steps:**
1. Open MAXIMUS in Chrome (mobile or desktop)
2. Click browser "Install" prompt or menu → "Install MAXIMUS"
3. Verify app icon appears on home screen/desktop
4. Launch MAXIMUS from installed icon
5. Enable Airplane Mode
6. Verify app loads and shows cached data

**Expected Result:**
- PWA installs successfully
- Offline access to all cached pages
- Service worker serves cached assets

**Pass/Fail:** ☐ Pass ☐ Fail

**Notes:**
_____________________________________________

---

## Test Sign-Off

**Tester Name:** _______________________________  
**Date Completed:** ____________________________  
**Overall Result:** ☐ Pass ☐ Fail ☐ Pass with Minor Issues

**Critical Issues Found:**
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

**Recommendations:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**End of Alpha Test Plan**
