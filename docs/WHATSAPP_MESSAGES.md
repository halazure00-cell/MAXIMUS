# WhatsApp Messages - MAXIMUS Beta

Ready-to-copy WhatsApp scripts untuk komunikasi dengan beta testers. Semua pesan dalam Bahasa Indonesia, tanpa emoji (sesuai requirement).

---

## 1. Invite Message (Initial Invitation)

Gunakan message ini untuk mengundang driver menjadi beta tester:

```
UNDANGAN BETA TESTER MAXIMUS

Halo Pak [Nama],

Saya ingin mengundang Bapak untuk jadi beta tester aplikasi MAXIMUS.

MAXIMUS adalah aplikasi khusus driver Maxim untuk membantu:
- Catat pendapatan dan pengeluaran harian
- Hitung laba bersih otomatis (setelah komisi dan biaya)
- Lihat insight finansial (grafik, tren, performa)
- Strategi lokasi orderan (peta panas)

Aplikasi ini masih tahap testing, jadi mungkin ada bug atau error. Makanya Bapak diminta bantu test dan lapor kalau ada masalah.

KEUNTUNGAN JADI BETA TESTER:
- Gratis pakai aplikasi selamanya (tidak ada biaya)
- Dapat akses fitur baru lebih dulu
- Bantu shape aplikasi sesuai kebutuhan driver
- Support langsung dari developer via WhatsApp

KOMITMEN YANG DIMINTA:
- Pakai aplikasi untuk catat orderan setiap hari (minimal 3 hari dalam seminggu)
- Lapor bug kalau ada error (pakai tombol WhatsApp di app, mudah)
- Kasih feedback jujur (apa yang bagus, apa yang perlu diperbaiki)

Periode beta: [Durasi, misal: 2-4 minggu]

Apakah Bapak bersedia? Kalau ya, saya akan kirim instruksi cara install dan pakai aplikasinya.

Terima kasih!
```

---

## 2. Onboarding Message (After Acceptance)

Kirim message ini setelah driver setuju jadi beta tester:

```
CARA INSTALL & PAKAI MAXIMUS

Halo Pak [Nama],

Terima kasih sudah bersedia jadi beta tester MAXIMUS.

Berikut panduan singkat install dan pakai aplikasi:

--- INSTALL PWA ---

1. Buka browser Chrome di HP Android
2. Ketik link ini: [URL production, misal: https://maximus.vercel.app]
3. Login pakai email atau nomor HP Bapak
4. Setelah masuk, tap menu (titik tiga) di pojok kanan atas Chrome
5. Pilih "Tambahkan ke layar utama" atau "Install app"
6. Icon MAXIMUS akan muncul di layar HP seperti aplikasi biasa

--- FITUR UTAMA ---

1. PROFIT ENGINE (Halaman utama)
   - Buat order baru: tap tombol (+)
   - Isi harga order, jarak, tipe komisi
   - Submit, order akan muncul di daftar

2. EXPENSES (Menu bawah)
   - Catat pengeluaran: bensin, makan, parkir, dll
   - Tap (+), isi jumlah dan kategori, submit

3. INSIGHT (Menu bawah)
   - Lihat grafik pendapatan harian
   - Lihat pengeluaran dan laba bersih
   - Analisis performa

4. SYNC (Otomatis)
   - App akan auto-sync ke cloud tiap beberapa menit
   - Kalau offline, data tersimpan lokal, nanti sync otomatis saat online
   - Cek banner di atas: kalau ada tulisan "Syncing..." tunggu sampai selesai

--- CARA LAPOR BUG ---

Kalau ada masalah atau error:

1. Buka menu "Profile" di navigation bar bawah
2. Scroll ke bawah sampai bagian "Diagnostics"
3. Tap tombol "Laporkan via WhatsApp"
4. WhatsApp akan terbuka otomatis ke nomor saya
5. Ada template laporan yang sudah terisi
6. Bapak tinggal isi:
   - Apa yang Bapak lakukan sebelum error?
   - Apa yang terjadi (error/salah)?
   - Apa yang seharusnya terjadi?
7. Kirim screenshot kalau bisa
8. Kirim pesan

PENTING: Selalu pakai tombol "Laporkan via WhatsApp" di app agar saya dapat data diagnostik lengkap.

--- RULES ---

1. Pakai app seperti biasa untuk catat orderan sehari-hari
2. Kalau ada bug, LANGSUNG lapor (jangan tunggu)
3. Sertakan screenshot kalau bisa
4. Jangan hapus/uninstall app selama periode beta

Kalau ada pertanyaan, langsung WA saya ya Pak.

Selamat mencoba MAXIMUS!
```

---

## 3. How to Report Bug (Reminder)

Gunakan message ini untuk remind driver cara lapor bug (jika driver lapor manual tanpa diagnostics):

