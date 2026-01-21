# RLS Operations Notes

**Migration:** 0005_rls_hardening.sql  
**System:** MAXIMUS PWA - Offline-First Sync  
**Database:** Supabase Postgres + RLS

---

## Overview

This document provides operational guidance for managing Row Level Security (RLS) policies in production, diagnosing common RLS failures, and safely rolling out the RLS hardening migration.

---

## Understanding the Delete Strategy

### Soft-Delete Only (Enforced by RLS)

**Design Decision:**
- Hard DELETE is **blocked** at the database policy level
- Clients use UPDATE to set `deleted_at` timestamp
- Tombstones (rows with `deleted_at != null`) are preserved for sync

**Why Soft-Delete?**
1. **Multi-Device Sync:** Deleting on Device A must propagate to Device B
2. **Offline Support:** Can't propagate hard DELETE if device was offline
3. **Audit Trail:** Deleted data remains queryable for debugging
4. **Undo Capability:** User can "undelete" by clearing `deleted_at`

**Implementation:**
- `offlineOps.js`: `deleteOrder()` / `deleteExpense()` call `softDeleteCached*()`
- `syncEngine.js`: `pushDelete()` sends UPDATE, not DELETE (line 390)
- Migration 0005: Removes DELETE policies to enforce at DB level

**Client Code Pattern:**
```javascript
// CORRECT: Soft-delete
await supabase
  .from('orders')
  .update({ deleted_at: new Date().toISOString() })
  .eq('user_id', userId)
  .eq('client_tx_id', clientTxId);

// WRONG: Hard delete (will fail with RLS error)
await supabase
  .from('orders')
  .delete()
  .eq('user_id', userId)
  .eq('client_tx_id', clientTxId);
```

---

## Common RLS Failure Modes

### 1. Permission Denied on DELETE

**Symptom:**
```
Error: permission denied for table orders
```

**Cause:**
- Client code attempted hard DELETE
- No DELETE policy exists (by design, post-migration 0005)

**Diagnosis:**
```sql
-- Check if DELETE policy exists
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'orders' 
  AND cmd = 'DELETE';
-- Should return 0 rows after migration 0005
```

**Resolution:**
- Update client code to use soft-delete (UPDATE deleted_at)
- Do NOT add DELETE policy (breaks soft-delete design)
- Check `offlineOps.js` and ensure app uses `deleteOrder()` not direct DELETE

**Prevention:**
- Code review: search for `.delete()` calls on user tables
- Ensure all deletes go through `offlineOps.deleteOrder()` / `deleteExpense()`

---

### 2. New Row Violates RLS Policy (INSERT)

**Symptom:**
```
Error: new row violates row-level security policy for table "orders"
```

**Cause:**
- Client attempted to insert row with `user_id` != `auth.uid()`
- INSERT policy WITH CHECK failed

**Diagnosis:**
```sql
-- Check INSERT policy
SELECT policyname, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'orders' 
  AND cmd = 'INSERT';

-- Expected: with_check = (auth.uid() = user_id)
```

**Common Scenarios:**
1. **Bug:** Client code passes wrong user_id
2. **Auth Error:** JWT expired, `auth.uid()` returns null
3. **Impersonation Attempt:** Malicious client tries to create data for another user

**Resolution:**
- Verify client passes correct `user_id` matching session
- Check JWT is valid and not expired
- If client code is correct, this is working as intended (security block)

**Client Code Check:**
```javascript
// CORRECT: user_id matches authenticated session
const { data: { user } } = await supabase.auth.getUser();
await supabase.from('orders').insert({
  user_id: user.id, // Must match auth.uid()
  ...orderData
});

// WRONG: hardcoded or different user_id
await supabase.from('orders').insert({
  user_id: 'some-other-user-id', // Will fail RLS
  ...orderData
});
```

---

### 3. Row-Level Security Violation (UPDATE)

**Symptom:**
```
Error: new row violates row-level security policy for table "orders"
```
(Note: Same error as INSERT, but on UPDATE)

**Cause:**
- UPDATE attempted to change `user_id` to different user
- WITH CHECK clause failed

**Diagnosis:**
```sql
-- Check UPDATE policy
SELECT policyname, using, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'orders' 
  AND cmd = 'UPDATE';

-- Expected:
--   using = (auth.uid() = user_id)
--   with_check = (auth.uid() = user_id)
```

**Resolution:**
- Client should NOT modify `user_id` in UPDATE
- Ensure client code preserves `user_id` from existing row
- If intentional user transfer needed, must be done via service role (admin)

---

### 4. Zero Rows Updated/Deleted (Silent Failure)

**Symptom:**
- UPDATE or DELETE returns success but affects 0 rows
- No error thrown

**Cause:**
- Row exists but USING clause filters it out
- User attempting to modify another user's data

