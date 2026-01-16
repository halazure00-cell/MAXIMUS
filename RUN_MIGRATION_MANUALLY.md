# Instruksi Manual Migrasi Database

Aplikasi mendeteksi bahwa database Anda belum memiliki kolom-kolom terbaru yang diperlukan untuk fitur Heatmap/Geocoding.
Karena tidak ada akses langsung ke database service role dari environment ini, Anda perlu menjalankan SQL berikut secara manual di Supabase Dashboard.

## Cara Menjalankan
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Masuk ke project Anda.
3. Klik menu **SQL Editor** di sidebar kiri.
4. Klik **New Query**.
5. Copy-paste kode SQL di bawah ini.
6. Klik **Run** (tombol hijau).

## SQL Code (Migration)

```sql
begin;

-- 1) Tambah kolom place_id
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='place_id') then
    alter table public.strategic_spots add column place_id text unique;
  end if;
end $$;

-- 2) Tambah kolom geocode_status
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='geocode_status') then
    alter table public.strategic_spots add column geocode_status text default 'PENDING';
  end if;
end $$;

-- 3) Tambah kolom geocode_error
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='geocode_error') then
    alter table public.strategic_spots add column geocode_error text;
  end if;
end $$;

-- 4) Tambah kolom last_geocoded_at
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='last_geocoded_at') then
    alter table public.strategic_spots add column last_geocoded_at timestamptz;
  end if;
end $$;

-- 5) Tambah kolom extended fields
do $$ begin
  -- kecamatan
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='kecamatan') then
    alter table public.strategic_spots add column kecamatan text;
  end if;
  -- modes
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='modes') then
    alter table public.strategic_spots add column modes text[];
  end if;
  -- corridor_tags
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='corridor_tags') then
    alter table public.strategic_spots add column corridor_tags text[];
  end if;
  -- halal_risk
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='halal_risk') then
    alter table public.strategic_spots add column halal_risk text;
  end if;
  -- geocode_query
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='geocode_query') then
    alter table public.strategic_spots add column geocode_query text;
  end if;
  -- wd_weights
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='wd_weights') then
    alter table public.strategic_spots add column wd_weights jsonb;
  end if;
  -- we_weights
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='we_weights') then
    alter table public.strategic_spots add column we_weights jsonb;
  end if;
  -- active_day_types
  if not exists (select 1 from information_schema.columns where table_name='strategic_spots' and column_name='active_day_types') then
    alter table public.strategic_spots add column active_day_types text[];
  end if;
end $$;

-- 6) Allow NULL for coords
alter table public.strategic_spots alter column latitude drop not null;
alter table public.strategic_spots alter column longitude drop not null;

-- 7) RLS Policies
drop policy if exists "spots_select_public" on public.strategic_spots;
create policy "spots_select_public" on public.strategic_spots for select to anon, authenticated using (true);

drop policy if exists "spots_service_role_all" on public.strategic_spots;
create policy "spots_service_role_all" on public.strategic_spots for all to service_role using (true) with check (true);

drop policy if exists "spots_block_user_write" on public.strategic_spots;
create policy "spots_block_user_write" on public.strategic_spots for all to authenticated using (false) with check (false);

commit;
```