```
CARA LAPOR BUG YANG BENAR

Halo Pak [Nama],

Terima kasih sudah lapor masalahnya.

Supaya saya bisa bantu lebih cepat, tolong lapor pakai fitur di app ya Pak:

1. Buka menu "Profile" di app MAXIMUS
2. Scroll ke bawah sampai bagian "Diagnostics"
3. Tap tombol "Laporkan via WhatsApp"
4. WhatsApp akan terbuka dengan template laporan
5. Isi detail masalahnya (apa yang Bapak lakukan, apa yang error, apa yang seharusnya terjadi)
6. Kirim screenshot kalau ada
7. Kirim pesan

Fitur ini akan otomatis kirim data diagnostik yang saya butuhkan untuk debug masalahnya.

Terima kasih Pak!
```

---

## 4. Release Announcement Message

Gunakan template ini untuk announce update/release baru:

```
UPDATE MAXIMUS v[X.X.X]

Halo Pak,

MAXIMUS sudah diupdate ke versi [X.X.X].

YANG DIPERBAIKI:
- [Bug fix 1, misal: Perbaiki error RLS saat hapus expense]
- [Bug fix 2, misal: Perbaiki sync lambat saat offline]
- [Improvement 1, misal: Performa insight lebih cepat]

CARA UPDATE:

1. Tutup app MAXIMUS
2. Buka lagi dari browser atau icon di layar HP
3. Atau: Settings browser Chrome → Privasi → Hapus data browsing → pilih "Gambar dan file cache" untuk maximus.vercel.app → Hapus data
4. Buka app lagi

App akan otomatis load versi terbaru.

Kalau ada masalah setelah update, langsung lapor ya Pak.

Terima kasih!
```

---

## 5. Request More Info Message

Gunakan message ini jika laporan bug kurang lengkap atau perlu info tambahan:

```
REQUEST INFO TAMBAHAN

Halo Pak [Nama],

Terima kasih atas laporannya.

Untuk bantu saya debug masalah ini, bisa minta tolong info tambahan:

1. Screenshot layar saat error terjadi (kalau ada)
2. Langkah detail sebelum error:
   - Bapak lagi di halaman mana? (Profit Engine, Expenses, Insight, atau lainnya)
   - Apa yang Bapak klik atau lakukan tepat sebelum error?
   - Apakah error terjadi setiap kali Bapak lakukan hal yang sama? (selalu error atau kadang-kadang?)
3. Jam berapa error terjadi?
4. Apakah koneksi internet Bapak stabil saat itu?

Atau kalau bisa, tolong coba reproduce error lagi, lalu langsung tap tombol "Laporkan via WhatsApp" di menu Profile → Diagnostics.

Terima kasih Pak!
```

---

## 6. Bug Fixed Notification

Gunakan message ini untuk notify driver bahwa bug yang dilaporkan sudah diperbaiki:

```
BUG SUDAH DIPERBAIKI

Halo Pak [Nama],

Masalah yang Bapak laporkan kemarin ([deskripsi singkat, misal: "error saat hapus expense"]) sudah diperbaiki di versi [X.X.X].

Silakan update app:
1. Tutup app MAXIMUS
2. Buka lagi dari icon di layar HP
3. Atau refresh browser (swipe down untuk reload)

Kalau masih ada masalah yang sama setelah update, langsung lapor lagi ya Pak.

Terima kasih atas laporannya!
```

---

## 7. Thank You Message (After Beta Period)

Gunakan message ini untuk ucapan terima kasih setelah beta period selesai:

```
TERIMA KASIH BETA TESTER

Halo Pak [Nama],

Periode beta MAXIMUS sudah selesai.

Terima kasih banyak atas partisipasi Bapak sebagai beta tester. Feedback dan laporan bug dari Bapak sangat membantu untuk membuat MAXIMUS lebih stabil dan berguna.

MAXIMUS sekarang sudah siap untuk rilis umum (General Availability).

Bapak bisa terus pakai aplikasi ini gratis selamanya sebagai tanda terima kasih atas kontribusi Bapak.

Fitur baru yang akan datang:
- [Fitur 1]
- [Fitur 2]
- [Fitur 3]

Kalau ada masalah atau saran, Bapak masih bisa hubungi saya via WhatsApp.

Sekali lagi, terima kasih banyak Pak!

Semoga MAXIMUS membantu meningkatkan pendapatan Bapak.
```

---

## 8. Rollback Notification

Gunakan message ini jika harus rollback deployment:

```
ROLLBACK SEMENTARA

Halo Pak,

MAXIMUS sementara dikembalikan ke versi sebelumnya karena ada masalah teknis di update terbaru.

Kami sedang perbaiki masalahnya dan akan update lagi segera.

YANG PERLU DILAKUKAN:
1. Tutup app MAXIMUS
2. Buka lagi dari icon di layar HP atau browser
3. App akan otomatis kembali ke versi sebelumnya yang stabil

Mohon maaf atas ketidaknyamanannya.

Data Bapak aman, tidak ada yang hilang.

Terima kasih atas pengertiannya!
```

