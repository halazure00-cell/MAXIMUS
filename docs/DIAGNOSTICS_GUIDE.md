# Panduan Diagnostics & Bug Report untuk Beta Tester

## Untuk Penguji (Beta Tester)

### Cara Melaporkan Bug

Jika Anda menemukan masalah/bug di aplikasi MAXIMUS, ikuti langkah berikut:

#### 1. Buka Halaman Profile
- Tap menu **Profile** di navigation bar bawah
- Scroll ke bagian bawah sampai menemukan section **Diagnostics**

#### 2. Pilih Cara Lapor Bug

Ada 2 cara melaporkan bug:

**Cara 1: Laporkan langsung via WhatsApp** (Paling mudah)
- Tap tombol **"Laporkan via WhatsApp"**
- Akan terbuka WhatsApp chat ke admin (6285953937946)
- Sudah ada template laporan yang otomatis terisi
- Anda tinggal **lengkapi info berikut**:
  - **Langkah kejadian**: Apa yang Anda lakukan sebelum error?
  - **Yang terjadi**: Apa yang error/salah?
  - **Yang seharusnya**: Apa yang diharapkan terjadi?
  - **Screenshot**: Jika ada, kirim gambar terpisah
- Kirim pesan ke admin

**Cara 2: Copy diagnostics manual**
- Tap tombol **"Copy Diagnostics"**
- Data diagnostik akan tersalin ke clipboard
- Paste ke WhatsApp, email, atau catatan lain
- Kirim ke admin

#### 3. Clear Logs (Opsional)
- Jika sudah melaporkan bug, Anda bisa hapus log error lokal
- Tap tombol **"Clear Logs"**
- Log error akan dibersihkan dari perangkat Anda

### Jika Aplikasi Crash (Error Boundary)

Jika aplikasi tiba-tiba crash dan muncul layar error:

1. **Screenshot** layar error (jika perlu)
2. Tap tombol **"WhatsApp"** untuk langsung lapor ke admin
   - ATAU tap **"Copy"** untuk salin data error
3. Tap **"Muat Ulang"** untuk reload aplikasi
4. Laporkan error ke admin via WhatsApp

### Data yang Aman

**TIDAK ADA DATA SENSITIF** yang dikirim dalam diagnostics:
- ❌ Tidak ada password/token
- ❌ Tidak ada email atau nomor HP
- ❌ Tidak ada koordinat GPS lengkap
- ❌ Tidak ada detail order/pengeluaran
- ✅ Hanya metadata: jumlah record, status sync, kode error, info perangkat

### Catatan Penting

1. **Koneksi Offline**: Diagnostics tetap bisa di-copy meskipun offline. Tapi WhatsApp hanya bisa dibuka, Anda perlu online untuk kirim pesan.
2. **Privasi**: Data diagnostics aman dan tidak mengandung info pribadi.
3. **Ukuran Pesan**: Jika pesan WhatsApp terlalu panjang, akan otomatis dipersingkat (ringkas).
4. **Admin Number**: Laporan dikirim ke **6285953937946** (WhatsApp admin MAXIMUS).

---

## Untuk Developer

### Cara Kerja Diagnostics

#### Error Classification
Semua error diklasifikasi ke kategori:
- **RLS_DENIED**: Permission denied / RLS issue
- **SCHEMA_MISMATCH**: Kolom/table tidak ditemukan
- **NETWORK_OFFLINE**: Koneksi offline/gagal
- **RATE_LIMIT**: 429 Too Many Requests
- **TIMEOUT**: Request timeout
- **UNKNOWN**: Error lain

#### Error Logging
- Error disimpan di `localStorage` dengan key `maximus_error_logs`
- Ring buffer max 20 entries (FIFO)
- Setiap entry berisi: `{ tsIso, route, code, messageShort, context }`

#### Diagnostics Snapshot
Snapshot berisi data NON-SENSITIVE:
- **app**: name, version, mode
- **device**: userAgent, language, tzOffsetMinutes
- **runtime**: nowIso, route, online, visibilityState
- **sync**: status, lastSyncAtIso, pendingOpsCount, failedOpsCount, lastSyncError
- **dbCounts**: orders_cache, expenses_cache, oplog, failed_ops, heatmap_cache
- **settings**: darkMode, dailyTarget, defaultCommission, fuelEfficiency, maintenanceFee, vehicleType
- **errors.recent**: Array of last 20 errors
- **hints**: Guidance strings based on error codes

### API Functions

```js
import { 
  classifyError,
  addErrorLog,
  getErrorLogs,
  clearErrorLogs,
  getDiagnosticsSnapshot,
  buildBugReportMessage,
  openWhatsAppReport
} from '../lib/diagnostics';

// Classify an error
const classified = classifyError(err);
// { type, code, messageShort, retryableHint, ... }

// Add to error log
addErrorLog({
  route: '/orders',
  code: 'RLS_DENIED',
  messageShort: 'Akses ditolak',
  context: { op: 'update', table: 'orders' }
});

// Get all logs
const logs = getErrorLogs();

// Clear logs
clearErrorLogs();

// Get snapshot
const snapshot = await getDiagnosticsSnapshot({
  route: window.location.pathname,
  syncState: syncContext,
  settingsSummary: settings,
});

// Build WhatsApp message
const message = buildBugReportMessage(snapshot);

// Open WhatsApp
const success = openWhatsAppReport(message);
```

### Integration Points

1. **ProfileSettings.jsx**: Diagnostics section with 3 buttons
2. **ErrorBoundary.jsx**: Copy + WhatsApp buttons on crash screen
3. **SyncContext.jsx**: Auto-logs sync conflicts and failed operations

### Testing Checklist

See [WHATSAPP_REPORT_QA.md](./WHATSAPP_REPORT_QA.md) for full QA checklist.

---

## FAQ

**Q: Apakah data saya aman?**  
A: Ya. Diagnostics hanya mengirim metadata (jumlah record, status, kode error). Tidak ada password, email, GPS, atau isi data order/pengeluaran.

**Q: Bisa digunakan saat offline?**  
A: Ya. Diagnostics bisa di-copy saat offline. WhatsApp juga bisa dibuka, tapi Anda perlu online untuk kirim pesan.

**Q: Bagaimana jika popup WhatsApp terblokir?**  
A: Sistem akan coba fallback ke `window.location.href`. Jika tetap gagal, gunakan tombol "Copy Diagnostics" untuk salin manual.

**Q: Apakah log error akan menumpuk?**  
A: Tidak. Log error dibatasi max 20 entries (FIFO). Anda juga bisa clear manual via tombol "Clear Logs".

---

## Kontak Admin

**WhatsApp**: 6285953937946  
**Email**: (hubungi admin via WhatsApp)
