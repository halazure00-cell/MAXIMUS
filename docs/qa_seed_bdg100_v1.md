# QA Checklist: Seed `bdg100:v1` Strategic Spots

## Tujuan
Verifikasi bahwa seed 100 strategic spots untuk Bandung (`bdg100:v1`) berhasil diinsert tanpa duplikasi atau error, dan siap untuk geocoding.

---

## Pre-Seed Checklist

- [ ] **Backup Data Lama**: Ekspor tabel `strategic_spots` saat ini (jika ada)
  ```bash
  psql -h $HOST -U $USER -d $DB -c "select * from public.strategic_spots" > backup_spots_$(date +%s).csv
  ```

- [ ] **Staging Environment**: Jalankan semua test di staging, bukan production

- [ ] **Kolom Sudah Ada**: Pastikan `latitude`, `longitude` nullable, dan kolom Places sudah exist
  ```sql
  select column_name, is_nullable from information_schema.columns 
  where table_name='strategic_spots' and column_name in ('latitude','longitude','place_id','geocode_status');
  ```

- [ ] **No Active Transactions**: Pastikan tidak ada transaction lock di tabel ini

---

## Eksekusi Seed

### Step 1: Apply Migration
```bash
psql -h $HOST -U $USER -d $DB -f supabase/migrations/0002_add_places_fields.sql
```
**Result Expected**: Semua kolom exist, tidak ada error.

### Step 2: Run Seed
```bash
psql -h $HOST -U $USER -d $DB -f supabase/seeds/0001_seed_strategic_spots_bdg100_v1.sql
```
**Result Expected**: `INSERT 0 100` (100 baris inserted)

---

## Post-Seed Validation Queries

### ✅ Test A: Jumlah Row = 100
```sql
select count(*) as total_rows
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%';
```

**Expected Output**:
```
 total_rows 
────────────
        100
(1 row)
```

---

### ✅ Test B: Tidak Ada Duplikasi Notes
```sql
select notes, count(*) as cnt
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%' 
group by notes 
having count(*) > 1;
```

**Expected Output**:
```
(0 rows)
```

---

### ✅ Test C: Semua Hour Valid (start < end, range 0-24)
```sql
select count(*) as invalid_hours
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%'
  and not (
    start_hour >= 0 and start_hour <= 23
    and end_hour >= 1 and end_hour <= 24
    and end_hour > start_hour
  );
```

**Expected Output**:
```
 invalid_hours 
───────────────
             0
(1 row)
```

---

### ✅ Test D: Geocode Status Awal = PENDING
```sql
select geocode_status, count(*) as cnt
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%'
group by geocode_status
order by geocode_status;
```

**Expected Output**:
```
 geocode_status │ cnt 
────────────────┼─────
 PENDING        │ 100
(1 row)
```

---

### ✅ Test E: Latitude/Longitude = NULL (Pre-Geocoding)
```sql
select count(*) as null_coords
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%'
  and (latitude is null or longitude is null);
```

**Expected Output**:
```
 null_coords 
─────────────
         100
(1 row)
```

---

## Geocoding Job

### Step 3: Setup Environment
```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export GOOGLE_PLACES_API_KEY=your-google-places-key
```

### Step 4: Run Geocoding
```bash
npx ts-node scripts/geocode_strategic_spots_google_places.ts
```

### Monitor Logs
- Harapkan output: `✅ Success`, `⚠️ Not Found`, `❌ Error`
- Success rate minimal 90%

---

## Post-Geocoding Validation

### ✅ Test F: Geocode Status Distribution
```sql
select geocode_status, count(*) as cnt, 
       round(100.0*count(*)/sum(count(*)) over(), 1) as pct
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%'
group by geocode_status
order by geocode_status;
```

**Expected Output** (contoh):
```
 geocode_status │ cnt │  pct  
────────────────┼─────┼───────
 ERROR          │   3 │   3.0
 NOT_FOUND      │   7 │   7.0
 OK             │  90 │  90.0
(3 rows)
```

---

### ✅ Test G: Minimal 90% Success
```sql
select 
  sum(case when geocode_status='OK' then 1 else 0 end)::float / count(*) * 100 as success_pct
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%';
```

**Expected Output**: >= 90.0

---

### ✅ Test H: Sample OK Records (Verify Coordinates)
```sql
select id, name, place_id, latitude, longitude, geocode_status
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%' and geocode_status='OK'
limit 5;
```

**Expected Output**: Semua punya place_id, lat, lng (tidak NULL)

---

### ✅ Test I: Error Records (Audit)
```sql
select id, name, geocode_status, geocode_error
from public.strategic_spots 
where notes like 'seed:bdg100:v1:%' and geocode_status != 'OK'
order by geocode_status;
```

---

## Rollback Procedure (Jika Gagal)

Jika ada error serius:

```sql
begin;
delete from public.strategic_spots where notes like 'seed:bdg100:v1:%';
rollback;
```

---

## Sign-Off Checklist

- [ ] Test A–I semua passed
- [ ] Success rate >= 90%
- [ ] No constraint errors
- [ ] Koordinat ter-geocode dengan benar (spot real di Bandung)
- [ ] RLS tetap work (authenticated user bisa baca, tidak bisa write)
- [ ] App tidak crash saat load peta

---

## Notes
- Seed menggunakan idempotent `delete + insert`, aman dijalankan ulang
- Google Places API calls: ~100 requests per job (~30–40 detik)
- Jika timeout, split menjadi batch lebih kecil atau jalankan ulang
- Kolom `place_id` unique, jadi jika ada duplikasi nama di lokasi berbeda, akan error—handle manual

---

**Date Executed**: _______________  
**Executed By**: _______________  
**All Tests Passed**: ☐ YES ☐ NO
