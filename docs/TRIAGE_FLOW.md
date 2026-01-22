# Triage Flow - MAXIMUS Beta

Panduan untuk mengklasifikasi, memprioritaskan, dan menangani laporan bug dari beta tester. Dokumen ini membantu maintainer membuat keputusan cepat dan konsisten.

---

## Klasifikasi Bug

### Severity Levels

| Level | Nama        | Deskripsi                                                                 | Contoh                                                      |
|-------|-------------|---------------------------------------------------------------------------|-------------------------------------------------------------|
| **S0** | Data Loss   | Data user hilang, corrupt, atau tidak bisa di-recover                    | Order/expense terhapus permanen, sync overwrites data       |
| **S1** | Broken Core Flow | Fitur utama tidak bisa digunakan sama sekali                        | Tidak bisa create order, tidak bisa login, sync selalu gagal |
| **S2** | Degraded    | Fitur masih bisa digunakan tapi dengan effort ekstra atau workaround      | Sync lambat, UI lag, error tapi bisa retry                  |
| **S3** | Cosmetic    | Masalah UI/UX yang tidak menghambat fungsi utama                          | Typo, warna tidak sesuai, label overlap                     |

### Category Classification

| Category              | Deskripsi                                                                 | Error Codes Terkait                          |
|-----------------------|---------------------------------------------------------------------------|----------------------------------------------|
| **Sync/RLS**          | Masalah sinkronisasi atau Row Level Security (permission)                 | RLS_DENIED, SCHEMA_MISMATCH                  |
| **Auth**              | Masalah login, logout, session                                            | N/A (biasanya UNKNOWN atau custom error)     |
| **Finance Calc**      | Kalkulasi pendapatan, komisi, pengeluaran salah                           | N/A (biasanya logic bug)                     |
| **Heatmap**           | Masalah peta strategis atau geocoding                                     | NETWORK_OFFLINE, TIMEOUT, UNKNOWN            |
| **UI/UX**             | Masalah tampilan, navigasi, atau user experience                          | N/A (visual bugs)                            |
| **Performance**       | App lambat, lag, freeze, atau timeout                                     | TIMEOUT, NETWORK_OFFLINE                     |
| **PWA Install/Cache** | Masalah instalasi PWA, service worker, atau caching                       | N/A (browser-specific)                       |

---

## Decision Tree

Gunakan decision tree ini untuk diagnosis cepat:

### 1. Error Code: RLS_DENIED

**Kemungkinan Penyebab:**
- RLS policy tidak lengkap atau salah
- User ID tidak sesuai (misal: `auth.uid()` vs `user_id` column)
- Soft delete tidak di-handle di RLS policy (DELETE operation seharusnya UPDATE)

**Reproduksi:**
1. Cek tabel mana yang error (dari `diagnostics.errors.recent[0].table`)
2. Buka Supabase Dashboard → Table Editor → pilih tabel
3. Cek RLS policies untuk operation yang gagal (SELECT, INSERT, UPDATE, DELETE)
4. Verify `user_id` column di record vs `auth.uid()` dari session

**Tindakan:**
- Jika policy missing: Tambah policy baru di migration
- Jika soft delete issue: Pastikan RLS policy untuk DELETE mengarah ke UPDATE dengan `deleted_at = NOW()`
- Jika user_id mismatch: Cek logic insert/update, pastikan `user_id` di-set dengan benar
- Deploy hotfix dengan migration baru

**SLA:** S0 atau S1 → Fix dalam 24 jam

---

### 2. Error Code: SCHEMA_MISMATCH

**Kemungkinan Penyebab:**
- Migration belum di-apply ke production database
- App code menggunakan column/table yang belum ada di DB
- Typo di column name

**Reproduksi:**
1. Cek error message detail (dari `diagnostics.errors.recent[0].messageShort`)
2. Identifikasi column/table yang "does not exist"
3. Buka Supabase Dashboard → Database → check schema

**Tindakan:**
- Jika migration belum applied: Run migration di production (lihat RUN_MIGRATION_MANUALLY.md)
- Jika typo di code: Fix typo, deploy
- Jika column memang belum ada: Buat migration baru, deploy

