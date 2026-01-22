-- ============================================================
-- 0007_performance_fixes.sql
-- RLS Performance Optimization: Fix N+1 Query Issues
-- ============================================================
-- Purpose: Optimize Row Level Security policies to prevent N+1 queries
--          by using (select auth.uid()) instead of auth.uid()
-- 
-- Background:
--   The auth.uid() function can cause N+1 query performance issues
--   when used directly in RLS policies. Wrapping it in a subquery
--   (select auth.uid()) forces PostgreSQL to evaluate it once per
--   statement instead of once per row, significantly improving performance.
--
-- Safety:
--   - Uses DROP POLICY IF EXISTS for idempotency
--   - No tables, columns, or critical indexes modified
--   - Only updates RLS policy definitions
--   - Protected: idx_orders_client_tx_id and idx_expenses_client_tx_id
--     are NOT touched (critical for SyncEngine)
--
-- Changes:
--   1. Optimize profiles RLS policies (3 policies)
--   2. Optimize orders RLS policies (3 policies: SELECT, INSERT, UPDATE)
--   3. Optimize expenses RLS policies (3 policies: SELECT, INSERT, UPDATE)
--
-- Note: DELETE policies are NOT recreated (soft-delete strategy enforced)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PROFILES: Optimize RLS Policies
-- ============================================================

-- profiles_select_own: Optimize SELECT policy
DROP POLICY IF EXISTS "profiles_select_own" ON "public"."profiles";
CREATE POLICY "profiles_select_own" ON "public"."profiles"
FOR SELECT TO authenticated
USING ( (SELECT auth.uid()) = id );

-- profiles_insert_own: Optimize INSERT policy
DROP POLICY IF EXISTS "profiles_insert_own" ON "public"."profiles";
CREATE POLICY "profiles_insert_own" ON "public"."profiles"
FOR INSERT TO authenticated
WITH CHECK ( (SELECT auth.uid()) = id );

-- profiles_update_own: Optimize UPDATE policy
DROP POLICY IF EXISTS "profiles_update_own" ON "public"."profiles";
CREATE POLICY "profiles_update_own" ON "public"."profiles"
FOR UPDATE TO authenticated
USING ( (SELECT auth.uid()) = id )
WITH CHECK ( (SELECT auth.uid()) = id );

-- NOTE: No DELETE policy for profiles (soft-delete only via deleted_at)

-- ============================================================
-- 2. ORDERS: Optimize RLS Policies
-- ============================================================

-- orders_select_own: Optimize SELECT policy
DROP POLICY IF EXISTS "orders_select_own" ON "public"."orders";
CREATE POLICY "orders_select_own" ON "public"."orders"
FOR SELECT TO authenticated
USING ( (SELECT auth.uid()) = user_id );

-- orders_insert_own: Optimize INSERT policy
DROP POLICY IF EXISTS "orders_insert_own" ON "public"."orders";
CREATE POLICY "orders_insert_own" ON "public"."orders"
FOR INSERT TO authenticated
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- orders_update_own: Optimize UPDATE policy
DROP POLICY IF EXISTS "orders_update_own" ON "public"."orders";
CREATE POLICY "orders_update_own" ON "public"."orders"
FOR UPDATE TO authenticated
USING ( (SELECT auth.uid()) = user_id )
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- NOTE: No DELETE policy for orders
-- DELETE STRATEGY: Soft-delete only (enforced by 0005_rls_hardening.sql)
--   - Client updates deleted_at instead of hard DELETE
--   - Hard DELETE is blocked to prevent data loss and sync breakage
--   - See: 0005_rls_hardening.sql for full explanation
DROP POLICY IF EXISTS "orders_delete_own" ON "public"."orders";

-- ============================================================
-- 3. EXPENSES: Optimize RLS Policies
-- ============================================================

-- expenses_select_own: Optimize SELECT policy
DROP POLICY IF EXISTS "expenses_select_own" ON "public"."expenses";
CREATE POLICY "expenses_select_own" ON "public"."expenses"
FOR SELECT TO authenticated
USING ( (SELECT auth.uid()) = user_id );

-- expenses_insert_own: Optimize INSERT policy
DROP POLICY IF EXISTS "expenses_insert_own" ON "public"."expenses";
CREATE POLICY "expenses_insert_own" ON "public"."expenses"
FOR INSERT TO authenticated
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- expenses_update_own: Optimize UPDATE policy
DROP POLICY IF EXISTS "expenses_update_own" ON "public"."expenses";
CREATE POLICY "expenses_update_own" ON "public"."expenses"
FOR UPDATE TO authenticated
USING ( (SELECT auth.uid()) = user_id )
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- NOTE: No DELETE policy for expenses
-- DELETE STRATEGY: Soft-delete only (enforced by 0005_rls_hardening.sql)
--   - Client updates deleted_at instead of hard DELETE
--   - Hard DELETE is blocked to prevent data loss and sync breakage
--   - See: 0005_rls_hardening.sql for full explanation
DROP POLICY IF EXISTS "expenses_delete_own" ON "public"."expenses";

COMMIT;

-- ============================================================
-- Migration Complete
-- ============================================================
-- Summary:
--   - Optimized 9 RLS policies using (SELECT auth.uid()) syntax
--   - profiles: 3 policies (SELECT, INSERT, UPDATE)
--   - orders: 3 policies (SELECT, INSERT, UPDATE)
--   - expenses: 3 policies (SELECT, INSERT, UPDATE)
--   - DELETE policies removed (soft-delete strategy enforced)
--   - Migration is idempotent (safe to run multiple times)
--   - No data loss risk (only policy definitions changed)
--   - Critical indexes preserved (idx_orders_client_tx_id, idx_expenses_client_tx_id)
--
-- Performance Impact:
--   - Reduces N+1 query overhead in RLS policy evaluation
--   - auth.uid() evaluated once per statement instead of once per row
--   - Significant improvement for queries returning multiple rows
--
-- Verification:
--   Run after migration to verify policies are updated:
--   
--   SELECT schemaname, tablename, policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('profiles', 'orders', 'expenses')
--   ORDER BY tablename, cmd, policyname;
--
-- ============================================================
