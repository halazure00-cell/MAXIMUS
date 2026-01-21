# Release Baseline - MAXIMUS PWA

## Release Candidate Snapshot

**Date:** 2026-01-21  
**Version:** v1.1.0  
**Commit SHA:** `e0672084e2359a00f8c7f4c5b4980078ba2a89b2`  
**Branch:** main  
**Status:** Release Candidate

---

## Build Instructions

### Prerequisites
- **Node.js:** Version 20.x (as specified in package.json engines)
- **npm:** Latest version compatible with Node 20.x
- **Supabase Account:** Valid credentials required for backend services

### Environment Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/halazure00-cell/MAXIMUS.git
   cd MAXIMUS
   ```

2. **Checkout Release Commit**
   ```bash
   git checkout e0672084e2359a00f8c7f4c5b4980078ba2a89b2
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Configure Environment Variables**
   
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SITE_URL=https://your-domain.com
   ```

### Build Process

#### Development Build
```bash
npm run dev
```
- Starts Vite development server
- Default URL: `http://localhost:5173`
- Hot module replacement enabled
- Suitable for local testing

#### Production Build
```bash
npm run build
```
- Executes preflight checks via `scripts/preflight.js`
- Bundles application with Vite
- Optimizes assets for production
- Output directory: `dist/`
- Build artifacts should **NOT** be committed to Git

#### Preview Production Build
```bash
npm run preview
```
- Serves the production build locally
- Tests production bundle before deployment
- Verifies build integrity

#### Code Quality Checks
```bash
npm run lint
```
- Runs ESLint on the codebase
- Must pass with 0 errors before deployment
- Checks code style and potential issues

---

## Smoke Test Steps

### Quick Smoke Test (5 minutes)

Run these essential checks to verify the release candidate is functional:

#### 1. Application Load
- [ ] Open browser to application URL
- [ ] Application loads without errors
- [ ] No console errors in DevTools
- [ ] Service Worker registers successfully (PWA)
- [ ] Login page displays correctly

#### 2. Authentication
- [ ] Can access login page
- [ ] Can sign in with valid Supabase credentials
- [ ] Authentication redirects to home/dashboard
- [ ] Profile data loads correctly
- [ ] User settings sync from Supabase

#### 3. Core Functionality - Order Creation
- [ ] Navigate to ProfitEngine (home)
- [ ] Enter order price (e.g., 20000)
- [ ] Enter distance (e.g., 5 km)
- [ ] Profit calculation displays correctly
- [ ] Click "Terima Order" button
- [ ] Success animation appears
- [ ] Order appears in Riwayat (History)

#### 4. Core Functionality - Expense Tracking
- [ ] Navigate to Riwayat (History)
- [ ] Click "+" button to add expense
- [ ] Enter amount (e.g., 15000)
- [ ] Select category (e.g., Bensin/Fuel)
- [ ] Save expense
- [ ] Expense appears in transaction list

#### 5. Offline Functionality (Critical)
- [ ] Open DevTools → Network tab
- [ ] Set throttling to "Offline"
- [ ] Create a new order
- [ ] Order saves successfully (optimistic UI)
- [ ] Sync status banner shows "X pending operations"
- [ ] Re-enable network
- [ ] Auto-sync occurs
- [ ] Pending operations clear

#### 6. Data Sync
- [ ] SyncStatusBanner displays current sync state
- [ ] Click "Sync Now" button
- [ ] Sync completes without errors
- [ ] Last sync timestamp updates
- [ ] Data persists after page refresh

#### 7. Navigation
- [ ] Navigate to Insight page
- [ ] Charts load correctly
- [ ] Navigate to Profile/Settings
- [ ] Settings load correctly
- [ ] Browser back button works
- [ ] No 404 errors on navigation

#### 8. Data Integrity
- [ ] Edit an existing order in Riwayat
- [ ] Changes save and reflect immediately
- [ ] Delete a transaction
- [ ] Confirmation modal appears
- [ ] Transaction disappears after confirmation
- [ ] Soft delete (deleted_at timestamp set)

