# Manual Telemetry Playbook - MAXIMUS Beta

Panduan untuk mengumpulkan, merekam, dan mereview telemetri manual dari laporan WhatsApp driver selama periode beta. Tidak ada automatic telemetry, semua data dikumpulkan dari laporan diagnostics on-demand.

---

## Prinsip Dasar

1. **No automatic telemetry**: Data hanya dikumpulkan saat driver melaporkan bug via WhatsApp
2. **Manual recording**: Maintainer mencatat data ke telemetry sheet (spreadsheet atau markdown table)
3. **Privacy-first**: Tidak ada GPS, tidak ada tracking otomatis, tidak ada PII (Personally Identifiable Information)
4. **Actionable**: Fokus pada data yang bisa ditindaklanjuti untuk fix bugs dan improve app

---

## Data yang Dikumpulkan dari Laporan WhatsApp

Setiap laporan bug via WhatsApp berisi:

### 1. Metadata Laporan
- **Date/Time**: Kapan laporan diterima (dari timestamp WhatsApp)
- **Tester ID**: Identitas driver (inisial atau kode, misal: BDG-001, BDG-002)
- **App Version**: Dari diagnostics JSON field `app.version`
- **Device**: Dari diagnostics JSON field `device.userAgent` (ringkas: "Samsung A12", "Xiaomi Redmi 9", dll)

### 2. Error Context
- **Route**: Halaman saat error terjadi (dari `runtime.route`, misal: `/`, `/expenses`, `/insight`)
- **Error Code**: Dari `errors.recent[0].code` (misal: RLS_DENIED, SCHEMA_MISMATCH, NETWORK_OFFLINE, TIMEOUT, UNKNOWN)
- **Severity**: Klasifikasi S0/S1/S2/S3 (lihat TRIAGE_FLOW.md)
- **Category**: Kategori issue (Sync/RLS, Auth, Finance Calc, Heatmap, UI/UX, Performance, PWA Install/Cache)

### 3. User Context
- **Deskripsi Singkat**: Dari bagian "Langkah kejadian" + "Yang terjadi" di template WhatsApp
- **Reproducibility**: Apakah bug bisa direproduksi? (Always / Sometimes / Once)
- **Impact**: Blocker (tidak bisa lanjut), Degraded (masih bisa pakai tapi terganggu), atau Annoyance (minor)

### 4. Status Tracking
- **Status**: Open / In Progress / Fixed / Closed / Wontfix
- **Fix Version**: Versi di mana bug ini akan/sudah diperbaiki (misal: 1.1.1, 1.2.0)
- **Notes**: Catatan singkat untuk context tambahan

---

## Telemetry Sheet Schema

### Markdown Table Template

Copy template ini untuk tracking di markdown file atau paste ke spreadsheet:

```markdown
| Date       | Tester ID | Version | Device       | Route       | Code            | Severity | Category    | Summary                          | Reproducibility | Impact    | Status | Fix Ver | Notes                |
|------------|-----------|---------|--------------|-------------|-----------------|----------|-------------|----------------------------------|-----------------|-----------|--------|---------|----------------------|
| 2026-01-22 | BDG-001   | 1.1.0   | Samsung A12  | /expenses   | RLS_DENIED      | S1       | Sync/RLS    | Cannot delete expense            | Always          | Blocker   | Fixed  | 1.1.1   | RLS policy missing   |
| 2026-01-23 | BDG-002   | 1.1.0   | Xiaomi Redmi | /           | TIMEOUT         | S2       | Performance | Slow order creation              | Sometimes       | Degraded  | Open   | 1.2.0   | Investigate network  |
| 2026-01-23 | BDG-001   | 1.1.0   | Samsung A12  | /insight    | UNKNOWN         | S3       | UI/UX       | Chart label overlapping          | Always          | Annoyance | Open   | 1.2.0   | CSS fix needed       |
```

### CSV Template

Copy text block ini untuk import ke Google Sheets atau Excel:

```csv
Date,Tester ID,Version,Device,Route,Code,Severity,Category,Summary,Reproducibility,Impact,Status,Fix Ver,Notes
2026-01-22,BDG-001,1.1.0,Samsung A12,/expenses,RLS_DENIED,S1,Sync/RLS,Cannot delete expense,Always,Blocker,Fixed,1.1.1,RLS policy missing
2026-01-23,BDG-002,1.1.0,Xiaomi Redmi,/,TIMEOUT,S2,Performance,Slow order creation,Sometimes,Degraded,Open,1.2.0,Investigate network
2026-01-23,BDG-001,1.1.0,Samsung A12,/insight,UNKNOWN,S3,UI/UX,Chart label overlapping,Always,Annoyance,Open,1.2.0,CSS fix needed
```

