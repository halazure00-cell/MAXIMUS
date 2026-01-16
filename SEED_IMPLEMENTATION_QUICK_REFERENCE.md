# MAXIMUS Seed Implementation: Quick Reference

## 📍 Deliverables Location

```
/workspaces/MAXIMUS/
├── supabase/
│   ├── migrations/
│   │   └── 0002_add_places_fields.sql          # Schema migration (78 lines)
│   └── seeds/
│       └── 0001_seed_strategic_spots_bdg100_v1.sql   # 100 seed rows (177 lines)
├── scripts/
│   └── geocode_strategic_spots_google_places.ts      # Geocoding job (247 lines)
└── docs/
    └── qa_seed_bdg100_v1.md                        # QA checklist (248 lines)
```

---

## 🚀 Quick Execution (Staging)

### Step 1: Backup (Proper CSV Format ⚠️)
```bash
# Use \copy for proper CSV format (NOT pipe-delimited text)
psql -h $HOST -U $USER -d $DB -c "\copy (select * from public.strategic_spots order by id) to 'backup_spots_$(date +%s).csv' csv header"
```

### Step 2: Apply Migration
```bash
psql -h $HOST -U $USER -d $DB \
  -f supabase/migrations/0002_add_places_fields.sql
```

### Step 3: Run Seed
```bash
psql -h $HOST -U $USER -d $DB \
  -f supabase/seeds/0001_seed_strategic_spots_bdg100_v1.sql
```

### Step 4: Validate (Tests A-E)
```bash
# Quick check - count should be 100
psql -h $HOST -U $USER -d $DB -c \
  "select count(*) from public.strategic_spots where notes like 'seed:bdg100:v1:%';"
```

### Step 5: Geocode (Backend Only)
```bash
# Setup env vars
export VITE_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export GOOGLE_PLACES_API_KEY=...

# Run geocoding
npx ts-node scripts/geocode_strategic_spots_google_places.ts
```

### Step 6: Validate Post-Geocode (Tests F-I)
```bash
# Check success rate
psql -h $HOST -U $USER -d $DB -c \
  "select geocode_status, count(*) from public.strategic_spots where notes like 'seed:bdg100:v1:%' group by geocode_status;"
```

---

## ✅ Pre-Execution Checklist

- [ ] All 4 files exist and verified
- [ ] Using staging environment
- [ ] Backup created
- [ ] Supabase credentials ready
- [ ] Google Places API key active (Text Search enabled)
- [ ] Node.js + ts-node available

---

## ⚠️ Important Notes

### Schema Consistency ⚠️ CRITICAL
- Migration `0002_add_places_fields.sql` MUST add these columns before seed runs:
  - `place_id` (text, unique)
  - `geocode_status` (text, default 'PENDING', CHECK constraint)
  - `geocode_error` (text, nullable)
  - `last_geocoded_at` (timestamptz, nullable)
- Verify columns exist BEFORE running seed (see Step 4 in execution guide)
- If column mismatch detected, STOP and fix migration first

### Idempotent
- Seed uses DELETE + INSERT → safe to re-run
- Migration uses "if not exists" → safe for multiple runs
- Geocoding includes `FOR UPDATE SKIP LOCKED` → safe for parallel execution

### RLS Safety
- Read: ✅ Authenticated users can read strategic_spots
- Write: ⛔ Frontend cannot modify (backend/service_role only)
- Geocoding: Backend-only with SUPABASE_SERVICE_ROLE_KEY

### Google Places API
- ✅ Backend-only execution (SUPABASE_SERVICE_ROLE_KEY)
- ✅ API key NOT in frontend code
- ✅ Batch 50 spots, delay 300ms, retry 3x
- ✅ Uses Places Details API for stable coordinates (after Text Search)
- ⚠️ Rate limiting: 300ms delay + retry logic (max 3x)

### Backward Compatibility
- ✅ No breaking changes to orders, expenses, profiles
- ✅ New columns NULLABLE → existing code works
- ✅ RLS policies don't change read behavior

---

## 📋 Validation Queries Quick Copy

```sql
-- Test A: Count = 100
select count(*) as total_rows from public.strategic_spots where notes like 'seed:bdg100:v1:%';

-- Test B: No duplicates
select notes, count(*) as cnt from public.strategic_spots where notes like 'seed:bdg100:v1:%' group by notes having count(*)>1;

-- Test C: Valid hours
select count(*) as invalid from public.strategic_spots where notes like 'seed:bdg100:v1:%' and not (start_hour>=0 and start_hour<=23 and end_hour>=1 and end_hour<=24 and end_hour>start_hour);

-- Test D: Status = PENDING
select geocode_status, count(*) from public.strategic_spots where notes like 'seed:bdg100:v1:%' group by geocode_status;

-- Test E: Coords = NULL
select count(*) as null_coords from public.strategic_spots where notes like 'seed:bdg100:v1:%' and (latitude is null or longitude is null);

-- Test F: Status distribution (post-geocode)
select geocode_status, count(*) as cnt, round(100.0*count(*)/sum(count(*)) over(), 1) as pct from public.strategic_spots where notes like 'seed:bdg100:v1:%' group by geocode_status order by geocode_status;

-- Test G: Success rate >= 90%
select sum(case when geocode_status='OK' then 1 else 0 end)::float / count(*) * 100 as success_pct from public.strategic_spots where notes like 'seed:bdg100:v1:%';

-- Test H: Sample OK records
select id, name, place_id, latitude, longitude from public.strategic_spots where notes like 'seed:bdg100:v1:%' and geocode_status='OK' limit 5;

-- Test I: Error records
select id, name, geocode_status, geocode_error from public.strategic_spots where notes like 'seed:bdg100:v1:%' and geocode_status != 'OK' order by geocode_status;
```

---

## 🔄 Rollback

If critical error:
```sql
begin;
delete from public.strategic_spots where notes like 'seed:bdg100:v1:%';
commit;
```

---

## 📚 Full Documentation

See [docs/qa_seed_bdg100_v1.md](./qa_seed_bdg100_v1.md) for complete details.

---

**Status**: ✅ READY FOR STAGING EXECUTION

Created: 2026-01-16  
Version: bdg100:v1  
Total Spots: 100 (distributed across multiple kecamatan in Kota Bandung)
Columns: name, category, notes, start_hour, end_hour, is_weekend_only, latitude, longitude, geocode_status, place_id, geocode_error, last_geocoded_at