---

## 9. Hotfix Notification

Gunakan message ini untuk notify hotfix urgent:

```
HOTFIX URGENT v[X.X.X]

Halo Pak,

Ada perbaikan penting (hotfix) untuk masalah [deskripsi singkat, misal: "data hilang saat sync"].

PENTING: Silakan update app segera.

Cara update:
1. Tutup app MAXIMUS
2. Buka lagi dari icon di layar HP
3. Atau: Clear cache browser untuk maximus.vercel.app
4. Buka app lagi

Versi baru: v[X.X.X]

Kalau ada masalah setelah update, langsung lapor ya Pak.

Terima kasih!
```

---

## 10. Weekly Update Message (Optional)

Gunakan message ini untuk kirim update mingguan ke testers (optional):

```
UPDATE MINGGUAN BETA

Halo Pak,

Update MAXIMUS minggu ini:

STATISTIK:
- Total laporan bug: [X]
- Bug yang sudah diperbaiki: [Y]
- Bug sedang dikerjakan: [Z]

TOP 3 BUG YANG DIPERBAIKI:
1. [Bug 1]
2. [Bug 2]
3. [Bug 3]

YANG SEDANG DIKERJAKAN:
1. [Issue 1]
2. [Issue 2]

Terima kasih atas laporan dan feedback dari Bapak semua.

Kalau ada masalah baru, langsung lapor ya Pak.

Semangat ngojek!
```

---

## 11. Stage Graduation Message

Gunakan message ini saat lulus dari satu stage ke stage berikutnya (misal: Stage 1 → Stage 2):

```
BETA STAGE [X] SELESAI

Halo Pak,

Kabar baik!

Beta testing MAXIMUS Stage [X] sudah selesai dengan hasil yang bagus.

HASIL STAGE [X]:
- Total bug ditemukan: [X]
- Bug yang diperbaiki: [Y]
- Stabilitas: [misal: "sangat stabil, tidak ada data loss"]

Bapak sekarang masuk ke Stage [X+1] bersama [jumlah] driver lainnya.

TIDAK ADA PERUBAHAN untuk Bapak:
- Tetap pakai app seperti biasa
- Tetap lapor bug kalau ada
- Tetap gratis

Yang berubah: Akan ada lebih banyak driver yang ikut test, jadi app akan lebih teruji.

Terima kasih atas kontribusi Bapak di Stage [X]!

Mari lanjut ke Stage [X+1]!
```

---

## 12. Inactive Tester Reminder

Gunakan message ini untuk remind tester yang tidak aktif (tidak pakai app atau tidak lapor):

```
REMINDER BETA TESTER

Halo Pak [Nama],

Sudah lama tidak ada kabar dari Bapak.

Apakah masih pakai aplikasi MAXIMUS?

Kalau ada masalah atau kesulitan pakai app, boleh langsung WA saya.

Kalau sudah tidak pakai app, tolong konfirmasi ya Pak supaya saya bisa update daftar beta tester.

Terima kasih!
```

---

## Usage Tips

1. **Personalize:** Selalu ganti `[Nama]`, `[X.X.X]`, `[URL]`, dll dengan data actual
2. **Copy-paste safe:** Semua message sudah formatted plain text, bisa langsung copy-paste ke WhatsApp
3. **Adjust tone:** Sesuaikan tone sesuai hubungan dengan driver (formal atau informal)
4. **Add context:** Tambah context spesifik jika perlu (misal: "Bug yang Bapak laporkan kemarin tentang heatmap...")
5. **Group vs Individual:** Untuk announcement umum (release, rollback, weekly update), bisa kirim ke grup WhatsApp. Untuk laporan bug spesifik, kirim individual.

---

## WhatsApp Admin Number

**Nomor Admin:** 6285953937946

Pastikan nomor ini sudah tercantum di:
- `src/lib/diagnostics.js` line 405 (sudah correct)
- Dokumentasi onboarding
- Semua template pesan

---

## Message Frequency Guideline

**Jangan spam testers:**
- Max 1 announcement per day
- Weekly update: optional, max 1x per minggu
- Bug fix notification: hanya untuk S0/S1 yang affect banyak user
- Hotfix notification: hanya untuk urgent hotfix

**Do send:**
- Release announcement (setiap major/minor release)
- Rollback notification (urgent)
- Hotfix notification (urgent)
- Bug fixed notification (jika tester yang lapor ingin tau)

**Don't send:**
- Daily stats (too much noise)
- Minor bug fix yang tidak affect tester
- Internal technical details

---

**Catatan:** Semua message template ini adalah starting point. Sesuaikan dengan style komunikasi Bapak dan relationship dengan driver. Yang penting: jelas, sopan, dan actionable.
