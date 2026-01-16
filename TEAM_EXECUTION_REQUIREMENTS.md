# MAXIMUS Seed `bdg100:v1` - Final Team Execution Requirements

## Executive Summary

Implementasikan MAXIMUS seed `bdg100:v1` untuk tabel `strategic_spots` sesuai dokumentasi Quick Reference, dengan standar **zero regression** dan **idempotent**. Semua step wajib dijalankan dalam urutan yang tepat.

---

## ⚠️ Mandatory Requirements (Wajib Dipenuhi)

### (1) STAGING FIRST - NEVER PRODUCTION FIRST
- ❌ Jangan jalankan di production sebelum lolos staging end-to-end
- ✅ Jalankan semua phases (1-6) di staging dulu
- ✅ Validasi semua tests A-I lolos 100%
- ✅ Baru setelah itu, jalankan di production dengan kredensial prod

### (2) Backup Data - Proper CSV Format ⚠️
```bash
# WAJIB gunakan \copy untuk CSV format yang benar, bukan pipe-delimited text
psql -h $HOST -U $USER -d $DB -c "\copy (select * from public.strategic_spots order by id) to 'backup_spots_$(date +%s).csv' csv header"

# Simpan file backup sebagai build artifact (jangan hilangkan!)
```
**Alasan**: Format CSV yang benar memudahkan restore jika ada masalah. Output `select ... >` akan menghasilkan pipe-delimited text yang bukan CSV sebenarnya.

### (3) Schema Consistency Check ⚠️ CRITICAL
Migration `supabase/migrations/0002_add_places_fields.sql` **HARUS** menambahkan kolom-kolom ini SEBELUM seed berjalan:
- `place_id` (text, unique)
- `geocode_status` (text, default 'PENDING', CHECK constraint)
- `geocode_error` (text, nullable)
- `last_geocoded_at` (timestamptz, nullable)

**Before running seed, verify columns exist:**
```sql
select column_name, is_nullable 
from information_schema.columns 
where table_name='strategic_spots' 
and column_name in ('place_id', 'geocode_status', 'geocode_error', 'last_geocoded_at')
order by column_name;
```
**Expected output**: 4 rows, semua dengan is_nullable yang sesuai.

**If columns missing**: STOP immediately. Fix migration, apply again, then proceed.

### (4) Migration Safety - Transactional Execution
Jalankan migrasi dalam transaction:
```bash
psql -h $HOST -U $USER -d $DB -f supabase/migrations/0002_add_places_fields.sql
```
**Tidak boleh ada** perubahan breaking ke tabel lain (`orders`, `expenses`, `profiles`).

Verifikasi setelah migrasi:
```sql
-- Check no columns deleted/renamed
select count(*) from information_schema.columns 
where table_name='orders' or table_name='expenses' or table_name='profiles';

-- Check indexes exist
select indexname from pg_indexes where tablename='strategic_spots';
```

### (5) Seed Data - Idempotent & No Duplicates
Jalankan seed:
```bash
psql -h $HOST -U $USER -d $DB -f supabase/seeds/0001_seed_strategic_spots_bdg100_v1.sql
```
**Expected output**: `INSERT 0 100` (atau `DELETE X; INSERT 0 100` jika re-run)

Method: DELETE + INSERT (clean slate) → **Safe to re-run multiple times**

**After seed, run Tests A–E immediately:**
```bash
# See SEED_IMPLEMENTATION_QUICK_REFERENCE.md for all 5 queries
```

**Kirim output dari Test A–E** sebagai bukti seed berhasil.

### (6) RLS Policy - Read OK, Write Restricted
Strategic_spots harus readable untuk authenticated user, tetapi write HANYA via backend/service role.

**Verification**:
```sql
-- Check RLS enabled
select tablename from pg_tables 
where tablename='strategic_spots' 
and rowsecurity = true;

-- Check policies
select policyname, qual from pg_policies 
where tablename='strategic_spots'
order by policyname;
```

**Frontend** tidak boleh punya akses INSERT/UPDATE/DELETE ke strategic_spots. Hanya READ.

### (7) Google Places API - Backend Only ⚠️ SECURITY CRITICAL
Geocoding **HARUS** dijalankan dari backend SAJA menggunakan `SUPABASE_SERVICE_ROLE_KEY`.

**Requirements**:
- ✅ API key Google Places disimpan di backend environment (`.env.backend` atau secret manager)
- ✅ API key TIDAK ada di frontend bundle (check dengan `grep -r GOOGLE_PLACES_API_KEY src/`)
- ✅ Script `scripts/geocode_strategic_spots_google_places.ts` only runs on backend server/cron job
- ✅ Batch processing: max 50 spots per batch
- ✅ Delay: 300ms antar request (rate limiting)
- ✅ Retry: max 3x untuk OVER_QUERY_LIMIT dengan exponential backoff
- ✅ Stores: `place_id`, `latitude`, `longitude`, `geocode_status`, `geocode_error`, `last_geocoded_at`

**Setup environment variables before running:**
```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Backend only!
export GOOGLE_PLACES_API_KEY=your-google-api-key         # Backend only!

# Verify before running
echo "Env check: VITE_SUPABASE_URL=$VITE_SUPABASE_URL"
# Do NOT echo service role key or API key!
```

### (8) Geocoding Execution & Success Rate
Jalankan geocoding HANYA setelah seed berhasil (Tests A–E lolos):
```bash
npx ts-node scripts/geocode_strategic_spots_google_places.ts
```

