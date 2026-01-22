# Beta Rollout SOP - MAXIMUS PWA

Standard Operating Procedure untuk peluncuran beta bertahap MAXIMUS. Dokumen ini adalah panduan langkah-demi-langkah untuk maintainer tunggal menjalankan rollout dari 3 pengguna hingga 30 pengguna.

---

## Tahapan Beta (Staged Rollout)

### Stage 0: Internal Testing
**Peserta:** Pak + keluarga (1-3 orang)  
**Durasi:** 1-2 hari  
**Tujuan:** Smoke test di production environment

#### Entry Criteria
- Deploy ke production (Vercel) sudah selesai
- CI/CD green (lint, test, build passed)
- Migrations database sudah applied
- Smoke test manual sudah passed (lihat RELEASE_CHECKLIST.md)

#### Exit Criteria
- Zero data loss
- Zero crash pada core flow (order, expense, sync, insight)
- PWA install berhasil di minimal 2 device
- Sync berhasil (tidak ada RLS_DENIED atau SCHEMA_MISMATCH)
- Pak sudah familiar dengan cara menerima laporan via WhatsApp

**Tindakan jika FAIL:**
- Rollback deployment (lihat RELEASE_CHECKLIST.md)
- Fix issue di development
- Ulangi Stage 0

---

### Stage 1: Pilot Beta - 3 Driver Bandung
**Peserta:** 3 driver terpercaya di Bandung  
**Durasi:** 2-3 hari  
**Tujuan:** Validasi core flow di field dengan data real

#### Entry Criteria
- Stage 0 PASSED
- Onboarding script siap (lihat bagian Onboarding di bawah)
- WhatsApp admin (6285953937946) siap menerima laporan

#### Aktivitas
1. Kirim invite message ke 3 driver (lihat WHATSAPP_MESSAGES.md)
2. Lakukan onboarding via WhatsApp atau telepon (5-10 menit per driver)
3. Minta driver test semua core flow:
   - Install PWA
   - Login
   - Buat order (minimal 3 order per hari)
   - Catat expense (minimal 2 expense per hari)
   - Cek insight harian
   - Test sync (offline → online)
4. Terima laporan via WhatsApp setiap hari
5. Triage laporan (lihat TRIAGE_FLOW.md)
6. Fix S0/S1 issues dalam 48 jam

#### Exit Criteria
- Crash rate < 5% (manual count dari laporan)
- Sync error rate < 10%
- Zero data loss
- Core flow (order, expense, sync, insight) berjalan lancar
- Response time lapor bug < 24 jam
- Minimal 20 order + 10 expense created total (across 3 drivers, 2-3 hari)

**Scoring:**
- S0 (data loss) = FAIL (rollback atau hotfix segera)
- S1 (core flow broken) > 2 kali = HOLD (fix dulu sebelum lanjut)
- S2 (degraded) > 5 kali = REVIEW (evaluasi sebelum lanjut)

**Tindakan jika FAIL:**
- HOLD rollout ke Stage 2
- Fix issues yang ada
- Optionally reset ke Stage 1 dengan driver baru atau ulangi test

---

### Stage 2: Expanded Beta - 10 Driver
**Peserta:** 10 driver (termasuk 3 dari Stage 1)  
**Durasi:** 1-2 minggu  
**Tujuan:** Scale testing, validasi performa di beragam device

#### Entry Criteria
- Stage 1 PASSED
- Semua S0 dan S1 dari Stage 1 sudah fixed dan verified
- Deployment stabil minimal 2 hari tanpa hotfix

#### Aktivitas
1. Kirim invite message ke 7 driver baru (total 10 driver)
2. Onboarding batch (bisa via grup WhatsApp atau individual)
3. Tracking daily:
   - Terima laporan harian via WhatsApp
   - Update telemetry sheet manual (lihat MANUAL_TELEMETRY_PLAYBOOK.md)
   - Triage setiap pagi (10 menit)
4. Weekly review stabilitas (lihat MANUAL_TELEMETRY_PLAYBOOK.md)
5. Fix S0/S1 dalam 48 jam, S2 dalam next release

#### Exit Criteria
- Crash rate < 2%
- Sync error rate < 5%
- Zero data loss selama 1 minggu penuh
- Performance: App loads < 3 detik di low-end Android (subjektif dari laporan driver)
- Minimal 50% driver aktif (pakai app > 3 hari dalam seminggu)
- Feedback positif dari minimal 7 dari 10 driver

**Scoring:**
- S0 > 0 = FAIL (rollback atau hotfix)
- S1 > 3 dalam seminggu = HOLD
- S2 > 10 dalam seminggu = REVIEW

**Tindakan jika FAIL:**
- HOLD rollout ke Stage 3
- Fix critical issues
- Pertimbangkan extended Stage 2 (tambah 1 minggu)

---

### Stage 3: Wide Beta - 30 Driver
**Peserta:** 30 driver (termasuk 10 dari Stage 2)  
**Durasi:** Ongoing until GA (General Availability)  
**Tujuan:** Production readiness, scale validation

#### Entry Criteria
- Stage 2 PASSED
- App stabil selama minimal 1 minggu tanpa hotfix
- Semua S0 dan mayoritas S1 dari Stage 2 sudah fixed

#### Aktivitas
1. Kirim invite message ke 20 driver baru (total 30 driver)
2. Onboarding batch via grup WhatsApp
3. Monitoring weekly (tidak perlu daily tracking detail)
4. Monthly review untuk planning GA release
5. Continue triaging dan fixing bugs

#### Exit Criteria
- Crash rate < 1%
- Sync error rate < 3%
- Zero data loss selama 2 minggu penuh
- Performance stabil
- Feedback: Minimal 80% driver merasa app "membantu" atau "sangat membantu"
- Ready untuk public release (GA)

