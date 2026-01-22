-- ============================================================
-- 0006_subscription_tier_optimized.sql
-- Adds subscription management & Optimizes RLS immediately
-- ============================================================

begin;

-- 1) Add subscription columns to profiles table (Safe Check)
do $$ 
begin
  -- subscription_tier: free or pro
  if not exists (
    select 1 from information_schema.columns 
    where table_name='profiles' and column_name='subscription_tier'
  ) then
    alter table public.profiles add column subscription_tier text not null default 'free';
    
    -- Add constraint
    alter table public.profiles 
      add constraint subscription_tier_check 
      check (subscription_tier in ('free', 'pro'));
  end if;

  -- subscription_expiry
  if not exists (
    select 1 from information_schema.columns 
    where table_name='profiles' and column_name='subscription_expiry'
  ) then
    alter table public.profiles add column subscription_expiry timestamptz;
  end if;
end $$;

-- 2) RLS Policies: CLEANUP & OPTIMIZE
-- Drop BOTH potential names to avoid duplicates (Conflict Prevention)
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;

-- Create Unified Optimized Policy (Fast Syntax)
create policy "profiles_select_own"
  on public.profiles
  for select
  using ( (select auth.uid()) = id ); -- Optimized subquery

-- Update Policy: Cleanup & Optimize
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles
  for update
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

commit;