**SLA:** S0 atau S1 → Fix dalam 24 jam

---

### 3. Error Code: NETWORK_OFFLINE atau TIMEOUT

**Kemungkinan Penyebab:**
- Driver sedang offline (airplane mode, no signal)
- Network slow/unstable
- Server timeout (Supabase down atau overloaded)

**Reproduksi:**
1. Cek `diagnostics.runtime.online` → apakah false?
2. Reproduce dengan airplane mode ON:
   - Buat order → seharusnya tersimpan lokal
   - Enable network → seharusnya auto-sync
3. Jika tidak bisa reproduce, kemungkinan server issue atau network driver memang lemah

**Tindakan:**
- Jika offline: Ini expected behavior, app sudah handle offline-first
- Jika timeout frequent: Investigate network retry logic, increase timeout threshold, atau optimize query
- Jika server down: Check Supabase status page, notify driver untuk retry

**SLA:** S2 atau S3 → Fix di next release (tidak urgent kecuali frequent)

---

### 4. Error Code: RATE_LIMIT

**Kemungkinan Penyebab:**
- Too many requests ke Supabase API dalam waktu singkat
- Sync loop atau infinite retry

**Reproduksi:**
1. Cek `diagnostics.sync.pendingOpsCount` dan `failedOpsCount`
2. Jika counts sangat tinggi (> 100), kemungkinan ada loop
3. Check code untuk retry logic yang aggressive

**Tindakan:**
- Add exponential backoff untuk retry logic
- Limit max retry attempts
- Investigate kenapa ada banyak pending ops (data stuck di oplog?)

**SLA:** S2 → Fix dalam 1 minggu

---

### 5. Error Code: UNKNOWN

**Kemungkinan Penyebab:**
- Error yang belum ter-classify di `diagnostics.js`
- Logic bug di app code
- Browser-specific issue

**Reproduksi:**
1. Baca `diagnostics.errors.recent[0].messageShort` untuk detail error
2. Search error message di Google atau GitHub issues
3. Minta driver untuk screenshot atau repro steps detail

**Tindakan:**
- Investigate case-by-case
- Jika reproducible: Debug dan fix
- Jika tidak reproducible: Monitor, minta driver lapor lagi jika kejadian ulang
- Consider tambah error classification baru di `diagnostics.js` jika pattern jelas

**SLA:** Tergantung severity (S0 → 24 jam, S1 → 48 jam, S2 → 1 minggu)

---

## Response SLAs (Service Level Agreements)

| Severity | Response Time | Fix Time         | Communication                                        |
|----------|---------------|------------------|------------------------------------------------------|
| **S0**   | < 1 hour      | Same day hotfix  | Balas driver segera, notify all testers jika widespread |
| **S1**   | < 4 hours     | Within 48 hours  | Balas driver dalam 4 jam, notify jika delay          |
| **S2**   | < 24 hours    | Next release     | Balas driver dalam 24 jam, optional notify           |
| **S3**   | < 48 hours    | Backlog          | Balas driver, add to backlog                         |

**Catatan:**
- Response Time = waktu balas ke driver via WhatsApp
- Fix Time = waktu deploy fix ke production
- Jika tidak bisa meet SLA, komunikasikan ke driver: "Pak, issue sedang kami investigasi, butuh waktu lebih lama. Akan update segera."

---

## Triage Checklist

Gunakan checklist ini untuk setiap laporan bug:

### Step 1: Initial Assessment (2 menit)
- [ ] Baca pesan WhatsApp dari driver
- [ ] Parse JSON diagnostics (copy ke text editor)
- [ ] Identifikasi:
  - [ ] App version
  - [ ] Device
  - [ ] Route
  - [ ] Error code (dari `errors.recent[0].code`)
  - [ ] Error message (dari `errors.recent[0].messageShort`)

