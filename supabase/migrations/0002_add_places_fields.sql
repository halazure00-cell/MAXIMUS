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

-- 8) RLS: Pastikan tetap safe
-- Read: authenticated users boleh lihat semua strategic_spots
drop policy if exists "spots_select_public" on public.strategic_spots;
create policy "spots_select_public"
  on public.strategic_spots
  for select
  to anon, authenticated
  using (true);

-- 9) RLS: Write via service_role/backend job only (tidak dari frontend)
-- Policy insert/update/delete tidak dibuat di sini (server-only access)

commit;