#### 9. Visual & UX
- [ ] Dark mode toggle works
- [ ] Animations are smooth
- [ ] Toast notifications appear correctly
- [ ] Loading states display appropriately
- [ ] Mobile responsive layout works

#### 10. Logout & Re-authentication
- [ ] Click logout button
- [ ] Redirected to login page
- [ ] Session cleared
- [ ] Can log back in successfully
- [ ] Data reloads correctly

---

## Database Migration Status

**Current Migration:** `0004_offline_first.sql`

**Required Columns:**
- `client_tx_id` (UUID, unique identifier for client-side transactions)
- `updated_at` (timestamp, last modification time)
- `deleted_at` (timestamp, soft delete marker)

**Verification Query:**
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('orders', 'expenses')
  AND column_name IN ('client_tx_id', 'updated_at', 'deleted_at')
ORDER BY table_name, column_name;
```

Expected Result: 6 rows (3 columns × 2 tables)

---

## Known Issues & Limitations

### Current Limitations
1. **Clock Skew:** Devices with incorrect system time may experience unexpected conflict resolution
2. **Failed Operations:** Require manual intervention (no UI to retry/clear failed operations yet)
3. **Language:** Messages are in Indonesian only (i18n system planned)
4. **Offline Indicator:** Network status detection may lag on some browsers

### Non-Blocking Issues
- Error boundary test requires manual code modification
- Multi-device conflict resolution messages may not always display
- Performance metrics not yet instrumented

---

## Deployment Platforms

### Supported Platforms
- **Netlify:** Auto-deploy from main branch (recommended)
- **Vercel:** Auto-deploy from main branch
- **GitHub Codespaces:** Development and testing

### Environment Variables (Production)
Configure these in your hosting platform's dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`

---

## Success Criteria

### Must Pass (Blocking)
- ✅ Application loads without errors
- ✅ Authentication works
- ✅ Order creation works (online)
- ✅ Offline operations queue correctly
- ✅ Auto-sync completes successfully
- ✅ No data loss after sync

### Should Pass (Important)
- ✅ Manual sync button functional
- ✅ Sync status accurate
- ✅ Edit operations work
- ✅ Delete operations work (soft delete)
- ✅ Navigation smooth and error-free

### Nice to Have
- Performance under 3 seconds load time
- Visual polish complete
- All edge cases handled gracefully

---

## Rollback Plan

### If Critical Issues Occur:

**Option 1: Revert to Previous Commit**
```bash
git revert e0672084e2359a00f8c7f4c5b4980078ba2a89b2
git push origin main
```

**Option 2: Redeploy Previous Version**
- Access Netlify/Vercel dashboard
- Select previous successful deployment
- Click "Promote to Production"

**Option 3: Hotfix Branch**
- Create hotfix branch from main
- Apply minimal fix
- Fast-track review and merge
- Redeploy

---

## Testing Resources

### Related Documentation
- `SMOKE_TEST_CHECKLIST.md` - Comprehensive smoke test procedures
- `DEPLOYMENT_CHECKLIST.md` - Deployment verification steps
- `docs/REGRESSION_SMOKE_TEST.md` - Regression test scenarios
- `docs/SYNC_TROUBLESHOOTING.md` - Sync issue debugging

### Browser DevTools Checks
- No errors in Console tab
- Service Worker registered (Application tab)
- IndexedDB contains cached data (Application → Storage)
- Network requests succeed (Network tab)

---

## Approval Sign-off

**QA Tested By:** _________________  
**Date:** _________________  
**Approved By:** _________________  
**Date:** _________________  

**Release Status:** ☐ APPROVED ☐ REJECTED ☐ NEEDS REVISION

**Notes:**
_________________________________________________________________________________
_________________________________________________________________________________
_________________________________________________________________________________