### Step 2: Classify (2 menit)
- [ ] Tentukan **Severity**: S0 / S1 / S2 / S3 (lihat tabel di atas)
- [ ] Tentukan **Category**: Sync/RLS, Auth, Finance Calc, Heatmap, UI/UX, Performance, PWA Install
- [ ] Tentukan **Reproducibility**: Always / Sometimes / Once
- [ ] Tentukan **Impact**: Blocker / Degraded / Annoyance

### Step 3: Prioritize (1 menit)
- [ ] Jika S0: URGENT, stop semua task lain, fix sekarang
- [ ] Jika S1: HIGH, prioritaskan dalam 48 jam
- [ ] Jika S2: MEDIUM, masukkan ke next release
- [ ] Jika S3: LOW, masukkan ke backlog

### Step 4: Respond (2 menit)
- [ ] Balas ke driver via WhatsApp:
  - S0/S1: "Terima kasih Pak, kami sedang investigasi issue ini dan akan segera perbaiki."
  - S2/S3: "Terima kasih Pak, issue sudah kami catat dan akan kami perbaiki di update berikutnya."
- [ ] Jika perlu info tambahan: "Pak, bisa minta tolong screenshot atau detail langkah reproduksinya?"

### Step 5: Record (2 menit)
- [ ] Catat ke telemetry sheet (lihat MANUAL_TELEMETRY_PLAYBOOK.md)
- [ ] ATAU buat GitHub issue (gunakan template bug_report.yml)
- [ ] Set status: "Open"

### Step 6: Investigate & Fix (varies)
- [ ] Reproduce bug di local/staging
- [ ] Identifikasi root cause
- [ ] Fix code atau migration
- [ ] Test fix di local
- [ ] Deploy ke staging (jika ada)
- [ ] Deploy ke production
- [ ] Verify fix di production
- [ ] Update status: "Fixed"
- [ ] Notify driver: "Pak, issue sudah diperbaiki di versi X.X.X. Silakan refresh app atau reinstall."

---

## Repro (Reproduction) Checklist

Untuk reproduce bug:

### Minimal Repro Info yang Dibutuhkan:
- [ ] **Steps to reproduce**: Apa yang dilakukan driver sebelum error? (misal: "Buka halaman Expenses → Tap delete order")
- [ ] **Expected result**: Apa yang seharusnya terjadi? (misal: "Order terhapus dan muncul di trash")
- [ ] **Actual result**: Apa yang terjadi? (misal: "Muncul error RLS_DENIED, order tidak terhapus")
- [ ] **Screenshot**: Jika ada, screenshot layar error
- [ ] **Diagnostics JSON**: JSON snapshot dari tombol "Laporkan via WhatsApp"
- [ ] **Time window**: Jam berapa error terjadi? (untuk cek Supabase logs jika perlu)
- [ ] **Route/location**: Lokasi driver saat error (opsional, hanya untuk context)

### Jika Info Kurang Lengkap:
- Kirim "Request more info" message ke driver (lihat WHATSAPP_MESSAGES.md)
- Minta driver untuk reproduce dan kirim screenshot + diagnostics lagi

---

## Escalation Path

Jika ada bug yang tidak bisa di-fix dalam SLA:

### Internal Escalation (Solo Maintainer)
1. **Reprioritize**: Move lower priority tasks, focus on critical bug
2. **Workaround**: Jika fix terlalu kompleks, cari workaround sementara dan dokumentasikan
3. **Rollback**: Jika bug introduced di version baru dan blocking, rollback ke version sebelumnya (lihat RELEASE_CHECKLIST.md)

### External Escalation (Jika Perlu)
1. **Community Help**: Post di Supabase Discord, React community, atau Stack Overflow untuk technical help
2. **Vendor Support**: Contact Supabase support jika issue di Supabase side (RLS bug, database issue)

---

## Common Patterns & Solutions

### Pattern: Frequent RLS_DENIED di route `/expenses`
**Root Cause:** RLS policy untuk `expenses` table mungkin tidak lengkap  
**Solution:** Audit RLS policies, pastikan semua operations (SELECT, INSERT, UPDATE, DELETE/soft-delete) ter-cover  
**Prevention:** Tambah test untuk RLS di test suite

