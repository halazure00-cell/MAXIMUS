# WhatsApp Report QA Checklist

## Manual Test Checklist for Beta Testers

### Setup
- [ ] Buka aplikasi MAXIMUS di HP Android
- [ ] Sudah login dengan akun valid
- [ ] WhatsApp sudah terinstall di HP

---

## Test 1: Copy Diagnostics dari ProfileSettings

### Langkah:
1. [ ] Buka halaman **Profile** (tap icon Profile di bottom nav)
2. [ ] Scroll ke bawah hingga menemukan section **Diagnostics**
3. [ ] Tap tombol **"Copy Diagnostics"**

### Expected:
- [ ] Muncul toast: "Diagnostics berhasil disalin!"
- [ ] Buka app Notes/catatan, paste (long press → Paste)
- [ ] Data JSON diagnostics muncul
- [ ] Periksa field berikut ada di JSON:
  - [ ] `app.version`
  - [ ] `device.userAgent`
  - [ ] `runtime.route`
  - [ ] `sync.status`
  - [ ] `dbCounts`
  - [ ] `settings`
  - [ ] `errors.recent` (array)
- [ ] TIDAK ADA field sensitif:
  - [ ] Tidak ada `token` atau `session`
  - [ ] Tidak ada `email` atau `phone`
  - [ ] Tidak ada koordinat GPS lengkap
  - [ ] Tidak ada isi data order/expense

### Fallback (jika clipboard gagal):
- [ ] Muncul modal dengan JSON text
- [ ] Bisa klik di dalam textarea untuk select all
- [ ] Tap "Salin" → berhasil copy
- [ ] Tap "Tutup" → modal tertutup

---

## Test 2: Laporkan via WhatsApp dari ProfileSettings

### Langkah:
1. [ ] Buka halaman **Profile**
2. [ ] Scroll ke **Diagnostics**
3. [ ] Tap tombol **"Laporkan via WhatsApp"**

### Expected:
- [ ] WhatsApp terbuka otomatis
- [ ] Chat terbuka ke nomor **6285953937946**
- [ ] Pesan sudah prefilled dengan template:
  ```
  🐛 LAPORAN BUG MAXIMUS
  📅 Tanggal/Jam: [timestamp]
  📱 HP/Android: [userAgent]
  📍 Halaman/Route: [route]
  ⚠️ Kode error (jika ada): [code]
  
  ✏️ Langkah kejadian (singkat):
  (Tulis di sini)
  
  ❌ Yang terjadi:
  (Tulis di sini)
  
  ✅ Yang seharusnya:
  (Tulis di sini)
  
  ---
  🔍 DIAGNOSTICS (JSON):
  [snapshot JSON]
  ```
- [ ] Timestamp dalam format Indonesia (id-ID)
- [ ] Route sesuai dengan halaman saat ini (e.g., `/profile`)
- [ ] JSON snapshot ada di bagian bawah
- [ ] Pesan bisa diedit (user bisa isi detail)
- [ ] User bisa kirim pesan ke admin

### Fallback (jika popup blocked):
- [ ] Jika popup blocked, sistem akan fallback ke `window.location.href`
- [ ] WhatsApp tetap terbuka dengan pesan prefilled

---

## Test 3: Clear Logs

### Langkah:
1. [ ] Buka halaman **Profile**
2. [ ] Scroll ke **Diagnostics**
3. [ ] Tap tombol **"Clear Logs"**

### Expected:
- [ ] Muncul toast: "Log error telah dihapus"
- [ ] Setelah clear, tap "Copy Diagnostics" lagi
- [ ] Field `errors.recent` di JSON sekarang kosong `[]`

---

## Test 4: Copy dari ErrorBoundary (Crash Screen)

### Langkah (memicu crash untuk test):
1. [ ] Inject error untuk test (bisa pakai React DevTools atau trigger error)
   - Atau tunggu error natural terjadi
2. [ ] Aplikasi crash → muncul layar error

### Expected:
- [ ] Layar menampilkan:
  - [ ] Judul: "Aplikasi mengalami gangguan"
  - [ ] **Kode Error** (e.g., "RLS_DENIED", "UNKNOWN")
  - [ ] Error message short (dalam bahasa Indonesia)
  - [ ] Tombol "Muat Ulang"
  - [ ] Tombol "Copy"
  - [ ] Tombol "WhatsApp"
- [ ] Tap tombol **"Copy"**
  - [ ] Toast atau indicator "Copied!"
  - [ ] Paste ke catatan → JSON diagnostics muncul
  - [ ] JSON berisi field `crashError` dengan detail error
- [ ] **Production mode**: Stack trace TIDAK ditampilkan
- [ ] **Dev mode**: Stack trace ditampilkan (partial)

---

## Test 5: WhatsApp dari ErrorBoundary

### Langkah:
1. [ ] Trigger error crash lagi (sama seperti Test 4)
2. [ ] Tap tombol **"WhatsApp"**

