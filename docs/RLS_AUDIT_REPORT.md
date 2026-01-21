# RLS Audit Report

**Date:** 2026-01-21  
**Application:** MAXIMUS PWA (Offline-First Driver Financial Assistant)  
**Database:** Supabase Postgres with Row Level Security  
**Migration Base:** 0004_offline_first.sql

## Executive Summary

This audit reviews Row Level Security (RLS) policies for all user-owned and public tables in the MAXIMUS application. The app uses an offline-first sync architecture with soft-delete strategy (`deleted_at` column) for data synchronization.

**Key Findings:**
- ✅ RLS is enabled on all critical tables
- ✅ User-owned tables have basic ownership policies
- ⚠️ `profiles` table missing `deleted_at` column (inconsistent with sync pattern)
- ⚠️ No DELETE policies exist but app uses soft-delete (correct, but should be explicit)
- ⚠️ `strategic_spots` has conflicting policies that could confuse
- ✅ Sync columns (user_id, updated_at, deleted_at) present on orders & expenses

**Overall Security Status:** MODERATE - Policies are functional but need hardening for production reliability.

---

## Table-by-Table Analysis

### 1. profiles

**Purpose:** User profile/settings table (1:1 with auth.users)

**RLS Status:** ✅ ENABLED

**Current Policies:**
```sql
-- Source: 0001_final.sql lines 186-207
profiles_select_own (SELECT)
  TO authenticated
  USING (auth.uid() = id)

profiles_insert_own (INSERT)
  TO authenticated
  WITH CHECK (auth.uid() = id)

profiles_update_own (UPDATE)
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id)
```

**Current Schema (Ownership/Sync Columns):**
- ✅ `id uuid PRIMARY KEY` (references auth.users(id)) - serves as user_id
- ✅ `updated_at timestamptz NOT NULL DEFAULT now()`
- ❌ `deleted_at timestamptz` - **MISSING**
- ✅ Trigger: `profiles_set_updated_at` exists

**Risks Identified:**
1. ⚠️ **INCONSISTENT SYNC PATTERN**: Missing `deleted_at` column
   - Other user-owned tables (orders, expenses) have `deleted_at` for soft-delete
   - If user needs to "delete" profile, no soft-delete mechanism exists
   - Sync engine expects consistent soft-delete pattern across tables
   
2. ⚠️ **NO DELETE POLICY**: Intentional or oversight?
   - No explicit DELETE policy exists
   - This is correct for soft-delete approach, but should be documented
   - If hard delete is attempted by mistake, it will fail silently

