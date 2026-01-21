# RLS QA Checklist

**Migration:** 0005_rls_hardening.sql  
**Date:** 2026-01-21  
**Test Environment:** Staging/Local Supabase

---

## Pre-Migration Verification

Run these queries BEFORE applying the migration to capture baseline state:

```sql
-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'orders', 'expenses', 'strategic_spots')
ORDER BY tablename;

-- Expected: All should have rowsecurity = true

-- 2. Check current policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Note which DELETE policies exist (should see orders_delete_own, expenses_delete_own)

-- 3. Check deleted_at column exists
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'orders', 'expenses')
  AND column_name = 'deleted_at'
ORDER BY table_name;

-- Note: profiles should NOT have deleted_at before migration
```

---

## Migration Application

### ✅ Apply Migration

```bash
# Using Supabase CLI
supabase db push

# OR using SQL directly in Supabase Studio
# Copy and paste 0005_rls_hardening.sql into SQL Editor
# Run the migration
```

### ✅ Check for Errors

- [ ] Migration completed without errors
- [ ] All tables altered successfully
- [ ] All policies created/dropped successfully

### ✅ Verify Migration Success

```sql
-- 1. Verify RLS still enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'orders', 'expenses', 'strategic_spots')
ORDER BY tablename;

-- Expected: All should still have rowsecurity = true

-- 2. Verify policies after migration
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Expected for user-owned tables (profiles, orders, expenses):
--   - SELECT policy: *_select_own
--   - INSERT policy: *_insert_own  
--   - UPDATE policy: *_update_own
--   - DELETE policy: NONE (removed)
--
-- Expected for strategic_spots:
--   - SELECT policy: spots_select_public (to anon, authenticated)
--   - ALL policy: spots_service_role_all (to service_role)
--   - No other policies

-- 3. Verify deleted_at column added to profiles
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'deleted_at';

-- Expected: 1 row, data_type = 'timestamp with time zone', is_nullable = 'YES'

-- 4. Verify all sync columns present
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'orders', 'expenses')
  AND column_name IN ('updated_at', 'deleted_at')
ORDER BY table_name, column_name;

-- Expected: 
--   profiles: updated_at, deleted_at
--   orders: updated_at, deleted_at
--   expenses: updated_at, deleted_at

-- 5. Verify updated_at triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- Expected: Triggers for profiles, orders, expenses, strategic_spots
```

---

## Manual Two-User Testing

### Setup

Create two test users in Supabase Auth:
- **User A:** test-user-a@example.com
- **User B:** test-user-b@example.com

Get their auth tokens and UUIDs for testing.

### Test 1: Profiles Table

#### As User A:
```sql
-- Set session to User A
SET request.jwt.claims = '{"sub": "USER_A_UUID"}';

-- 1.1. Insert own profile
INSERT INTO profiles (id, full_name, daily_target)
VALUES ('USER_A_UUID', 'Test User A', 100000)
ON CONFLICT (id) DO UPDATE SET full_name = 'Test User A';
-- Expected: Success

-- 1.2. Select own profile
SELECT id, full_name, daily_target, deleted_at FROM profiles WHERE id = 'USER_A_UUID';
-- Expected: Returns 1 row (User A's profile)

-- 1.3. Update own profile
UPDATE profiles SET daily_target = 150000 WHERE id = 'USER_A_UUID';
-- Expected: Success

-- 1.4. Attempt to select User B's profile
SELECT id, full_name FROM profiles WHERE id = 'USER_B_UUID';
-- Expected: Returns 0 rows (cannot see User B's data)

-- 1.5. Attempt to update User B's profile
UPDATE profiles SET daily_target = 999999 WHERE id = 'USER_B_UUID';
-- Expected: 0 rows affected (RLS blocks)

-- 1.6. Attempt to soft-delete own profile
UPDATE profiles SET deleted_at = now() WHERE id = 'USER_A_UUID';
-- Expected: Success (soft-delete allowed)

-- 1.7. Attempt hard DELETE on own profile
DELETE FROM profiles WHERE id = 'USER_A_UUID';
-- Expected: Permission denied (no DELETE policy)
```