---

## Onboarding Script untuk Tester

Gunakan script ini saat onboarding driver baru (via WhatsApp atau telepon):

### Langkah 1: Penjelasan Singkat (1 menit)
```
Halo Pak [Nama],

Terima kasih sudah bersedia jadi beta tester MAXIMUS.

MAXIMUS adalah aplikasi khusus driver Maxim untuk bantu catat pendapatan, pengeluaran, dan lihat insight finansial harian.

Aplikasi ini masih tahap testing, jadi mungkin ada bug. Makanya Bapak diminta bantu test dan lapor kalau ada masalah.
```

### Langkah 2: Install PWA (2 menit)
```
Cara install:

1. Buka browser Chrome di HP
2. Ketik link ini: [URL production, misal: maximus.vercel.app]
3. Login pakai email atau nomor HP
4. Setelah masuk, tap menu (titik tiga) di Chrome → "Tambahkan ke layar utama" atau "Install app"
5. Icon MAXIMUS akan muncul di layar HP seperti aplikasi biasa

Sudah berhasil install?
```

### Langkah 3: Core Flow Tutorial (3 menit)
```
Fitur utama yang perlu Bapak test:

1. PROFIT ENGINE (Halaman utama):
   - Buat order baru: tap tombol (+)
   - Isi harga order, jarak, tipe komisi
   - Submit
   - Order akan muncul di daftar

2. EXPENSE TRACKING:
   - Tap menu "Expenses"
   - Catat bensin, makan, parkir, dll
   - Isi jumlah dan kategori
   - Submit

3. INSIGHT:
   - Tap menu "Insight"
   - Lihat grafik pendapatan harian, pengeluaran, laba bersih

4. SYNC (Penting!):
   - App akan auto-sync tiap beberapa menit
   - Kalau offline, data tersimpan lokal, nanti sync otomatis saat online
   - Cek banner di atas: kalau ada tulisan "Offline" atau "Syncing", tunggu sampai selesai

5. DELETE ORDER (PENTING untuk test):
   - Pilih order yang salah input
   - Tap icon delete (tong sampah)
   - Order akan soft-delete, tidak hilang permanen
```

### Langkah 4: Cara Lapor Bug (2 menit)
```
Kalau ada masalah/bug:

1. Buka menu "Profile" di navigation bar bawah
2. Scroll ke bawah sampai bagian "Diagnostics"
3. Tap tombol "Laporkan via WhatsApp"
4. WhatsApp akan terbuka otomatis ke nomor admin (6285953937946)
5. Ada template laporan yang sudah terisi, Bapak tinggal isi:
   - Apa yang Bapak lakukan sebelum error?
   - Apa yang terjadi (error/salah)?
   - Apa yang seharusnya terjadi?
6. Kirim screenshot kalau bisa
7. Kirim pesan

PENTING: Selalu pakai tombol "Laporkan via WhatsApp" agar saya dapat data diagnostik lengkap.
```

### Langkah 5: Rules untuk Tester (1 menit)
```
Rules sederhana:

1. Pakai app seperti biasa untuk catat orderan sehari-hari
2. Kalau ada bug, LANGSUNG lapor via tombol WhatsApp (jangan tunggu)
3. Sertakan screenshot kalau bisa
4. Sebutkan jam dan route/lokasi saat error terjadi
5. Jangan panik kalau ada error, data tidak akan hilang (ada backup)

Kalau ada pertanyaan, langsung WA saya ya Pak.

Terima kasih!
```

---

## Tester Rules (Ringkasan)

Berikan rules ini ke semua beta tester:

1. **Lapor pakai template**: Selalu pakai tombol "Laporkan via WhatsApp" di app, jangan lapor manual tanpa diagnostics.
2. **Sertakan screenshot**: Kalau ada error visual, kirim screenshot.
3. **Sebutkan konteks**: Jam berapa, lokasi/route mana, sedang apa sebelum error terjadi.
4. **Test semua fitur**: Minimal sekali test: buat order, catat expense, delete order, lihat insight, test offline/online sync.
5. **Jangan hapus app**: Jangan uninstall app selama periode beta, karena data lokal penting untuk debugging.

---

## Rollback Decision Tree

Jika ada masalah di production:

### S0 (Data Loss)
- **Tindakan:** ROLLBACK SEGERA + hotfix
- **Timeline:** < 1 jam
- **Notifikasi:** Kirim pesan ke semua tester bahwa app sedang maintenance

### S1 (Core Flow Broken) dengan frekuensi tinggi
- **Tindakan:** ROLLBACK atau HOTFIX dalam 24 jam
- **Timeline:** < 24 jam
- **Notifikasi:** Kirim pesan ke tester yang terdampak

### S2 (Degraded) dengan frekuensi tinggi
- **Tindakan:** Fix di next release (tidak perlu rollback)
- **Timeline:** < 1 minggu
- **Notifikasi:** Optional

---

## Graduation Criteria (Stage → GA)

Untuk lulus dari Wide Beta (Stage 3) ke General Availability (GA):

- App stabil minimal 1 bulan tanpa S0 atau S1 critical
- Crash rate < 0.5% (hitung manual dari laporan)
- Zero data loss
- Feedback: > 80% driver satisfied
- Documentation lengkap (user guide, FAQ)
- Support channel siap (WhatsApp admin + FAQs)

---

## Contacts

**Admin WhatsApp:** 6285953937946  
**Maintainer:** Pak (solo maintainer)

**Catatan:** Dokumen ini adalah living document. Update sesuai lesson learned dari tiap stage.