**Required Changes:**
1. Add `deleted_at timestamptz` column to `profiles` for consistency
2. Add comment or explicit policy blocking hard DELETE to document intent
3. Verify `profiles` can handle soft-delete in sync workflow (may not apply if profiles aren't synced)

**Rationale:**
- Consistency: all user-owned tables should follow same sync pattern
- Future-proofing: if profile sync is added later, schema is ready
- Clarity: explicit "no DELETE" policy prevents confusion

---

### 2. orders

**Purpose:** User transaction records

**RLS Status:** ✅ ENABLED

**Current Policies:**
```sql
-- Source: 0004_offline_first.sql lines 142-201
orders_select_own (SELECT)
  TO authenticated
  USING (auth.uid() = user_id)

orders_insert_own (INSERT)
  TO authenticated
  WITH CHECK (auth.uid() = user_id)

orders_update_own (UPDATE)
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)

orders_delete_own (DELETE)
  TO authenticated
  USING (auth.uid() = user_id)
```

**Current Schema (Ownership/Sync Columns):**
- ✅ `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- ✅ `updated_at timestamptz NOT NULL DEFAULT now()`
- ✅ `deleted_at timestamptz` (nullable, for soft-delete)
- ✅ `client_tx_id uuid NOT NULL DEFAULT gen_random_uuid()` (sync key)
- ✅ Trigger: `orders_set_updated_at` exists
- ✅ Unique constraint: `orders_user_client_tx_unique (user_id, client_tx_id)`

**Risks Identified:**
1. ⚠️ **DELETE POLICY EXISTS BUT SHOULDN'T BE USED**
   - App uses soft-delete (syncEngine.pushDelete updates `deleted_at`)
   - Hard DELETE policy exists from 0001_final.sql (before offline-first migration)
   - If client accidentally calls DELETE instead of UPDATE, data is lost (no recovery)
   - Breaks sync: hard-deleted rows can't be synced to other devices

2. ⚠️ **SELECT POLICY MAY RETURN SOFT-DELETED ROWS**
   - Current policy: `auth.uid() = user_id` (no filter on deleted_at)
   - Sync needs soft-deleted rows (to propagate deletions)
   - But app UI should filter `WHERE deleted_at IS NULL` at application layer
   - Policy is correct for sync, but could be confusing

**Required Changes:**
1. **REMOVE** `orders_delete_own` policy to prevent hard deletes from client
2. Add comment documenting that DELETE is blocked, soft-delete via UPDATE only
3. Keep SELECT policy as-is (returns all rows including soft-deleted for sync)

**Rationale:**
- Safety: prevent accidental data loss from hard DELETE
- Sync correctness: ensure soft-delete pattern is enforced at DB level
- Clarity: explicit policy documents delete strategy

---

### 3. expenses

**Purpose:** User expense records

**RLS Status:** ✅ ENABLED

**Current Policies:**
```sql
-- Source: 0004_offline_first.sql lines 150-201 (same as orders)
expenses_select_own (SELECT)
  TO authenticated
  USING (auth.uid() = user_id)

expenses_insert_own (INSERT)
  TO authenticated
  WITH CHECK (auth.uid() = user_id)

expenses_update_own (UPDATE)
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)

expenses_delete_own (DELETE)
  TO authenticated
  USING (auth.uid() = user_id)
```

**Current Schema (Ownership/Sync Columns):**
- ✅ `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- ✅ `updated_at timestamptz NOT NULL DEFAULT now()`
- ✅ `deleted_at timestamptz` (nullable, for soft-delete)
- ✅ `client_tx_id uuid NOT NULL DEFAULT gen_random_uuid()` (sync key)
- ✅ Trigger: `expenses_set_updated_at` exists
- ✅ Unique constraint: `expenses_user_client_tx_unique (user_id, client_tx_id)`

**Risks Identified:**
- Same as `orders` table (see above)

**Required Changes:**
- Same as `orders` table: REMOVE DELETE policy, document soft-delete strategy

---

### 4. strategic_spots

**Purpose:** Public/shared strategic location data (seed data, read-only for users)

**RLS Status:** ✅ ENABLED

**Current Policies:**
```sql
-- Source: 0002_add_places_fields.sql lines 126-151
spots_select_public (SELECT)
  TO anon, authenticated
  USING (true)

spots_service_role_all (ALL)
  TO service_role
  USING (true)
  WITH CHECK (true)

spots_block_user_write (ALL)
  TO authenticated
  USING (false)
  WITH CHECK (false)
```

**Current Schema (Ownership/Sync Columns):**
- ❌ `user_id` - NOT PRESENT (public data, no per-user ownership)
- ✅ `updated_at timestamptz NOT NULL DEFAULT now()`
- ❌ `deleted_at` - NOT NEEDED (managed by admin/service role)
- ✅ Trigger: `strategic_spots_set_updated_at` exists

**Risks Identified:**
1. ⚠️ **POLICY CONFLICT/CONFUSION**
   - `spots_block_user_write` has `FOR ALL` which includes SELECT
   - But `spots_select_public` has `FOR SELECT`
   - PostgreSQL evaluates policies with OR logic within same command
   - For SELECT: `spots_select_public` (true) OR `spots_block_user_write` (false) = true ✅
   - For INSERT/UPDATE/DELETE: only `spots_block_user_write` (false) applies = blocked ✅
   - **Result is correct, but confusing to read**

2. ℹ️ **ANON ACCESS IS INTENTIONAL**
   - Allows map to show strategic spots before user logs in
   - Read-only access is safe for public seed data
   - No user-generated content in this table