### Field Definitions

| Field           | Description                                                                 | Values                                                      |
|-----------------|-----------------------------------------------------------------------------|-------------------------------------------------------------|
| Date            | Tanggal laporan diterima                                                    | YYYY-MM-DD                                                  |
| Tester ID       | Identitas driver (anonim)                                                   | BDG-001, BDG-002, JKT-001, dll                              |
| Version         | App version dari diagnostics                                                | 1.1.0, 1.1.1, 1.2.0, dll                                    |
| Device          | Device model (ringkas)                                                      | Samsung A12, Xiaomi Redmi, Oppo A5s, dll                    |
| Route           | Halaman/route saat error                                                    | /, /expenses, /insight, /profile, /strategy-map             |
| Code            | Error code dari diagnostics                                                 | RLS_DENIED, SCHEMA_MISMATCH, NETWORK_OFFLINE, TIMEOUT, UNKNOWN |
| Severity        | Tingkat keparahan (lihat TRIAGE_FLOW.md)                                    | S0, S1, S2, S3                                              |
| Category        | Kategori masalah                                                            | Sync/RLS, Auth, Finance Calc, Heatmap, UI/UX, Performance, PWA Install |
| Summary         | Deskripsi singkat (1 kalimat)                                               | Free text, max 50 chars                                     |
| Reproducibility | Apakah bisa direproduksi?                                                   | Always, Sometimes, Once                                     |
| Impact          | Dampak ke user                                                              | Blocker, Degraded, Annoyance                                |
| Status          | Status penanganan                                                           | Open, In Progress, Fixed, Closed, Wontfix                   |
| Fix Ver         | Versi di mana bug diperbaiki                                                | 1.1.1, 1.2.0, dll                                           |
| Notes           | Catatan tambahan                                                            | Free text                                                   |

---

## Workflow: Dari WhatsApp Report ke Telemetry Sheet

### Step 1: Terima Laporan via WhatsApp
- Driver kirim laporan via tombol "Laporkan via WhatsApp" di app
- Pesan masuk ke nomor admin (6285953937946)
- Pesan berisi:
  - Template laporan (tanggal, device, route, error code)
  - Deskripsi dari driver (langkah kejadian, yang terjadi, yang seharusnya)
  - JSON diagnostics snapshot

### Step 2: Parse Data dari Laporan
Ekstrak data dari laporan:

1. **Baca JSON diagnostics**:
   - `app.version` → Version
   - `device.userAgent` → Device (ringkas manual, misal "Samsung A12")
   - `runtime.route` → Route
   - `errors.recent[0].code` → Code (error code paling recent)

2. **Baca template WhatsApp**:
   - Timestamp laporan → Date
   - Identifikasi driver → Tester ID (gunakan kode anonim, misal BDG-001)

3. **Baca deskripsi driver**:
   - "Langkah kejadian" + "Yang terjadi" → Summary (ringkas jadi 1 kalimat)
   - Tentukan Reproducibility dari deskripsi (apakah driver bilang "selalu", "kadang", atau "sekali"?)
   - Tentukan Impact dari deskripsi (blocker, degraded, annoyance)

### Step 3: Klasifikasi (Triage)
Gunakan TRIAGE_FLOW.md untuk tentukan:
- **Severity**: S0 / S1 / S2 / S3
- **Category**: Sync/RLS, Auth, Finance Calc, Heatmap, UI/UX, Performance, PWA Install

### Step 4: Catat ke Telemetry Sheet
- Tambah row baru di telemetry sheet (markdown table atau spreadsheet)
- Isi semua kolom
- Set Status = "Open"
- Set Fix Ver = (kosongkan dulu atau tentukan nanti setelah triage)

### Step 5: Tindak Lanjut
- Balas ke driver via WhatsApp:
  - "Terima kasih laporannya Pak, sedang kami cek."
  - Jika perlu info tambahan, minta screenshot atau reproduksi steps lebih detail
- Fix bug sesuai SLA (lihat TRIAGE_FLOW.md)
- Update Status di telemetry sheet saat progress (Open → In Progress → Fixed)

---

## Daily Triage Ritual (10 menit)

Lakukan setiap pagi atau sore (1x per hari):