**Diagnosis:**
```sql
-- As User A, check if row exists for User B
SELECT id, user_id FROM orders WHERE id = 123;
-- If returns 0 rows, either:
--   a) Row doesn't exist, OR
--   b) Row exists but belongs to another user (RLS filtered)

-- Use service role to check actual existence
SET ROLE service_role;
SELECT id, user_id FROM orders WHERE id = 123;
-- If returns row with different user_id, it's RLS working correctly
```

**Resolution:**
- This is **correct behavior** (security working)
- Application should handle "row not found" gracefully
- Do NOT show error to user (leaks information about other users' data)

---

### 5. Schema Errors vs RLS Errors

**How to Distinguish:**

| Error Type | Example Message | PostgreSQL Code |
|------------|----------------|-----------------|
| **Schema Error** | column "deleted_at" does not exist | `42703` |
| **Schema Error** | relation "orders" does not exist | `42P01` |
| **RLS Error** | new row violates row-level security policy | `42501` |
| **RLS Error** | permission denied for table orders | `42501` |
| **Auth Error** | JWT expired | (Supabase error) |

**Diagnosis Steps:**

1. **Check if migration applied:**
```sql
-- List all applied migrations
SELECT version, name FROM supabase_migrations.schema_migrations
ORDER BY version;

-- Should see 0005_rls_hardening if applied
```

2. **Check if column exists:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'deleted_at';
-- Should return 1 row
```

3. **Check if RLS enabled:**
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'orders';
-- rowsecurity should be true
```

4. **Check policies exist:**
```sql
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orders';
-- Should see SELECT, INSERT, UPDATE (no DELETE after migration 0005)
```

**Common Resolution:**
- Schema errors: Run missing migration (e.g., 0004_offline_first, 0005_rls_hardening)
- RLS errors: Fix client code or verify auth session

---

## Interpreting Supabase Error Messages

### Error Code Mapping

**Supabase Client Error:**
```javascript
{
  message: "new row violates row-level security policy",
  code: "42501",
  hint: null
}
```

**Mapping:**
- `code: "42501"` → **RLS_DENIED** (insufficient privilege)
- `code: "42703"` → **SCHEMA_MISMATCH** (undefined column)
- `code: "42P01"` → **SCHEMA_MISMATCH** (undefined table)
- `message.includes("JWT")` → **AUTH_ERROR** (expired or invalid token)
- `message.includes("permission denied")` → **RLS_DENIED**

### Application Error Handling

**syncEngine.js** already implements this (lines 73-109):

```javascript
function checkPermanentError(error) {
  const errorMsg = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';
  
  // Schema errors (don't retry)
  if (errorCode === '42703' || errorCode === '42P01') {
    return {
      isPermanent: true,
      errorType: 'schema',
      message: 'Database schema error. Migration required. Contact administrator.',
    };
  }
  
  // RLS errors (don't retry)
  if (errorCode === '42501' || errorMsg.includes('policy')) {
    return {
      isPermanent: true,
      errorType: 'permission',
      message: 'Permission denied. Row-level security policy issue. Contact administrator.',
    };
  }
  
  return { isPermanent: false };
}
```

**Best Practice:**
- Schema errors: Show user message to contact admin (needs migration)
- RLS errors: Show user message to contact admin (needs policy fix or bug fix)
- Auth errors: Prompt user to re-login
- Transient network errors: Auto-retry (syncEngine handles this)

---

## Safe Rollout Sequence

### Pre-Deployment Checklist

- [ ] Migration 0005_rls_hardening.sql reviewed and approved
- [ ] Backup of production database taken
- [ ] Migration tested on local/dev environment
- [ ] Migration tested on staging with real data
- [ ] QA checklist (docs/RLS_QA_CHECKLIST.md) completed on staging
- [ ] Team notified of deployment window
- [ ] Rollback plan documented (see below)

### Deployment Steps (Staging)

1. **Apply Migration:**
```bash
# Using Supabase CLI
supabase db push --db-url $STAGING_DATABASE_URL

# OR via Supabase Studio (Staging)
# SQL Editor → Run 0005_rls_hardening.sql
```

2. **Verify Migration:**
```sql
-- Check migration applied
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE version = '0005';

-- Verify policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Expected: No DELETE policies on orders/expenses
```

3. **Run QA Tests:**
- Follow docs/RLS_QA_CHECKLIST.md
- Test with two real user accounts
- Test sync (pull/push) with real devices
- Test soft-delete workflow

4. **Monitor Errors:**
```bash
# Watch Supabase logs for RLS errors
supabase functions logs --tail

# Look for:
# - "permission denied"
# - "violates row-level security"
# - Increased 42501 error codes
```

5. **Soak Test (24-48 hours):**
- Monitor error rates
- Check sync success rates
- Verify no user complaints

### Deployment Steps (Production)

**Only proceed if staging soak test passes.**

1. **Announce Maintenance Window:**
- Notify users (in-app message or email)
- Duration: ~5 minutes
- Impact: Minimal (read-only operations work during migration)

2. **Pre-Migration Backup:**
```bash
# Backup production database
supabase db dump --db-url $PRODUCTION_DATABASE_URL > backup_pre_rls_hardening.sql
```

3. **Apply Migration:**
```bash
# Production migration (careful!)
supabase db push --db-url $PRODUCTION_DATABASE_URL

# OR via Supabase Dashboard (safer)
# Run in SQL Editor with confirmation
```

4. **Immediate Verification:**
```sql
-- Quick smoke test (< 1 minute)
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';
-- All should have rowsecurity = true

SELECT tablename, COUNT(*) FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
-- orders: 3 (SELECT, INSERT, UPDATE)
-- expenses: 3 (SELECT, INSERT, UPDATE)  
-- profiles: 3 (SELECT, INSERT, UPDATE)
-- strategic_spots: 2 (SELECT for public, ALL for service_role)
```

5. **Monitor (First Hour):**
- Watch error logs for RLS failures
- Monitor sync success rate (should be >95%)
- Check user reports

6. **Post-Deployment QA (Sample):**
- Test with 2-3 real user accounts
- Verify CRUD works
- Verify sync works
- Verify no cross-user data leaks

### Rollback Plan

**If critical issues occur within first 24 hours:**

#### Option A: Restore DELETE Policies (Partial Rollback)

If app breaks due to hard DELETE attempts:

```sql
-- Restore DELETE policies
BEGIN;

CREATE POLICY "orders_delete_own"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "expenses_delete_own"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;

-- Note: This allows hard DELETE again (not ideal for sync, but unblocks app)
-- Root cause must still be fixed (update client code to soft-delete)
```

#### Option B: Full Rollback (Database Restore)

If migration causes data corruption or critical failures:

```bash
# Restore from backup
supabase db reset --db-url $PRODUCTION_DATABASE_URL
psql $PRODUCTION_DATABASE_URL < backup_pre_rls_hardening.sql

# Or use Supabase Dashboard:
# Database → Restore from backup → Select pre-migration backup
```

**Rollback Impact:**
- Option A: Low impact, restores old delete behavior
- Option B: High impact, loses data changes made after migration

**Decision Criteria:**
- Option A: If only delete-related errors, no data loss
- Option B: If data corruption, widespread RLS failures, or user data leaks

### Post-Rollback Actions

1. **Identify Root Cause:**
- Review error logs
- Identify failing query patterns
- Check if client code vs policy mismatch

2. **Fix and Re-Test:**
- Update migration or client code
- Re-test on staging
- Document findings

3. **Re-Deploy:**
- Follow same deployment steps
- Communicate lessons learned to team

---

## Monitoring and Alerting

### Key Metrics to Track

1. **RLS Error Rate:**
```sql
-- Count RLS errors in last hour (if logging to DB)
SELECT COUNT(*) 
FROM logs 
WHERE created_at > now() - interval '1 hour'
  AND error_code = '42501';
```

2. **Sync Success Rate:**
```javascript
// Track in application telemetry
const syncSuccessRate = successfulSyncs / totalSyncAttempts;
// Alert if < 95%
```

3. **Failed Operations:**
```sql
-- Check failed_ops table (from syncEngine)
SELECT COUNT(*), table_name 
FROM failed_ops 
GROUP BY table_name;
-- Alert if count > threshold
```

### Alerts to Configure

- **Critical:** RLS error rate > 10/minute
- **Warning:** Sync success rate < 95% for > 5 minutes
- **Info:** New failed_ops entries (may indicate policy issue)

---

## Troubleshooting Flowchart

```
User reports: "Can't delete/update order"
    ↓
Check error message
    ↓
┌─────────────────────────────────────────┐
│ "permission denied for table orders"   │ → No DELETE policy (correct)
│                                         │   → Verify client uses UPDATE deleted_at
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ "violates row-level security policy"   │ → Check user_id mismatch
│                                         │   → Verify auth session valid
│                                         │   → Check client code
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ "column deleted_at does not exist"      │ → Migration not applied
│                                         │   → Run 0004 or 0005 migration
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 0 rows affected (no error)              │ → Row doesn't exist OR belongs to another user
│                                         │   → Check with service role if needed
│                                         │   → This is correct security behavior
└─────────────────────────────────────────┘
```

---

## Additional Resources

- **Migration File:** `supabase/migrations/0005_rls_hardening.sql`
- **Audit Report:** `docs/RLS_AUDIT_REPORT.md`
- **QA Checklist:** `docs/RLS_QA_CHECKLIST.md`
- **Sync Engine Code:** `src/lib/syncEngine.js`
- **Offline Ops Code:** `src/lib/offlineOps.js`
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security

---

## Support Contacts

- **Database Admin:** [Contact info]
- **Security Team:** [Contact info]
- **On-Call Engineer:** [Contact info]

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-21  
**Maintained By:** DevOps Team
