# Smoke Test Checklist - MAXIMUS PWA v1.1.0

## Prerequisites
- [ ] Fresh browser or incognito mode
- [ ] Network throttling tools available (DevTools)
- [ ] Valid Supabase credentials configured
- [ ] Database migration 0004 applied

## 1. Authentication & Initial Setup
- [ ] Can access login page
- [ ] Can sign in with valid credentials
- [ ] Profile loads correctly
- [ ] Settings sync from Supabase
- [ ] Dark mode toggle works
- [ ] Logout and re-login works

## 2. Online Mode - Basic Operations

### Create Order (ProfitEngine)
- [ ] Navigate to home (ProfitEngine)
- [ ] Enter order price (e.g., 20000)
- [ ] Enter distance (e.g., 5)
- [ ] See correct profit calculation
- [ ] Click "Terima Order"
- [ ] See success animation
- [ ] Toast notification appears
- [ ] Order appears in Riwayat immediately

### Create Expense
- [ ] Navigate to Riwayat
- [ ] Click "+" button to add expense
- [ ] Enter amount (e.g., 15000)
- [ ] Select category (e.g., Bensin)
- [ ] Add note (optional)
- [ ] Save expense
- [ ] Toast notification appears
- [ ] Expense appears in Riwayat immediately

### View Transactions
- [ ] Navigate to Riwayat
- [ ] See today's recap (income, expense, net)
- [ ] See monthly metrics
- [ ] See chart for last 7 days
- [ ] See transaction list
- [ ] Transaction list shows both orders and expenses
- [ ] Can scroll through transactions

### Edit Order
- [ ] Navigate to Riwayat
- [ ] Click "Edit" on an order
- [ ] Edit modal opens
- [ ] Can modify distance
- [ ] Can modify created_at timestamp
- [ ] Save changes
- [ ] Changes reflect in list immediately

### Delete Transaction
- [ ] Navigate to Riwayat
- [ ] Click "Hapus" on a transaction
- [ ] Confirmation modal appears
- [ ] Confirm deletion
- [ ] Transaction disappears from list
- [ ] Toast notification appears

## 3. Sync Status & Monitoring

### Online Status
- [ ] SyncStatusBanner shows when online
- [ ] Shows last sync time
- [ ] Shows pending operations count (should be 0 when synced)
- [ ] "Sync Now" button available

### Manual Sync
- [ ] Click "Sync Now" button
- [ ] Banner shows "Syncing..." status
- [ ] Spinner animation appears
- [ ] Banner returns to "Synced" after completion
- [ ] Last sync time updates

## 4. Offline Mode - Critical Test

### Go Offline
- [ ] Open DevTools Network tab
- [ ] Select "Offline" from throttling dropdown
- [ ] OR disable network connection
- [ ] SyncStatusBanner shows "Offline" status
- [ ] Banner has yellow/warning background

### Create Order While Offline
- [ ] Navigate to ProfitEngine
- [ ] Enter order details
- [ ] Click "Terima Order"
- [ ] Success animation appears (optimistic UI)
- [ ] Order appears in Riwayat immediately
- [ ] SyncStatusBanner shows "X pending" operations

### Create Expense While Offline
- [ ] Navigate to Riwayat
- [ ] Add new expense
- [ ] Expense saved successfully (optimistic)
- [ ] Appears in transaction list immediately
- [ ] Pending count increases in banner

### Edit While Offline
- [ ] Edit an existing order
- [ ] Changes save successfully (optimistic)
- [ ] Changes visible immediately
- [ ] Pending count increases

### Delete While Offline
- [ ] Delete a transaction
- [ ] Transaction disappears immediately (soft delete)
- [ ] Pending count increases

### Refresh Page While Offline
- [ ] Refresh the page (F5 or Ctrl+R)
- [ ] App loads successfully
- [ ] All offline changes still visible
- [ ] Pending operations preserved
- [ ] SyncStatusBanner shows correct state

## 5. Going Back Online - Auto Sync

### Reconnect
- [ ] Re-enable network connection
- [ ] SyncStatusBanner shows "Syncing..." automatically
- [ ] Pending operations processed
- [ ] Banner shows "Synced" when complete
- [ ] Pending count returns to 0