**Required Changes:**
1. **SIMPLIFY POLICIES** for clarity:
   - Keep `spots_select_public` for SELECT to anon/authenticated
   - **REMOVE** `spots_block_user_write` (redundant - no INSERT/UPDATE/DELETE policy = blocked)
   - Keep `spots_service_role_all` for admin/script access
   - Result: explicit allow for SELECT, implicit deny for writes (clearer)

**Rationale:**
- Clarity: explicit SELECT policy, implicit deny for writes is PostgreSQL standard pattern
- Simplicity: fewer policies = easier to audit
- Safety: no change in behavior, just clearer intent

---

## Heatmap-Related Tables

**Search Results:** No additional heatmap tables found (heatmap_cells, heatmap_events, etc.)

**Conclusion:** Only `strategic_spots` exists as heatmap-related table. Already covered above.

---

## Summary of Risks

### High Priority (Security/Data Loss)
1. ❌ **Hard DELETE policies on orders/expenses** - Can cause data loss, breaks sync
2. ⚠️ **Missing deleted_at on profiles** - Inconsistent sync pattern

### Medium Priority (Clarity/Maintainability)
3. ⚠️ **Confusing strategic_spots policies** - Works correctly but hard to understand
4. ℹ️ **No explicit documentation of soft-delete strategy** - Should be in migration comments

### Low Priority (Best Practice)
5. ℹ️ **No verification that user_id defaults work correctly** - Should test in QA

---

## Required Changes Summary

### Migration 0005_rls_hardening.sql will:

1. **profiles table:**
   - Add `deleted_at timestamptz` column
   - Document that no DELETE policy = soft-delete only

2. **orders table:**
   - DROP `orders_delete_own` policy (block hard DELETE)
   - Keep SELECT/INSERT/UPDATE policies as-is

3. **expenses table:**
   - DROP `expenses_delete_own` policy (block hard DELETE)
   - Keep SELECT/INSERT/UPDATE policies as-is

4. **strategic_spots table:**
   - DROP `spots_block_user_write` policy (simplify)
   - Keep `spots_select_public` and `spots_service_role_all`
   - Result: explicit SELECT allow, implicit write deny

5. **Documentation:**
   - Add SQL comments explaining soft-delete strategy
   - Add comments on why DELETE policies are absent

### No changes needed for:
- ✅ Existing `updated_at` triggers (all working)
- ✅ `user_id` columns (all present where needed)
- ✅ Unique constraints for sync (user_id, client_tx_id)
- ✅ RLS enabled status (all tables enabled)

---

## Verification Queries

After applying migration, run these to verify:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'orders', 'expenses', 'strategic_spots');

-- Check policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check sync columns exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'orders', 'expenses')
  AND column_name IN ('user_id', 'id', 'updated_at', 'deleted_at', 'client_tx_id')
ORDER BY table_name, column_name;

-- Check triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;
```

---

## Appendix: Delete Strategy Decision

**Chosen Strategy:** Soft-delete only (Option A)

**Evidence:**
- `syncEngine.js` line 356-406: `pushDelete` uses `UPDATE` to set `deleted_at`
- `offlineOps.js` line 109-133, 214-238: `deleteOrder`/`deleteExpense` call `softDeleteCached*`
- Migration 0004_offline_first.sql added `deleted_at` columns specifically for soft-delete

**Implementation:**
- Remove hard DELETE policies from orders/expenses
- Ensure UPDATE policies allow setting `deleted_at`
- SELECT policies return soft-deleted rows (needed for sync)
- Application layer filters `WHERE deleted_at IS NULL` for UI

**Rationale:**
- Offline-first apps need tombstones to propagate deletions across devices
- Hard delete would break sync (no way to know row was deleted)
- Soft delete allows "undo" and audit trail
- Consistent with existing codebase implementation

---

**Audit Completed By:** RLS Security Review Process  
**Next Steps:** Implement migration 0005_rls_hardening.sql per this audit's recommendations