### Expected:
- [ ] WhatsApp terbuka ke 6285953937946
- [ ] Pesan prefilled dengan template bug report
- [ ] JSON snapshot berisi field `crashError`:
  ```json
  "crashError": {
    "message": "...",
    "code": "UNKNOWN",
    "type": "unknown",
    "messageShort": "..."
  }
  ```
- [ ] User bisa kirim laporan

---

## Test 6: Works Offline

### Langkah:
1. [ ] Aktifkan **Airplane Mode** atau matikan WiFi/Data
2. [ ] Buka halaman **Profile** → **Diagnostics**
3. [ ] Tap **"Copy Diagnostics"**

### Expected:
- [ ] Copy diagnostics MASIH BERFUNGSI (data di-copy)
- [ ] JSON snapshot field `runtime.online` = `false`
- [ ] Tap **"Laporkan via WhatsApp"**
  - [ ] WhatsApp terbuka (tapi user harus online untuk kirim pesan)
  - [ ] Pesan prefilled tetap muncul

---

## Test 7: Large Message Handling (Shortening)

### Langkah:
1. [ ] Buat banyak error log (misalnya trigger 20 error berbeda)
2. [ ] Buka **Profile** → **Diagnostics**
3. [ ] Tap **"Laporkan via WhatsApp"**

### Expected:
- [ ] Jika pesan > 7000 karakter, sistem otomatis shorten:
  - [ ] Tetap ada header template
  - [ ] JSON snapshot diringkas (hanya 5 error recent, bukan 20)
  - [ ] Field `hints` dihapus jika terlalu panjang
  - [ ] Pesan tetap bisa dibuka di WhatsApp
- [ ] Tidak ada crash atau error

---

## Test 8: No Sensitive Data Verification

### Langkah:
1. [ ] Copy diagnostics (via Profile atau ErrorBoundary)
2. [ ] Periksa JSON text yang di-copy

### Expected:
**TIDAK ADA** field berikut di JSON:
- [ ] ❌ `token`, `access_token`, `refresh_token`
- [ ] ❌ `session`, `sessionId`
- [ ] ❌ `email`, `phone`, `phoneNumber`
- [ ] ❌ `password`, `apiKey`
- [ ] ❌ Koordinat GPS lengkap (`lat`, `lon`, `latitude`, `longitude`)
- [ ] ❌ Isi data order: `customer_name`, `order_amount`, dll.
- [ ] ❌ Isi data expense: `expense_type`, `amount`, dll.

**HANYA ADA** field berikut:
- [ ] ✅ `app`: name, version, mode
- [ ] ✅ `device`: userAgent, language, tzOffsetMinutes
- [ ] ✅ `runtime`: route, online, visibilityState
- [ ] ✅ `sync`: status, counts, lastSyncError (classified)
- [ ] ✅ `dbCounts`: jumlah record saja (tidak ada isi)
- [ ] ✅ `settings`: darkMode, target, commission, dll. (tidak sensitif)
- [ ] ✅ `errors.recent`: array error (hanya code + message)

---

## Test 9: Sync Error Logging Integration

### Langkah:
1. [ ] Trigger sync error (misalnya: update data dengan RLS deny)
   - Bisa pakai dev tools atau sengaja edit data yang tidak berhak
2. [ ] Tunggu sync error terjadi
3. [ ] Buka **Profile** → **Diagnostics** → **Copy Diagnostics**

### Expected:
- [ ] JSON snapshot field `errors.recent` berisi error sync yang baru saja terjadi
- [ ] Error entry berisi:
  - [ ] `code`: "RLS_DENIED" atau error code lain
  - [ ] `messageShort`: dalam bahasa Indonesia
  - [ ] `route`: halaman saat error terjadi
  - [ ] `context.type`: "conflict" atau "operation_failed"
  - [ ] `context.table`: nama tabel (e.g., "orders")

---

## Definition of Done

Semua test di atas **PASS** ✅:
- [ ] Copy diagnostics works (clipboard + fallback modal)
- [ ] WhatsApp button opens chat with prefilled message
- [ ] Message includes route, timestamp, JSON snapshot
- [ ] No sensitive data in snapshot
- [ ] Works offline (diagnostics copy & WA open)
- [ ] Large message handling (shortening)
- [ ] ErrorBoundary shows error code + buttons
- [ ] Sync errors logged to diagnostics
- [ ] Clear logs works

---

## Known Issues / Limitations

1. **WhatsApp URL Limit**: Ada batasan panjang URL WhatsApp (~7000 chars). Sistem sudah handle dengan shortening otomatis.
2. **Clipboard Permissions**: Di beberapa browser/device, clipboard bisa gagal. Ada fallback modal manual copy.
3. **Popup Blocker**: Beberapa browser block `window.open()`. Ada fallback ke `window.location.href`.

---

## Contact

Jika ada bug atau masalah saat testing, laporkan ke:
- **WhatsApp Admin**: 6285953937946
- Gunakan fitur "Laporkan via WhatsApp" di app! 😊