### Pattern: SCHEMA_MISMATCH setelah deployment
**Root Cause:** Migration belum applied atau app code ahead of DB schema  
**Solution:** Ensure migration applied BEFORE deploy app code. Add migration status check di preflight script  
**Prevention:** Update deployment checklist untuk verify migration status

### Pattern: TIMEOUT di route `/insight` atau `/strategy-map`
**Root Cause:** Query terlalu lambat atau data terlalu besar  
**Solution:** Optimize query (add index, limit rows), implement pagination, atau cache data  
**Prevention:** Load testing di staging dengan realistic data volume

### Pattern: NETWORK_OFFLINE frequent tapi driver bilang "online"
**Root Cause:** Network unstable (poor signal), bukan benar-benar offline  
**Solution:** Increase retry attempts, add exponential backoff, improve error message (misal: "Koneksi tidak stabil, coba lagi")  
**Prevention:** Test app di low-signal area atau network throttling

---

## Triage Meeting (Optional)

Jika ada banyak bug atau multiple testers:

### Daily Standup (5 menit)
- Review bugs baru dari kemarin
- Status update bugs in-progress
- Blocker discussion

### Weekly Review (30 menit)
- Review telemetry sheet
- Identify patterns
- Plan fixes untuk next week
- Update beta rollout decision (go/no-go untuk next stage)

**Catatan:** Untuk solo maintainer, daily standup bisa di-skip, cukup pakai daily triage ritual (lihat MANUAL_TELEMETRY_PLAYBOOK.md).

---

## Decision Matrix: Fix vs. Defer vs. Wontfix

| Kondisi                                      | Decision  | Reasoning                                                      |
|----------------------------------------------|-----------|----------------------------------------------------------------|
| S0 dengan reproducibility "Always"           | Fix ASAP  | Data loss tidak boleh terjadi                                  |
| S1 dengan reproducibility "Always"           | Fix < 48h | Core flow broken, blocking user                                |
| S1 dengan reproducibility "Sometimes"        | Fix < 1w  | Investigasi dulu, jika rare case bisa defer                    |
| S2 dengan reproducibility "Always"           | Fix next  | Degraded tapi tidak blocking                                   |
| S2 dengan reproducibility "Sometimes/Once"   | Defer     | Monitor, fix jika frequent                                     |
| S3 dengan reproducibility "Always"           | Defer     | Cosmetic, tidak urgent                                         |
| S3 dengan reproducibility "Sometimes/Once"   | Wontfix   | Minor issue, tidak worth effort                                |
| Device-specific issue (hanya 1 device)       | Defer     | Investigate, jika widespread baru fix                          |
| Browser-specific issue (bukan Chrome)        | Defer     | Target browser adalah Chrome, support browser lain best-effort |

---

## Template: Triage Notes (Internal)

Gunakan template ini untuk catat notes internal (di GitHub issue, telemetry sheet, atau private notes):

```markdown
## Bug: [Short summary]

**Reported by:** [Tester ID]  
**Date:** [YYYY-MM-DD]  
**Version:** [App version]  
**Device:** [Device model]  
**Route:** [Route/page]  
**Error Code:** [Code]

**Severity:** [S0/S1/S2/S3]  
**Category:** [Category]  
**Reproducibility:** [Always/Sometimes/Once]  
**Impact:** [Blocker/Degraded/Annoyance]

---

### Description
[Copy dari WhatsApp: langkah kejadian, yang terjadi, yang seharusnya]

### Diagnostics
[Paste JSON atau link ke JSON file]

### Repro Steps
1. [Step 1]
2. [Step 2]
3. [Observe error]

### Root Cause
[Hasil investigasi]

### Solution
[What was fixed]

### Verification
- [ ] Fixed in local
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Verified in production
- [ ] Notified tester

### Related
- Related to [Issue #XXX]
- Duplicate of [Issue #YYY]
```

---

## Contact

**Admin WhatsApp:** 6285953937946  
**Maintainer:** Pak (solo maintainer)

**Catatan:** Triage adalah skill yang improve dengan practice. Update decision tree ini sesuai lesson learned dari beta testing.
