-- filepath: supabase/migrations/0002_add_places_fields.sql
-- Purpose: Extend strategic_spots untuk mendukung Google Places geocoding
-- Safety: Kolom baru NULLABLE agar tidak break aplikasi yang sudah berjalan

begin;

-- 1) Tambah kolom place_id (jika belum ada)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='place_id'
  ) then
    alter table public.strategic_spots add column place_id text unique;
  end if;
end $$;

-- 2) Tambah kolom geocode_status (jika belum ada)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='geocode_status'
  ) then
    alter table public.strategic_spots 
      add column geocode_status text default 'PENDING' 
      check (geocode_status in ('PENDING','OK','NOT_FOUND','ERROR'));
  end if;
end $$;

-- 3) Tambah kolom geocode_error (jika belum ada)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='geocode_error'
  ) then
    alter table public.strategic_spots add column geocode_error text;
  end if;
end $$;

-- 4) Tambah kolom last_geocoded_at (jika belum ada)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='last_geocoded_at'
  ) then
    alter table public.strategic_spots add column last_geocoded_at timestamptz;
  end if;
end $$;

-- 5) Allow NULL untuk latitude/longitude (aman untuk seed awal)
alter table public.strategic_spots 
  alter column latitude drop not null,
  alter column longitude drop not null;

-- 6) Tambah index untuk geocode_status (agar query cepat)
create index if not exists strategic_spots_geocode_status_idx 
  on public.strategic_spots (geocode_status);

-- 7) Tambah index untuk notes (untuk filter seed)
create index if not exists strategic_spots_notes_idx 
  on public.strategic_spots (notes);

-- 8) Tambah kolom extended fields untuk compatibility dengan format lengkap
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='kecamatan'
  ) then
    alter table public.strategic_spots add column kecamatan text;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='modes'
  ) then
    alter table public.strategic_spots add column modes text[];
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='corridor_tags'
  ) then
    alter table public.strategic_spots add column corridor_tags text[];
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='halal_risk'
  ) then
    alter table public.strategic_spots add column halal_risk text;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='geocode_query'
  ) then
    alter table public.strategic_spots add column geocode_query text;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='wd_weights'
  ) then
    alter table public.strategic_spots add column wd_weights jsonb;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='we_weights'
  ) then
    alter table public.strategic_spots add column we_weights jsonb;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_name='strategic_spots' and column_name='active_day_types'
  ) then
    alter table public.strategic_spots add column active_day_types text[];
  end if;
end $$;

-- 9) RLS: Pastikan tetap safe
-- Read: authenticated users boleh lihat semua strategic_spots
drop policy if exists "spots_select_public" on public.strategic_spots;
create policy "spots_select_public"
  on public.strategic_spots
  for select
  to anon, authenticated
  using (true);

-- 10) RLS: Service Role Access (Backend/Scripts only)
drop policy if exists "spots_service_role_all" on public.strategic_spots;
create policy "spots_service_role_all"
  on public.strategic_spots
  for all
  to service_role
  using (true)
  with check (true);

-- 11) Block write dari authenticated user (safety)
drop policy if exists "spots_block_user_write" on public.strategic_spots;
create policy "spots_block_user_write"
  on public.strategic_spots
  for all
  to authenticated
  using (false)
  with check (false);

commit;
