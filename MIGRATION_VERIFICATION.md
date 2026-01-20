# Migration Verification Guide

## Purpose
This guide helps you verify that database migrations have been properly applied to your Supabase instance. If migrations are not applied, sync operations will fail with schema errors.

## Quick Check: Is Migration 0004 Applied?

Run this query in Supabase SQL Editor:

```sql
-- Check if required columns exist for sync
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('orders', 'expenses')
  AND column_name IN ('client_tx_id', 'updated_at', 'deleted_at')
ORDER BY table_name, column_name;
```

### Expected Result (6 rows):

| table_name | column_name   | data_type                   | is_nullable |
|-----------|---------------|----------------------------|-------------|
| expenses  | client_tx_id  | uuid                       | NO          |
| expenses  | deleted_at    | timestamp with time zone   | YES         |
| expenses  | updated_at    | timestamp with time zone   | NO          |
| orders    | client_tx_id  | uuid                       | NO          |
| orders    | deleted_at    | timestamp with time zone   | YES         |
| orders    | updated_at    | timestamp with time zone   | NO          |

✅ **If you see 6 rows like above:** Migration is applied correctly!

❌ **If you see fewer rows or no rows:** Migration not applied. See "Applying Migration" below.

---

## Verify Triggers

Check if auto-update triggers are present:

```sql
-- Check triggers for updated_at
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('orders_set_updated_at', 'expenses_set_updated_at')
ORDER BY event_object_table;
```

### Expected Result (2 rows):

| trigger_name             | event_object_table | action_statement                             |
|-------------------------|-------------------|---------------------------------------------|
| expenses_set_updated_at | expenses          | EXECUTE FUNCTION public.set_updated_at()    |
| orders_set_updated_at   | orders            | EXECUTE FUNCTION public.set_updated_at()    |

---

## Verify Indexes

Check if sync performance indexes exist:

```sql
-- Check indexes for sync queries
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'expenses')
  AND indexname LIKE '%updated_at%'
ORDER BY tablename, indexname;
```

### Expected Result (2 rows minimum):

You should see indexes like:
- `idx_orders_user_updated_at` on `orders(user_id, updated_at DESC)`
- `idx_expenses_user_updated_at` on `expenses(user_id, updated_at DESC)`

---

## Applying Migration (If Not Applied)

### Method 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open file: `supabase/migrations/0004_offline_first.sql`
6. Copy entire content and paste into SQL Editor
7. Click **Run** (green button)
8. Wait for "Success. No rows returned" message
9. Re-run verification queries above to confirm

### Method 2: Supabase CLI (Advanced)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project (you'll need your project ref and database password)
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

---

## Common Error Messages

### Error: "column orders.updated_at does not exist"

**Cause:** Migration 0004 not applied  
**Solution:** Apply migration using Method 1 or 2 above

### Error: "2 operasi gagal setelah 3x percobaan"

**Cause:** Sync retried 3 times on schema error  
**Solution:** 
1. Apply migration 0004
2. Update to latest app version (includes schema error detection)
3. Press "Sync sekarang" button in app

### Error: "Database schema error. Migration 0004_offline_first required."

**Cause:** Migration 0004 not applied (new error message from latest version)  
**Solution:** Apply migration using Method 1 or 2 above  
**Note:** This is an improved error message that prevents wasted retries

---

## Post-Migration Testing

After applying migration, test sync functionality:

1. **Create Test Order Offline**
   - Turn off network (Airplane mode or DevTools Network: Offline)
   - Create a new order in app
   - Order should appear in Riwayat immediately

2. **Sync When Online**
   - Turn network back on
   - Click "Sync sekarang" in app
   - Should show "Synced" status with green checkmark
   - Check Supabase: order should have `client_tx_id` and `updated_at`

3. **Verify No Failed Operations**
   - Sync status banner should NOT show "X operasi gagal"
   - If it does, check error message and apply fixes

---

## Rollback (Emergency Only)

⚠️ **WARNING:** Rolling back will break sync functionality. Only do this if absolutely necessary.

```sql
-- DANGER: This will remove sync columns and lose soft-delete data
BEGIN;

-- Remove triggers
DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
DROP TRIGGER IF EXISTS expenses_set_updated_at ON public.expenses;

-- Remove indexes
DROP INDEX IF EXISTS idx_orders_user_updated_at;
DROP INDEX IF EXISTS idx_orders_user_deleted_at;
DROP INDEX IF EXISTS idx_orders_client_tx_id;
DROP INDEX IF EXISTS idx_expenses_user_updated_at;
DROP INDEX IF EXISTS idx_expenses_user_deleted_at;
DROP INDEX IF EXISTS idx_expenses_client_tx_id;

-- Remove constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_client_tx_unique;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_user_client_tx_unique;

-- Remove columns (DATA LOSS for soft-deleted records)
ALTER TABLE orders DROP COLUMN IF EXISTS updated_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS client_tx_id CASCADE;

ALTER TABLE expenses DROP COLUMN IF EXISTS updated_at CASCADE;
ALTER TABLE expenses DROP COLUMN IF EXISTS deleted_at CASCADE;
ALTER TABLE expenses DROP COLUMN IF EXISTS client_tx_id CASCADE;

COMMIT;
```

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs → Database
2. Check browser console for errors: DevTools → Console
3. Verify you're on latest app version
4. Contact support with:
   - Error message from app
   - Results from verification queries
   - Browser and device info