### 1. Review Laporan Baru (5 menit)
- Buka WhatsApp, cek laporan baru dari driver
- Parse dan catat ke telemetry sheet (lihat workflow di atas)
- Klasifikasi severity dan category

### 2. Prioritize Action (3 menit)
- Sort telemetry sheet by Severity (S0 → S1 → S2 → S3)
- Identifikasi S0 dan S1 yang perlu immediate action
- Tentukan Fix Ver untuk tiap issue:
  - S0: Hotfix today (misal 1.1.0 → 1.1.1)
  - S1: Next patch release (misal 1.1.2)
  - S2: Next minor release (misal 1.2.0)
  - S3: Backlog

### 3. Update Status (2 menit)
- Update status issues yang sudah dikerjakan kemarin
- Jika ada yang sudah fixed, deploy, dan verified → Status = "Fixed"
- Balas ke driver yang laporannya sudah fixed: "Pak, issue sudah diperbaiki di versi X.X.X, silakan update app"

---

## Weekly Stabilization Review (30 menit)

Lakukan setiap akhir minggu (1x per minggu):

### 1. Generate Summary Stats (10 menit)
Hitung dari telemetry sheet:
- **Total reports received**: Jumlah row
- **Crash rate**: (Jumlah S0 + S1) / Total reports * 100%
- **Top 3 error codes**: Group by Code, hitung frekuensi
- **Top 3 categories**: Group by Category, hitung frekuensi
- **Fix rate**: Jumlah Fixed / Total reports * 100%
- **Avg time to fix S0/S1**: Hitung manual dari Date laporan sampai Fix Ver deployed

### 2. Identify Patterns (10 menit)
- Apakah ada device tertentu yang sering bermasalah? (Group by Device)
- Apakah ada route tertentu yang sering error? (Group by Route)
- Apakah ada error code yang dominan? (Group by Code)
- Apakah ada tester yang sering lapor? (Group by Tester ID) → mungkin power user atau device-specific issue

### 3. Plan Action (10 menit)
- Jika ada pattern yang jelas (misal: RLS_DENIED sering terjadi di route /expenses):
  - Prioritaskan fix di next release
  - Investigasi root cause
- Jika crash rate > threshold (lihat BETA_ROLLOUT_SOP.md):
  - HOLD rollout ke stage berikutnya
  - Focus on stabilization
- Jika ada device-specific issue:
  - Consider test di device yang sama
  - Atau dokumentasikan sebagai known limitation

### 4. Document Lesson Learned
- Update README atau docs dengan known issues
- Update FAQ jika ada pertanyaan berulang dari driver
- Share summary ke driver (optional, via WhatsApp grup):
  - "Update mingguan: X bugs fixed, Y bugs sedang dikerjakan, terima kasih atas laporannya!"

---

## Metrics to Track (Manual Count)

Track metrics ini setiap minggu:

| Metric                     | Formula                                         | Target          |
|----------------------------|-------------------------------------------------|-----------------|
| Total reports              | Count rows di telemetry sheet                   | N/A             |
| Crash rate                 | (S0 + S1) / Total reports * 100%                | < 5% (Stage 1), < 2% (Stage 2), < 1% (Stage 3) |
| Sync error rate            | (Code=RLS_DENIED + Code=SCHEMA_MISMATCH) / Total * 100% | < 10% (Stage 1), < 5% (Stage 2), < 3% (Stage 3) |
| Fix rate (S0/S1)           | Fixed S0/S1 / Total S0/S1 * 100%                | > 90%           |
| Avg time to fix S0         | Manual avg (Date → Deploy date) untuk S0        | < 24 hours      |
| Avg time to fix S1         | Manual avg (Date → Deploy date) untuk S1        | < 48 hours      |
| Active testers             | Unique Tester ID yang lapor > 0 dalam seminggu  | > 50% dari total testers |

---

## Example Telemetry Sheet (Week 1)

