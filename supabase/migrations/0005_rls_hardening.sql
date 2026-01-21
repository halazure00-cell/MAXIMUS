-- ============================================================
-- 0005_rls_hardening.sql
-- RLS Security Hardening for Offline-First Sync
-- ============================================================
-- Purpose: Harden Row Level Security policies for production use
--          Enforce soft-delete strategy and prevent data loss
-- 
-- Changes:
--   1. Add deleted_at to profiles (consistency with other user tables)
--   2. Remove hard DELETE policies from orders/expenses (enforce soft-delete)
--   3. Simplify strategic_spots policies (clarity)
--   4. Add documentation comments for delete strategy
--
-- Delete Strategy: SOFT-DELETE ONLY (Option A)
--   - Client uses UPDATE to set deleted_at (not hard DELETE)
--   - Tombstones preserved for sync across devices
--   - Hard DELETE blocked at policy level
--   - See: src/lib/syncEngine.js pushDelete() and offlineOps.js
-- ============================================================

begin;

-- ============================================================
-- 1. PROFILES: Add deleted_at for consistency
-- ============================================================

-- Add deleted_at column if not exists
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='profiles' and column_name='deleted_at'
  ) then
    alter table public.profiles add column deleted_at timestamptz;
    raise notice 'Added deleted_at column to profiles table';
  else
    raise notice 'Column deleted_at already exists on profiles table';
  end if;
end $$;

-- Profiles policies are already correct (no DELETE policy exists)
-- Verify they still exist and recreate if needed for safety

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- NOTE: No DELETE policy for profiles
-- Soft-delete only: client updates deleted_at instead of hard DELETE
-- Hard DELETE is blocked (policy absence = deny)

comment on column public.profiles.deleted_at is 
  'Soft-delete timestamp. Client updates this instead of hard DELETE. NULL = active profile.';

-- ============================================================
-- 2. ORDERS: Remove hard DELETE policy (enforce soft-delete)
-- ============================================================

-- Keep existing SELECT policy (returns all rows including soft-deleted for sync)
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Keep existing INSERT policy
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Keep existing UPDATE policy (allows setting deleted_at for soft-delete)
drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own"
  on public.orders
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- REMOVE hard DELETE policy
-- This enforces soft-delete strategy at database level
drop policy if exists "orders_delete_own" on public.orders;

-- NOTE: No DELETE policy for orders
-- DELETE STRATEGY: Soft-delete only
--   - Client calls UPDATE to set deleted_at (see: offlineOps.deleteOrder)
--   - syncEngine.pushDelete sends UPDATE, not DELETE (see: syncEngine.js line 390)
--   - Hard DELETE is blocked to prevent data loss and sync breakage
--   - Tombstones (deleted_at != null) are preserved for multi-device sync

comment on column public.orders.deleted_at is 
  'Soft-delete timestamp. Set via UPDATE, never hard DELETE. Tombstone preserved for sync.';

-- ============================================================
-- 3. EXPENSES: Remove hard DELETE policy (enforce soft-delete)
-- ============================================================

-- Keep existing SELECT policy
drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
  on public.expenses
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Keep existing INSERT policy
drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
  on public.expenses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Keep existing UPDATE policy (allows setting deleted_at for soft-delete)
drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own"
  on public.expenses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- REMOVE hard DELETE policy
drop policy if exists "expenses_delete_own" on public.expenses;

-- NOTE: No DELETE policy for expenses (same soft-delete strategy as orders)

comment on column public.expenses.deleted_at is 
  'Soft-delete timestamp. Set via UPDATE, never hard DELETE. Tombstone preserved for sync.';

-- ============================================================
-- 4. STRATEGIC_SPOTS: Simplify policies for clarity
-- ============================================================

-- Keep public SELECT policy (allows anon and authenticated to read)
drop policy if exists "spots_select_public" on public.strategic_spots;
create policy "spots_select_public"
  on public.strategic_spots
  for select
  to anon, authenticated
  using (true);

-- Keep service role policy (allows admin/script access for seed data management)
drop policy if exists "spots_service_role_all" on public.strategic_spots;
create policy "spots_service_role_all"
  on public.strategic_spots
  for all
  to service_role
  using (true)
  with check (true);

-- REMOVE confusing block policy
-- It was redundant: absence of INSERT/UPDATE/DELETE policies already blocks writes
drop policy if exists "spots_block_user_write" on public.strategic_spots;

-- NOTE: No INSERT/UPDATE/DELETE policies for authenticated users
-- WRITE ACCESS: Service role only (admin/seed scripts)
--   - Public read access (anon + authenticated) via SELECT policy
--   - Write access blocked for users (no policy = implicit deny)
--   - Only service_role can INSERT/UPDATE/DELETE (for seed data management)

comment on table public.strategic_spots is 
  'Public strategic location seed data. Read-only for users, writable by service role only.';

-- ============================================================
-- 5. Verification: Ensure RLS is enabled on all tables
-- ============================================================

-- Re-enable RLS on all tables (idempotent, safe to re-run)
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.expenses enable row level security;
alter table public.strategic_spots enable row level security;

-- ============================================================
-- 6. Verification Queries (commented out, for manual testing)
-- ============================================================

-- Uncomment to verify after migration:

-- Check RLS enabled:
-- select schemaname, tablename, rowsecurity 
-- from pg_tables 
-- where schemaname = 'public' 
--   and tablename in ('profiles', 'orders', 'expenses', 'strategic_spots');

-- Check policies (should see SELECT/INSERT/UPDATE only for user tables):
-- select tablename, policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, cmd, policyname;

-- Check deleted_at columns exist:
-- select table_name, column_name, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and column_name = 'deleted_at'
-- order by table_name;

commit;

-- ============================================================
-- Migration Complete
-- ============================================================
-- Summary:
--   - profiles: added deleted_at, policies unchanged (already correct)
--   - orders: removed DELETE policy, enforces soft-delete
--   - expenses: removed DELETE policy, enforces soft-delete
--   - strategic_spots: simplified policies, behavior unchanged
--   - All tables have RLS enabled
--   - Soft-delete strategy enforced at database level
-- 
-- QA Required:
--   1. Two-user test (A cannot see/modify B's data)
--   2. Soft-delete test (UPDATE deleted_at works, hard DELETE fails)
--   3. Sync test (pull/push works without RLS errors)
--   4. Strategic spots read test (anon can read, cannot write)
--
-- See: docs/RLS_QA_CHECKLIST.md for detailed test plan
-- ============================================================
