# Release Checklist - MAXIMUS PWA

Checklist ketat untuk setiap deployment MAXIMUS ke production. Gunakan checklist ini untuk memastikan deployment aman dan issue-free.

---

## Pre-Release (Sebelum Deploy)

Lakukan semua checklist ini SEBELUM merge ke main branch atau deploy ke production:

### 1. CI/CD Status
- [ ] **CI green**: Jalankan `npm run lint && npm run test && npm run build` di local
- [ ] Pastikan semua test passed (0 failed tests)
- [ ] Pastikan build succeeded (no build errors)
- [ ] Pastikan lint passed (no lint errors)
- [ ] **GitHub Actions**: Cek GitHub Actions workflow status → semua checks green

### 2. Security & Code Quality
- [ ] **CodeQL**: Cek CodeQL analysis di GitHub → no new vulnerabilities
  - Jika ada alert baru: Review dan acknowledge atau fix sebelum deploy
  - Jika alert adalah false positive: Document di Security Summary
- [ ] **Dependabot**: Cek Dependabot alerts → no critical/high severity vulnerabilities
  - Jika ada: Update dependencies atau apply patch

### 3. Database Migration Status
- [ ] **Check migration files**: Apakah ada migration baru di `supabase/migrations/`?
- [ ] Jika YA:
  - [ ] Verify migration sudah tested di local Supabase
  - [ ] Verify migration sudah applied di staging (jika ada)
  - [ ] **PENTING:** Apply migration ke production Supabase SEBELUM deploy app
    - Login ke Supabase Dashboard → SQL Editor
    - Run migration SQL file
    - Verify schema updated (cek table/column baru di Table Editor)
- [ ] Jika TIDAK: Skip langkah migration

**Catatan:** App code HARUS NOT go live before migration applied. Schema mismatch akan cause S0/S1 errors.

### 4. Manual Smoke Tests (5 Items)

Jalankan smoke test manual di **staging environment** (atau local dengan production data jika tidak ada staging):

#### Test 1: Install/Load PWA
- [ ] Buka app di Chrome (desktop atau mobile)
- [ ] Install PWA (jika belum): Menu → "Install app" atau "Add to Home Screen"
- [ ] Verify app icon muncul
- [ ] Buka app dari icon
- [ ] Verify app loads < 3 detik (subjective timing)
- [ ] Verify no console errors (buka DevTools → Console)

#### Test 2: Create Order
- [ ] Navigate ke Profit Engine (/)
- [ ] Tap tombol (+) untuk buat order baru
- [ ] Isi:
  - Order price: Rp 25,000
  - Distance: 5 KM
  - Commission type: Priority (10%)
- [ ] Submit
- [ ] Verify order muncul di list
- [ ] Verify kalkulasi net profit benar (25000 - 2500 komisi - expenses)

#### Test 3: Add Expense
- [ ] Navigate ke Expenses
- [ ] Tap tombol (+) untuk buat expense baru
- [ ] Isi:
  - Type: Bensin
  - Amount: Rp 10,000
- [ ] Submit
- [ ] Verify expense muncul di list
- [ ] Verify expense ter-link ke order (jika applicable)

#### Test 4: Delete Order (Soft Delete) + Sync
- [ ] Pilih order yang baru dibuat di Test 2
- [ ] Tap icon delete (tong sampah)
- [ ] Confirm delete
- [ ] Verify order hilang dari list (soft deleted)
- [ ] Verify sync status: "Syncing..." → "Synced"
- [ ] Buka Supabase Dashboard → Table Editor → `orders` table
- [ ] Verify order masih ada di DB dengan `deleted_at` NOT NULL (soft delete)

#### Test 5: Insight Loads
- [ ] Navigate ke Insight
- [ ] Verify grafik pendapatan loads (no error)
- [ ] Verify grafik pengeluaran loads
- [ ] Verify summary cards (total pendapatan, pengeluaran, laba) shows data
- [ ] Verify no console errors

### 5. Version Bump (Optional)

- [ ] Update `package.json` version (misal: 1.1.0 → 1.1.1 atau 1.2.0)
- [ ] Update `src/lib/diagnostics.js` line 186 `appVersion` untuk match `package.json`
  - **Current:** `const appVersion = '1.1.0';`
  - **Update to:** `const appVersion = '1.1.1';` (atau sesuai package.json)
- [ ] Commit version bump: `git commit -m "chore: bump version to 1.1.1"`

**Catatan:** Jika tidak bump version, diagnostics akan report version lama. Ini ok untuk hotfix minor, tapi untuk major release sebaiknya bump.

---

## Release (Deploy ke Production)

### 1. Tag Version (Optional tapi Recommended)

Jika menggunakan git tags untuk versioning:

```bash
git tag -a v1.1.1 -m "Release v1.1.1: [short summary of changes]"
git push origin v1.1.1
```

Contoh summary: "Fix RLS_DENIED on expenses delete, improve sync error handling"

### 2. Deploy via Vercel