```markdown
| Date       | Tester ID | Version | Device       | Route       | Code            | Severity | Category    | Summary                          | Reproducibility | Impact    | Status      | Fix Ver | Notes                     |
|------------|-----------|---------|--------------|-------------|-----------------|----------|-------------|----------------------------------|-----------------|-----------|-------------|---------|---------------------------|
| 2026-01-20 | BDG-001   | 1.1.0   | Samsung A12  | /           | RLS_DENIED      | S1       | Sync/RLS    | Cannot create order              | Always          | Blocker   | Fixed       | 1.1.1   | RLS insert policy fixed   |
| 2026-01-20 | BDG-002   | 1.1.0   | Xiaomi Redmi | /expenses   | UNKNOWN         | S3       | UI/UX       | Button text cut off              | Always          | Annoyance | Open        | 1.2.0   | CSS padding issue         |
| 2026-01-21 | BDG-003   | 1.1.0   | Oppo A5s     | /           | NETWORK_OFFLINE | S2       | Performance | Slow sync after offline          | Sometimes       | Degraded  | In Progress | 1.1.2   | Network retry logic       |
| 2026-01-21 | BDG-001   | 1.1.1   | Samsung A12  | /insight    | UNKNOWN         | S3       | Heatmap     | Heatmap not loading              | Once            | Annoyance | Open        | 1.2.0   | Cache issue, need repro   |
| 2026-01-22 | BDG-002   | 1.1.1   | Xiaomi Redmi | /           | SCHEMA_MISMATCH | S0       | Sync/RLS    | Data loss after delete           | Always          | Blocker   | Fixed       | 1.1.2   | Migration 20 not applied  |
```

**Summary Week 1:**
- Total reports: 5
- Crash rate: 40% (2 S0/S1 / 5 total) → HIGH, need immediate attention
- Sync error rate: 40% (2 RLS/SCHEMA / 5 total) → HIGH
- Fix rate S0/S1: 100% (2 fixed / 2 total) → GOOD
- Top error code: RLS_DENIED, SCHEMA_MISMATCH, UNKNOWN (tie)
- Top category: Sync/RLS (40%)
- Action: Focus on RLS and schema issues, test migration process

---

## Tools & Setup

### Option 1: Google Sheets (Recommended)
1. Buat Google Sheets baru: "MAXIMUS Beta Telemetry"
2. Sheet 1: "Reports" → paste CSV template
3. Sheet 2: "Weekly Summary" → hitung stats manual tiap minggu
4. Share akses ke team (jika ada)

### Option 2: Markdown File (Lightweight)
1. Buat file `telemetry/week_1.md` di repo
2. Copy markdown table template
3. Update setiap hari
4. Commit ke repo untuk tracking

### Option 3: GitHub Issues (Alternative)
1. Setiap laporan WhatsApp → buat GitHub issue baru (gunakan issue template bug_report.yml)
2. Tag dengan label: severity (S0, S1, S2, S3), category, version
3. Track via GitHub Projects atau Milestones
4. Close issue saat fixed

**Recommendation:** Google Sheets paling praktis untuk solo maintainer, mudah sort, filter, dan hitung stats.

---

## Privacy & Data Retention

1. **No PII**: Jangan catat nama asli driver, nomor HP, email, atau alamat di telemetry sheet. Gunakan kode anonim (BDG-001, dll).
2. **No GPS**: Jangan catat koordinat GPS atau lokasi detail. Route/lokasi umum (misal "Bandung", "Cimahi") ok untuk context.
3. **Data retention**: Simpan telemetry sheet minimal 6 bulan untuk historical analysis. Setelah itu optional archive atau delete.
4. **JSON diagnostics**: Jangan commit JSON diagnostics lengkap ke public repo. Simpan lokal atau di private notes.

---

## FAQ

**Q: Apakah semua laporan WhatsApp harus dicatat ke telemetry sheet?**  
A: Ya, semua laporan yang berisi bug/error harus dicatat. Jika driver kirim pertanyaan atau feedback positif (bukan bug report), tidak perlu dicatat di telemetry sheet, tapi bisa dicatat di notes terpisah.

**Q: Bagaimana kalau driver lapor via WhatsApp tapi tidak pakai tombol "Laporkan via WhatsApp" di app?**  
A: Minta driver untuk re-submit pakai tombol di app supaya dapat diagnostics JSON. Jika tidak bisa, catat laporan manual dengan field yang tersedia (tanya device, route, dll manual).

**Q: Berapa lama menyimpan telemetry sheet?**  
A: Minimal 6 bulan. Berguna untuk track pattern jangka panjang dan lesson learned untuk project lain.

**Q: Apakah telemetry sheet harus di-commit ke repo?**  
A: Optional. Jika repo private, boleh commit untuk versioning. Jika repo public, jangan commit (ada PII risk). Gunakan Google Sheets atau local file.

---

## Contact

**Admin WhatsApp:** 6285953937946  
**Maintainer:** Pak (solo maintainer)

**Catatan:** Telemetry ini adalah approximation. Tidak 100% akurat seperti automatic telemetry, tapi cukup untuk decision-making di beta stage.
