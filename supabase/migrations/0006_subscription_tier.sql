-- ============================================================
-- 0006_subscription_tier.sql
-- Adds subscription management for Manual Freemium Monetization
-- Adds subscription_tier and subscription_expiry to profiles table
-- ============================================================

begin;

-- 1) Add subscription columns to profiles table
do $$ 
begin
  -- subscription_tier: free or pro
  if not exists (
    select 1 from information_schema.columns 
    where table_name='profiles' and column_name='subscription_tier'
  ) then
    alter table public.profiles add column subscription_tier text not null default 'free';
    
    -- Add constraint to ensure only valid values
    alter table public.profiles 
      add constraint subscription_tier_check 
      check (subscription_tier in ('free', 'pro'));
  end if;

  -- subscription_expiry: when pro subscription expires (nullable)
  if not exists (
    select 1 from information_schema.columns 
    where table_name='profiles' and column_name='subscription_expiry'
  ) then
    alter table public.profiles add column subscription_expiry timestamptz;
  end if;
end $$;

-- 2) Update RLS policy for profiles SELECT to include subscription fields
-- Drop existing policy if it exists and recreate with subscription fields
drop policy if exists "Users can view their own profile" on public.profiles;

create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Ensure users can update their own profile (including subscription fields when needed)
-- This allows manual updates via SQL or admin tools
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

commit;