- [ ] 1.1 Insert own profile: Success
- [ ] 1.2 Select own profile: Returns data
- [ ] 1.3 Update own profile: Success
- [ ] 1.4 Select User B's profile: Returns 0 rows
- [ ] 1.5 Update User B's profile: 0 rows affected
- [ ] 1.6 Soft-delete own profile: Success
- [ ] 1.7 Hard DELETE own profile: Permission denied

#### As User B:
```sql
-- Set session to User B
SET request.jwt.claims = '{"sub": "USER_B_UUID"}';

-- 1.8. Attempt to select User A's profile
SELECT id, full_name FROM profiles WHERE id = 'USER_A_UUID';
-- Expected: Returns 0 rows (cannot see User A's data)

-- 1.9. Attempt to update User A's profile  
UPDATE profiles SET daily_target = 999999 WHERE id = 'USER_A_UUID';
-- Expected: 0 rows affected (RLS blocks)
```

- [ ] 1.8 User B cannot select User A's profile
- [ ] 1.9 User B cannot update User A's profile

### Test 2: Orders Table

#### As User A:
```sql
-- 2.1. Insert own order
INSERT INTO orders (user_id, gross_price, commission_rate, client_tx_id)
VALUES ('USER_A_UUID', 50000, 0.10, gen_random_uuid())
RETURNING id, client_tx_id;
-- Expected: Success, returns id and client_tx_id

-- 2.2. Select own orders
SELECT id, user_id, gross_price, deleted_at FROM orders WHERE user_id = 'USER_A_UUID';
-- Expected: Returns User A's orders

-- 2.3. Update own order
UPDATE orders SET gross_price = 60000 WHERE user_id = 'USER_A_UUID' AND id = <order_id_from_2.1>;
-- Expected: Success

-- 2.4. Soft-delete own order
UPDATE orders SET deleted_at = now() WHERE user_id = 'USER_A_UUID' AND id = <order_id_from_2.1>;
-- Expected: Success

-- 2.5. Verify soft-deleted order still returned by SELECT (for sync)
SELECT id, deleted_at FROM orders WHERE user_id = 'USER_A_UUID' AND id = <order_id_from_2.1>;
-- Expected: Returns 1 row with deleted_at populated

-- 2.6. Attempt hard DELETE on own order
DELETE FROM orders WHERE user_id = 'USER_A_UUID' AND id = <order_id_from_2.1>;
-- Expected: Permission denied (no DELETE policy)

-- 2.7. Insert order for User B (malicious attempt)
INSERT INTO orders (user_id, gross_price, commission_rate, client_tx_id)
VALUES ('USER_B_UUID', 99999, 0.10, gen_random_uuid());
-- Expected: RLS violation (WITH CHECK fails)

-- 2.8. Select User B's orders
SELECT id FROM orders WHERE user_id = 'USER_B_UUID';
-- Expected: Returns 0 rows (cannot see User B's data)
```

- [ ] 2.1 Insert own order: Success
- [ ] 2.2 Select own orders: Returns data
- [ ] 2.3 Update own order: Success
- [ ] 2.4 Soft-delete own order: Success
- [ ] 2.5 Soft-deleted order visible in SELECT: Yes (for sync)
- [ ] 2.6 Hard DELETE own order: Permission denied
- [ ] 2.7 Insert order for User B: RLS violation
- [ ] 2.8 Select User B's orders: Returns 0 rows

### Test 3: Expenses Table

#### As User A:
```sql
-- 3.1. Insert own expense
INSERT INTO expenses (user_id, amount, category, client_tx_id)
VALUES ('USER_A_UUID', 15000, 'fuel', gen_random_uuid())
RETURNING id, client_tx_id;
-- Expected: Success

-- 3.2. Select own expenses
SELECT id, user_id, amount, category, deleted_at FROM expenses WHERE user_id = 'USER_A_UUID';
-- Expected: Returns User A's expenses

-- 3.3. Update own expense
UPDATE expenses SET amount = 18000 WHERE user_id = 'USER_A_UUID' AND id = <expense_id_from_3.1>;
-- Expected: Success

-- 3.4. Soft-delete own expense
UPDATE expenses SET deleted_at = now() WHERE user_id = 'USER_A_UUID' AND id = <expense_id_from_3.1>;
-- Expected: Success

-- 3.5. Attempt hard DELETE on own expense
DELETE FROM expenses WHERE user_id = 'USER_A_UUID' AND id = <expense_id_from_3.1>;
-- Expected: Permission denied (no DELETE policy)

-- 3.6. Select User B's expenses
SELECT id FROM expenses WHERE user_id = 'USER_B_UUID';
-- Expected: Returns 0 rows
```