**Expected behavior**:
- Batch 1: Processing 50 spots... (logs untuk setiap spot: ✅ OK, ⚠️ NOT_FOUND, ❌ ERROR)
- Batch 2: Processing remaining spots...
- Summary: Success rate >= 90% (minimal 90 dari 100 harus OK)
- Duration: ~30-40 seconds (~100 API calls)

**After geocoding, run Tests F–I:**
```bash
# See SEED_IMPLEMENTATION_QUICK_REFERENCE.md for all 4 queries
```

**Kirim output dari Test F–I** sebagai bukti geocoding berhasil.

### (9) Completion Checklist - Evidence Required ⚠️
Sebelum mengirim "selesai", kirimkan bukti lengkap:

1. **Link PR + commit hash**
   - PR description harus mention "MAXIMUS seed bdg100:v1"
   - Commit message: "feat(seed): add strategic_spots bdg100:v1 (100 spots + geocoding)"

2. **Execution logs** (tanpa secret)
   ```bash
   # Log migration execution
   psql ... -f 0002_add_places_fields.sql 2>&1 | tee migration.log
   
   # Log seed execution
   psql ... -f 0001_seed_strategic_spots_bdg100_v1.sql 2>&1 | tee seed.log
   
   # Log geocoding (capture stdout/stderr)
   npx ts-node scripts/geocode_strategic_spots_google_places.ts 2>&1 | tee geocoding.log
   ```
   Kirim: `migration.log`, `seed.log`, `geocoding.log`

3. **Query output - Tests A–I**
   ```bash
   # Run all 9 tests dan simpan output
   psql ... -c "select count(*) from public.strategic_spots where notes like 'seed:bdg100:v1:%';" > test_A.txt
   psql ... -c "select notes, count(*) from public.strategic_spots where notes like 'seed:bdg100:v1:%' group by notes having count(*)>1;" > test_B.txt
   # ... dst untuk Test C–I
   ```
   Kirim: `test_A.txt` hingga `test_I.txt` (atau 1 file dengan semua output)

4. **Sample records - Bukti geocoding OK**
   ```bash
   psql ... -c "select id, name, place_id, latitude, longitude, geocode_status from public.strategic_spots where notes like 'seed:bdg100:v1:%' and geocode_status='OK' limit 5;" > sample_ok_records.txt
   ```
   Kirim: `sample_ok_records.txt` (5+ record dengan place_id, lat, lng ter-filled)

5. **QA document**
   - `docs/qa_seed_bdg100_v1.md` ter-update dengan hasil actual execution (kalau ada perubahan)
   - Checklist di file harus semuanya di-tick (checked)

---

## 🔄 Error Handling & Rollback

Jika error di salah satu langkah:

1. **Identify root cause**
   - Cek logs untuk error message spesifik
   - Contoh: "duplicate key value violates unique constraint" → ada duplikasi seed

2. **Rollback**
   ```sql
   -- Option 1: Rollback seed (remove all bdg100:v1 data)
   begin;
   delete from public.strategic_spots where notes like 'seed:bdg100:v1:%';
   commit;
   
   -- Option 2: Rollback migration (if critical)
   -- (Requires custom rollback migration)
   -- Hubungi tech lead untuk prosedur rollback migration
   ```

3. **Report & Fix Plan**
   - Kirim ke tech lead:
     - Root cause (detailed error message)
     - Impact assessment (apa yang affected)
     - Fix plan (langkah-langkah perbaikan)
     - ETA untuk retry

4. **Retry**
   - Setelah fix diterapkan
   - Ulangi dari Phase 1 (backup, migrate, seed, validate, geocode)

---

## ✅ Sign-Off Criteria

Work COMPLETE hanya jika ALL kondisi terpenuhi:

- [ ] Migration applied without errors (log tersimpan)
- [ ] Seed inserted: exactly 100 rows (Test A = 100)
- [ ] No duplicates (Test B = 0 rows)
- [ ] Valid hours (Test C = 0 invalid)
- [ ] Status PENDING (Test D = 100)
- [ ] Coords NULL pre-geocode (Test E = 100)
- [ ] Geocoding completed (success rate >= 90%)
- [ ] Status distribution correct (Test F shows OK>=90)
- [ ] Success rate verified (Test G >= 90.0)
- [ ] Sample OK records fetched (Test H = 5+ rows)
- [ ] Error audit completed (Test I shows error breakdown)
- [ ] RLS policies working (read OK, no frontend write)
- [ ] No breaking changes to other tables
- [ ] All evidence files submitted (logs, test output, samples)
- [ ] PR merged into main

---

## 📋 Timeline & SLA

- **Staging execution**: ~45 minutes (Phases 1-6)
- **Production execution**: ~1 hour (Phases 1-6 again, with prod credentials)
- **Total turnaround**: Hari yang sama (same business day if started morning)
- **SLA**: Semua bukti harus dikirim **max 24 jam** setelah diminta

---

## ❓ Questions & Support

Jika ada pertanyaan atau blocker:
- Kirim di #maximus-seed-bdg100 channel
- Tag tech lead @[tech_lead_name]
- Include: error log + context + apa yang sudah dicoba

---

## 🎯 Final Reminder

```
Zero regression = Tidak boleh ada break ke fitur existing
Idempotent = Aman dijalankan ulang tanpa duplikasi
Evidence-based = Semua harus documented dengan bukti
```

**Version**: bdg100:v1  
**Total Spots**: 100  
**Kecamatan**: Multiple (Andir, Antapani, Arcamanik, ... Ujung Berung)  
**Date**: 2026-01-16  
**Status**: READY FOR EXECUTION (Staging First)
