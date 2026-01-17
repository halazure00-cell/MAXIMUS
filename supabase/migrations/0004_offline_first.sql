-- ============================================================
-- 0004_offline_first.sql
-- Offline-First Schema Update
-- Adds client_tx_id, updated_at, deleted_at for sync support
-- ============================================================

begin;

-- 1) Add columns to orders table
do $$ 
begin
  -- client_tx_id: stable client-generated UUID for sync
  -- Start as nullable, we'll backfill and add NOT NULL later
  if not exists (
    select 1 from information_schema.columns 
    where table_name='orders' and column_name='client_tx_id'
  ) then
    alter table public.orders add column client_tx_id uuid;
    
    -- Backfill existing rows with generated UUIDs
    update public.orders set client_tx_id = gen_random_uuid() where client_tx_id is null;
    
    -- Now make it NOT NULL with default for new rows
    alter table public.orders alter column client_tx_id set not null;
    alter table public.orders alter column client_tx_id set default gen_random_uuid();
  end if;

  -- updated_at: for incremental pull sync
  if not exists (
    select 1 from information_schema.columns 
    where table_name='orders' and column_name='updated_at'
  ) then
    alter table public.orders add column updated_at timestamptz;
    
    -- Backfill with created_at or now()
    update public.orders set updated_at = coalesce(created_at, now()) where updated_at is null;
    
    -- Now make it NOT NULL with default
    alter table public.orders alter column updated_at set not null;
    alter table public.orders alter column updated_at set default now();
  end if;

  -- deleted_at: soft delete for sync
  if not exists (
    select 1 from information_schema.columns 
    where table_name='orders' and column_name='deleted_at'
  ) then
    alter table public.orders add column deleted_at timestamptz;
  end if;
end $$;

-- 2) Add columns to expenses table
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='expenses' and column_name='client_tx_id'
  ) then
    alter table public.expenses add column client_tx_id uuid;
    update public.expenses set client_tx_id = gen_random_uuid() where client_tx_id is null;
    alter table public.expenses alter column client_tx_id set not null;
    alter table public.expenses alter column client_tx_id set default gen_random_uuid();
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_name='expenses' and column_name='updated_at'
  ) then
    alter table public.expenses add column updated_at timestamptz;
    update public.expenses set updated_at = coalesce(created_at, now()) where updated_at is null;
    alter table public.expenses alter column updated_at set not null;
    alter table public.expenses alter column updated_at set default now();
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_name='expenses' and column_name='deleted_at'
  ) then
    alter table public.expenses add column deleted_at timestamptz;
  end if;
end $$;

-- 3) Add unique constraints for (user_id, client_tx_id)
-- This ensures client-side generated IDs are unique per user
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'orders_user_client_tx_unique'
  ) then
    alter table public.orders 
      add constraint orders_user_client_tx_unique 
      unique (user_id, client_tx_id);
  end if;

  if not exists (
    select 1 from pg_constraint 
    where conname = 'expenses_user_client_tx_unique'
  ) then
    alter table public.expenses 
      add constraint expenses_user_client_tx_unique 
      unique (user_id, client_tx_id);
  end if;
end $$;

-- 4) Add indexes for performance
-- For pull sync: filter by user and updated_at
create index if not exists idx_orders_user_updated_at 
  on public.orders (user_id, updated_at desc);

create index if not exists idx_expenses_user_updated_at 
  on public.expenses (user_id, updated_at desc);

-- For filtering out soft-deleted records
create index if not exists idx_orders_user_deleted_at 
  on public.orders (user_id, deleted_at);

create index if not exists idx_expenses_user_deleted_at 
  on public.expenses (user_id, deleted_at);

-- For upsert operations by client_tx_id
create index if not exists idx_orders_client_tx_id 
  on public.orders (client_tx_id);

create index if not exists idx_expenses_client_tx_id 
  on public.expenses (client_tx_id);

-- 5) Trigger for auto-updating updated_at
-- Reuse existing set_updated_at() function
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- 6) Update RLS policies to support soft delete
-- Users can update their own records (including setting deleted_at)
drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own"
  on public.orders
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own"
  on public.expenses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Select policies already exist, but ensure they're present
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
  on public.expenses
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Insert policies
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
  on public.expenses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Delete policy (for hard delete if needed, though we prefer soft delete)
drop policy if exists "orders_delete_own" on public.orders;
create policy "orders_delete_own"
  on public.orders
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
  on public.expenses
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