- [ ] 3.1 Insert own expense: Success
- [ ] 3.2 Select own expenses: Returns data
- [ ] 3.3 Update own expense: Success
- [ ] 3.4 Soft-delete own expense: Success
- [ ] 3.5 Hard DELETE own expense: Permission denied
- [ ] 3.6 Select User B's expenses: Returns 0 rows

### Test 4: Strategic Spots Table

#### As Anonymous User:
```sql
-- Use anon key (no auth)

-- 4.1. Select strategic spots
SELECT id, name, category, latitude, longitude FROM strategic_spots LIMIT 5;
-- Expected: Success, returns public seed data

-- 4.2. Attempt to insert strategic spot
INSERT INTO strategic_spots (name, category, start_hour, end_hour, latitude, longitude)
VALUES ('Test Spot', 'test', 8, 12, -6.900, 107.600);
-- Expected: Permission denied (no INSERT policy for anon)

-- 4.3. Attempt to update strategic spot
UPDATE strategic_spots SET name = 'Hacked' WHERE id = 1;
-- Expected: Permission denied (no UPDATE policy for anon)

-- 4.4. Attempt to delete strategic spot
DELETE FROM strategic_spots WHERE id = 1;
-- Expected: Permission denied (no DELETE policy for anon)
```

- [ ] 4.1 Anon can SELECT: Success
- [ ] 4.2 Anon cannot INSERT: Permission denied
- [ ] 4.3 Anon cannot UPDATE: Permission denied
- [ ] 4.4 Anon cannot DELETE: Permission denied

#### As Authenticated User:
```sql
-- Set session to User A
SET request.jwt.claims = '{"sub": "USER_A_UUID"}';

-- 4.5. Select strategic spots
SELECT id, name FROM strategic_spots LIMIT 5;
-- Expected: Success

-- 4.6. Attempt to insert strategic spot
INSERT INTO strategic_spots (name, category, start_hour, end_hour, latitude, longitude)
VALUES ('Test Spot', 'test', 8, 12, -6.900, 107.600);
-- Expected: Permission denied (no INSERT policy for authenticated)

-- 4.7. Attempt to update strategic spot
UPDATE strategic_spots SET name = 'Hacked' WHERE id = 1;
-- Expected: Permission denied (no UPDATE policy for authenticated)
```

- [ ] 4.5 Authenticated can SELECT: Success
- [ ] 4.6 Authenticated cannot INSERT: Permission denied
- [ ] 4.7 Authenticated cannot UPDATE: Permission denied

---

## Sync-Related Testing

### Test 5: Pull Sync (Server → Local)

#### Setup:
1. Ensure User A has some orders and expenses on server
2. Note the `updated_at` timestamps

#### Test Pull Query:
```javascript
// Simulate pull sync query in app code
const { data: orders, error: ordersError } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', 'USER_A_UUID')
  .gt('updated_at', '2020-01-01T00:00:00.000Z')
  .order('updated_at', { ascending: true });

// Expected: Returns User A's orders, including soft-deleted ones (deleted_at != null)
```

- [ ] Pull query works without RLS errors
- [ ] Returns all orders (including soft-deleted)
- [ ] Only returns User A's orders (not User B's)

### Test 6: Push Sync (Local → Server)

#### Test Upsert:
```javascript
// Simulate push upsert in app code
const { data, error } = await supabase
  .from('orders')
  .upsert({
    user_id: 'USER_A_UUID',
    client_tx_id: 'test-client-tx-id-123',
    gross_price: 75000,
    commission_rate: 0.10,
    app_fee: 7500,
    net_profit: 67500,
    distance: 10,
    fuel_efficiency_at_time: 5000,
    fuel_cost: 5000,
    maintenance_fee: 0,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,client_tx_id',
  })
  .select()
  .single();

// Expected: Success, returns upserted row
```