MAXIMUS menggunakan Vercel untuk deployment. Ada 2 cara deploy:

#### Option A: Auto Deploy (via Git Push)
- [ ] Merge PR ke branch `main` (atau branch production yang di-config di Vercel)
- [ ] Vercel otomatis trigger deployment
- [ ] Tunggu deployment selesai (~2-3 menit)
- [ ] Cek Vercel Dashboard → Deployments → verify status "Ready"

#### Option B: Manual Deploy (via Vercel CLI)
```bash
# Login ke Vercel (jika belum)
npx vercel login

# Deploy ke production
npx vercel --prod

# Tunggu deployment selesai
```

### 3. Verify Deployment

- [ ] Buka production URL (misal: https://maximus.vercel.app)
- [ ] Verify app loads
- [ ] Verify versi baru (buka Profile → Diagnostics → Copy Diagnostics → cek `app.version`)
- [ ] Test 1 core flow (misal: buat order) untuk quick sanity check

### 4. Announce to Testers

Kirim announcement message ke beta testers via WhatsApp (lihat WHATSAPP_MESSAGES.md untuk template):

**Template Singkat:**

```
Update MAXIMUS v[X.X.X]

Halo Pak, MAXIMUS sudah diupdate ke versi [X.X.X].

Yang diperbaiki:
- [Bug fix 1]
- [Bug fix 2]
- [Improvement 1]

Silakan refresh app atau reinstall PWA untuk dapat update terbaru.

Cara refresh:
1. Tutup app
2. Buka lagi dari browser atau icon
3. Atau: Settings browser → Clear cache untuk maximus.vercel.app

Terima kasih!
```

**Kirim ke:**
- Grup WhatsApp beta testers (jika ada grup)
- ATAU individual message ke semua testers
- ATAU announce di 1 message, add semua testers ke grup

---

## Post-Release (First 60 Minutes)

Lakukan monitoring ketat dalam 60 menit pertama setelah deploy:

### 1. Monitor WhatsApp Reports (Real-time)

- [ ] **Minutes 0-15**: Stand by di WhatsApp, siap terima laporan
  - Jika ada S0/S1 report → Segera triage (lihat TRIAGE_FLOW.md)
  - Jika SPIKE (> 3 S0/S1 reports dalam 15 menit) → Siap rollback
- [ ] **Minutes 15-30**: Continue monitoring
  - Count jumlah reports: Normal jika < 2 reports
  - Alert jika > 5 reports dalam 30 menit
- [ ] **Minutes 30-60**: Review summary
  - Apakah ada pattern? (misal: semua report dari device yang sama, atau route yang sama)
  - Jika ada pattern → Investigasi dan prepare hotfix

### 2. Check Supabase Logs (Optional)

Jika ada report S0/S1, cek Supabase logs untuk debug:

- [ ] Login ke Supabase Dashboard
- [ ] Navigate ke Logs → Postgres Logs atau API Logs
- [ ] Filter by time: Last 1 hour
- [ ] Look for errors: RLS denied, schema errors, query errors

### 3. Rollback Decision

Jika terjadi SPIKE atau critical issue:

| Kondisi                                  | Decision        | Action                          |
|------------------------------------------|-----------------|---------------------------------|
| > 3 S0 reports dalam 15 menit            | ROLLBACK        | Segera rollback (lihat playbook) |
| > 5 S1 reports dalam 30 menit            | CONSIDER ROLLBACK | Evaluate, jika widespread → rollback |
| > 10 S2 reports dalam 60 menit           | MONITOR         | Tidak perlu rollback, tapi monitor |
| 1-2 S0/S1 reports dari same user         | MONITOR         | Mungkin user-specific, tidak perlu rollback |

---

## Rollback Playbook (Vercel)

Jika harus rollback ke version sebelumnya:

### Step 1: Identify Previous Deployment

- [ ] Login ke Vercel Dashboard (https://vercel.com/dashboard)
- [ ] Navigate ke project MAXIMUS
- [ ] Go to **Deployments** tab
- [ ] Lihat list deployments, sort by date descending
- [ ] Identify deployment sebelum current deployment yang bermasalah
  - Verify deployment status: "Ready" (green)
  - Verify deployment time: Sebelum release yang bermasalah
  - Click deployment untuk lihat detail

### Step 2: Promote Previous Deployment

- [ ] Di deployment sebelumnya, click tombol **"Promote to Production"**
- [ ] Confirm promotion
- [ ] Tunggu 30-60 detik untuk propagasi

### Step 3: Verify Rollback

- [ ] Buka production URL (https://maximus.vercel.app)
- [ ] Hard refresh (Ctrl+Shift+R atau Cmd+Shift+R)
- [ ] Verify app loads
- [ ] Verify versi (cek Profile → Diagnostics → `app.version` harus kembali ke versi lama)
- [ ] Test 1 core flow untuk verify rollback successful

### Step 4: Notify Testers

Kirim message ke testers via WhatsApp:

```
ROLLBACK SEMENTARA

Halo Pak, MAXIMUS sementara dikembalikan ke versi sebelumnya karena ada masalah teknis di update terbaru.

Kami sedang perbaiki masalahnya dan akan update lagi segera.

Mohon maaf atas ketidaknyamanannya.

Silakan refresh app atau reinstall PWA.

Terima kasih atas laporannya!
```

### Step 5: Fix & Redeploy

- [ ] Fix issue di development branch
- [ ] Test fix di local
- [ ] Re-run smoke tests
- [ ] Deploy ke staging (jika ada)
- [ ] Deploy ke production (ulangi release checklist)

---

## Hotfix Workflow

Jika ada S0 atau urgent S1 yang perlu hotfix segera:

### 1. Create Hotfix Branch

```bash
# Dari branch main
git checkout main
git pull origin main

# Buat hotfix branch
git checkout -b hotfix/issue-description

# Contoh:
# git checkout -b hotfix/rls-denied-expenses-delete
```

### 2. Fix Issue

- [ ] Identifikasi root cause (lihat TRIAGE_FLOW.md)
- [ ] Fix code atau migration
- [ ] Test fix di local (reproduce bug → verify fix)
- [ ] Run lint, test, build: `npm run lint && npm run test && npm run build`

### 3. Fast-Track Review

Untuk hotfix critical, skip normal PR review process:

- [ ] Commit fix: `git commit -m "hotfix: [short description]"`
- [ ] Push branch: `git push origin hotfix/issue-description`
- [ ] Merge ke main (via PR atau direct merge jika urgent)

### 4. Deploy Hotfix

- [ ] Follow **Release** steps di atas (skip pre-release smoke tests jika already tested di local)
- [ ] Bump version (patch): 1.1.0 → 1.1.1
- [ ] Tag version: `git tag -a v1.1.1 -m "Hotfix: [description]"`
- [ ] Deploy via Vercel (auto deploy atau manual)

### 5. Verify & Notify

- [ ] Verify fix di production
- [ ] Test reproduksi bug → verify fixed
- [ ] Notify testers:
  ```
  HOTFIX v[X.X.X]

  Halo Pak, masalah [deskripsi bug] sudah diperbaiki di versi [X.X.X].

  Silakan refresh app atau reinstall PWA.

  Terima kasih atas laporannya!
  ```

---

## Release Notes Template

Gunakan template ini untuk dokumentasi internal (atau public jika release public):

```markdown
## MAXIMUS v[X.X.X] - [YYYY-MM-DD]

### 🐛 Bug Fixes
- Fix RLS_DENIED on expenses delete operation (#123)
- Fix SCHEMA_MISMATCH after migration 20 (#124)
- Fix sync timeout on slow network (#125)

### ✨ Improvements
- Improve error messages for offline sync
- Optimize insight query performance

### 🔧 Technical
- Bump Supabase client to v2.90.1
- Update RLS policies for soft delete

### 📝 Notes
- Migration 21 required: Run before app deploy
- No breaking changes
- Backward compatible with v1.0.x data

### 🙏 Thanks
Special thanks to beta testers: BDG-001, BDG-002, BDG-003 for reporting issues.
```

---

## Deployment Frequency Guideline

**Beta Stage:**
- **Hotfix (S0/S1):** As needed (same day)
- **Patch release (S2):** 1x per week
- **Minor release (features):** 1x per 2-4 weeks

**Production (GA):**
- **Hotfix (S0/S1):** As needed (same day)
- **Patch release (S2):** 1x per 2 weeks
- **Minor release (features):** 1x per month
- **Major release (breaking):** 1x per quarter

**Reasoning:** Too frequent deployment = change fatigue untuk testers. Too slow = bugs linger too long.

---

## Checklist Summary (Quick Reference)

### Pre-Release
- [ ] CI green (lint, test, build)
- [ ] CodeQL no new vulnerabilities
- [ ] Migration applied (if any)
- [ ] Smoke tests passed (5 items)
- [ ] Version bumped (optional)

### Release
- [ ] Tag version (optional)
- [ ] Deploy via Vercel
- [ ] Verify deployment
- [ ] Announce to testers

### Post-Release
- [ ] Monitor WhatsApp (60 min)
- [ ] Check S0/S1 reports
- [ ] Rollback if spike
- [ ] Document issues

---

## Emergency Contacts

**Solo Maintainer:** Pak  
**WhatsApp Admin:** 6285953937946  
**Vercel Account:** [Your Vercel email]  
**Supabase Project:** [Your Supabase project URL]

---

## Tools & Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **GitHub Actions:** https://github.com/halazure00-cell/MAXIMUS/actions
- **Dependabot:** https://github.com/halazure00-cell/MAXIMUS/security/dependabot

---

**Catatan:** Checklist ini adalah living document. Update berdasarkan lesson learned dari setiap deployment. Jika ada step yang selalu di-skip atau tidak relevan, hapus atau revise.