### Verify Data in Supabase
- [ ] Open Supabase dashboard
- [ ] Check orders table
- [ ] Offline-created orders present with client_tx_id
- [ ] Updated orders have correct data
- [ ] Deleted transactions have deleted_at timestamp
- [ ] Check expenses table
- [ ] All offline changes synchronized

## 6. Multi-Device Sync (Optional but Important)

### Device A (make changes)
- [ ] Create order on Device A
- [ ] Create expense on Device A
- [ ] Wait for sync (or click "Sync Now")

### Device B (pull changes)
- [ ] Open app on Device B
- [ ] Wait for auto-sync
- [ ] Changes from Device A appear
- [ ] New order visible
- [ ] New expense visible

### Conflict Test (Advanced)
- [ ] Edit same order on both devices while offline
- [ ] Bring both devices online
- [ ] Both sync successfully
- [ ] Server version wins (last write)
- [ ] Conflict notification may appear (check console)

## 7. Navigation & Routing

### Deep Links
- [ ] Directly navigate to /history
- [ ] Page loads correctly
- [ ] Data displays from cache
- [ ] Navigate to /insight
- [ ] Insight page loads
- [ ] Navigate to /profile
- [ ] Settings page loads

### Back/Forward Navigation
- [ ] Use browser back button
- [ ] Use browser forward button
- [ ] Navigation works smoothly
- [ ] No 404 errors
- [ ] Data persists across navigation

## 8. Error Handling & Recovery

### Network Error During Sync
- [ ] Go offline mid-sync (hard to test)
- [ ] App handles gracefully
- [ ] Retry occurs when online
- [ ] No data corruption

### Invalid Data Entry
- [ ] Try to create order with negative price
- [ ] Validation error shown
- [ ] Try to create expense with invalid amount
- [ ] Validation error shown
- [ ] No corrupt data in cache

### Error Boundary Test
- [ ] Manually trigger error (modify code to throw)
- [ ] Error boundary catches it
- [ ] User sees error UI
- [ ] "Copy" button works
- [ ] Error info copied to clipboard
- [ ] "Muat Ulang" button reloads app

## 9. Performance & UX

### Load Time
- [ ] App loads in < 3 seconds (online)
- [ ] App loads in < 1 second (offline from cache)
- [ ] No long loading spinners
- [ ] Optimistic UI feels instant

### Calculations
- [ ] Profit calculations correct
- [ ] Daily recap correct
- [ ] Monthly metrics correct
- [ ] Chart data accurate
- [ ] No NaN values anywhere

### Visual Feedback
- [ ] Animations smooth
- [ ] Transitions clean
- [ ] Toast notifications clear
- [ ] Loading states appropriate
- [ ] Press effects work on buttons

## 10. Data Integrity

### After Full Flow
- [ ] Count transactions in UI
- [ ] Count transactions in Supabase
- [ ] Numbers match
- [ ] No duplicate transactions
- [ ] No missing transactions
- [ ] Soft-deleted items not visible (unless viewing trash)
- [ ] All client_tx_id values present
- [ ] All updated_at timestamps present

## Summary Checklist

### Critical Path (Must Pass)
- [ ] Can create order offline
- [ ] Can create expense offline
- [ ] Data persists after page refresh
- [ ] Auto-sync works when coming online
- [ ] No data loss
- [ ] No UI crashes

### Important Features (Should Pass)
- [ ] Manual sync button works
- [ ] Sync status accurate
- [ ] Edit operations work offline
- [ ] Delete operations work offline
- [ ] Multi-device sync works
- [ ] Error handling graceful

### Nice to Have (May Defer)
- [ ] Conflict notifications visible
- [ ] Performance metrics acceptable
- [ ] Visual polish complete
- [ ] All edge cases handled

## Test Results

**Date:** _________________
**Tester:** _________________
**Browser:** _________________
**Device:** _________________

**Overall Result:** ☐ PASS ☐ FAIL

**Issues Found:**
1. _________________
2. _________________
3. _________________

**Notes:**
_________________
_________________
_________________