- [ ] Upsert works without RLS errors
- [ ] Returns upserted row with server-assigned id

#### Test Soft-Delete Push:
```javascript
// Simulate push delete (soft-delete) in app code
const { error } = await supabase
  .from('orders')
  .update({
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', 'USER_A_UUID')
  .eq('client_tx_id', 'test-client-tx-id-123');

// Expected: Success, marks order as deleted
```

- [ ] Soft-delete push works without RLS errors
- [ ] Row remains in table with deleted_at set

### Test 7: Resurrection Prevention

#### Setup:
1. User A soft-deletes an order locally (sets deleted_at)
2. Simulate server has old non-deleted version

#### Test:
```javascript
// 7.1. User A soft-deletes order
await supabase
  .from('orders')
  .update({ deleted_at: new Date().toISOString() })
  .eq('user_id', 'USER_A_UUID')
  .eq('client_tx_id', 'test-resurrection-123');

// 7.2. Verify soft-deleted
const { data: deleted } = await supabase
  .from('orders')
  .select('deleted_at')
  .eq('user_id', 'USER_A_UUID')
  .eq('client_tx_id', 'test-resurrection-123')
  .single();

// Expected: deleted_at is not null

// 7.3. Pull sync should NOT resurrect (app logic handles this)
// Note: RLS allows SELECT of deleted rows, but app syncEngine prevents resurrection
// See: syncEngine.js applyRecordToCache() lines 518-538
```

- [ ] Order is soft-deleted (deleted_at set)
- [ ] Soft-deleted order remains deleted after sync
- [ ] No resurrection occurs

---

## Common Error Scenarios

### Test 8: RLS Denial Errors

#### Test RLS Denial on Cross-User Access:
```sql
-- As User A, try to update User B's order
UPDATE orders SET gross_price = 1 WHERE user_id = 'USER_B_UUID';
-- Expected: 0 rows affected (silent failure, correct)

-- As User A, try to insert order for User B
INSERT INTO orders (user_id, gross_price, commission_rate, client_tx_id)
VALUES ('USER_B_UUID', 1000, 0.10, gen_random_uuid());
-- Expected: ERROR - new row violates row-level security policy
```

- [ ] Cross-user UPDATE: Silent failure (0 rows)
- [ ] Cross-user INSERT: RLS violation error

### Test 9: Hard DELETE Blocked

```sql
-- As User A, attempt hard DELETE
DELETE FROM orders WHERE user_id = 'USER_A_UUID';
-- Expected: ERROR - permission denied for table orders
```

- [ ] Hard DELETE blocked with permission denied error

---

## Final Verification Checklist

- [ ] All pre-migration queries captured
- [ ] Migration applied successfully
- [ ] Post-migration verification queries show expected state
- [ ] User A can CRUD own data in all tables
- [ ] User A cannot access User B's data in any table
- [ ] User B cannot access User A's data in any table
- [ ] Anonymous users can read strategic_spots
- [ ] Anonymous users cannot write to any table
- [ ] Authenticated users cannot write to strategic_spots
- [ ] Hard DELETE is blocked on all user-owned tables
- [ ] Soft-delete (UPDATE deleted_at) works on all user-owned tables
- [ ] Pull sync works without RLS errors
- [ ] Push upsert works without RLS errors
- [ ] Push soft-delete works without RLS errors
- [ ] Soft-deleted rows do not resurrect after sync

---

## Rollback Plan

If critical issues found during QA, rollback by:

```sql
-- Restore DELETE policies (if needed to unblock app)
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

-- Note: deleted_at column on profiles can remain (backwards compatible)
-- Note: strategic_spots policy changes are safe (read-only behavior unchanged)
```

---

## Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Environment:** ☐ Local  ☐ Staging  ☐ Production  
**Status:** ☐ PASS  ☐ FAIL  ☐ PARTIAL

**Notes:**
