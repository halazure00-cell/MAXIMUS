# Panduan Troubleshooting Sinkronisasi Offline-First

## Masalah yang Telah Diperbaiki (v1.1)

### 1. Race Condition pada Import Initial Data
**Gejala:** Data tidak muncul atau muncul berulang kali di tab Riwayat

**Penyebab:** 
- Fungsi `importInitialData` dipanggil berulang kali tanpa guard
- Dependency loop di `useEffect` yang menyebabkan re-render tidak terkontrol

**Solusi yang Diterapkan:**
- Menambahkan `importInProgressRef` untuk mencegah import concurrent
- Menambahkan `hasImportedRef` untuk track apakah data sudah diimport
- Menghapus `importInitialData` dari dependency array useEffect
- Menambahkan fungsi `forceReimport()` untuk manual refresh

### 2. Error Handling yang Kurang
**Gejala:** Aplikasi hang atau crash tanpa error message yang jelas

**Penyebab:** 
- Tidak ada try-catch yang proper di berbagai fungsi
- Tidak ada feedback ke user saat sync gagal

**Solusi yang Diterapkan:**
- Menambahkan comprehensive error handling di semua fungsi sync
- Menambahkan logging yang lebih detail untuk debugging
- Menambahkan return value dari `importInitialData` untuk tracking

### 3. Tidak Ada Mekanisme Force Refresh
**Gejala:** User tidak bisa refresh data secara manual saat stuck

**Solusi yang Diterapkan:**
- Menambahkan fungsi `forceReimport()` di SyncContext
- Dapat dipanggil untuk reset flag dan re-import data

## Cara Debug Masalah Sinkronisasi

### 1. Buka Console Browser
Tekan `F12` atau `Ctrl+Shift+I` dan buka tab Console untuk melihat log:

**Log yang Normal:**
```
[SyncContext] Initializing local database
[SyncContext] Local database initialized  
[SyncContext] Starting auto-sync for user <user_id>
[Riwayat] Import result: {success: true, orders: 10, expenses: 5}
[syncEngine] Pull complete {ordersUpdated: 10, expensesUpdated: 5}
```

**Log yang Bermasalah:**
```
[SyncContext] Failed to initialize local database
Error: IndexedDB not available
```
atau
```
[Riwayat] Error fetching data from cache
```

### 2. Periksa IndexedDB
1. Buka DevTools → Application tab → Storage → IndexedDB
2. Cari database `maximus_local`
3. Periksa stores:
   - `orders_cache` - harus berisi data orders
   - `expenses_cache` - harus berisi data expenses
   - `oplog` - berisi operasi yang menunggu sync
   - `failed_ops` - operasi yang gagal setelah 3x retry
   - `meta` - metadata sync (last_sync_at, sync_status)

### 3. Periksa Network Status
Di SyncStatusBanner, perhatikan:
- **Offline** - Device tidak ada koneksi internet
- **Syncing...** - Sedang melakukan sinkronisasi
- **N pending** - Ada N operasi menunggu untuk di-sync
- **N failed** - Ada N operasi yang gagal setelah 3x retry
- **Synced** - Semua data sudah tersinkronisasi

### 4. Force Reimport (Manual Reset)
Jika data tidak muncul atau stuck:

```javascript
// Buka Console Browser dan jalankan:
// Cara 1: Via React DevTools
// 1. Install React Developer Tools
// 2. Pilih component <SyncProvider>
// 3. Di props, cari dan klik forceReimport()

// Cara 2: Via Console (untuk developer)
// Reset import flag dan trigger reload
localStorage.clear(); // Hati-hati: akan hapus semua data lokal
location.reload();
```

### 5. Clear Local Database (Hard Reset)
Jika masalah persisten:

```javascript
// Di Console Browser:
async function resetDatabase() {
  const db = await window.indexedDB.open('maximus_local');
  db.close();
  await window.indexedDB.deleteDatabase('maximus_local');
  console.log('Database cleared. Please refresh the page.');
  location.reload();
}
resetDatabase();
```

## Monitoring Sync Health

### Metrics yang Harus Dimonitor:
1. **Pending Operations** - Idealnya 0 atau mendekati 0
2. **Failed Operations** - Harus 0, jika >0 ada masalah koneksi/auth
3. **Last Sync Time** - Harus update setiap ~60 detik saat online
4. **Conflicts** - Harus jarang terjadi, jika sering ada masalah multi-device

### Status Sync yang Normal:
- Online: Auto-sync setiap 60 detik
- Offline: Data tersimpan lokal, sync saat online kembali
- Pending Ops: Maksimal 5-10 operasi dalam queue
- Failed Ops: 0

### Red Flags (Tanda Masalah):
- ⚠️ Failed Ops > 5
- ⚠️ Pending Ops > 20
- ⚠️ Last Sync > 5 menit yang lalu (saat online)
- ⚠️ Conflicts > 10 dalam sehari

## Common Error Messages

### "IndexedDB not available"
**Penyebab:** Browser tidak support atau private mode
**Solusi:** Gunakan browser modern (Chrome/Edge/Firefox) dalam mode normal

### "JWT expired" atau "auth error"
**Penyebab:** Session sudah kadaluarsa
**Solusi:** Logout dan login kembali

### "Max retries exceeded"
**Penyebab:** Operasi gagal sync 3x berturut-turut
**Solusi:** 
1. Periksa koneksi internet
2. Periksa Supabase status
3. Cek RLS policies di database

### "Conflict detected"
**Penyebab:** Edit data dari 2 device berbeda
**Solusi:** Data dari server akan dipakai (server-wins strategy)

## Best Practices

### Untuk User:
1. Pastikan koneksi stabil saat melakukan perubahan penting
2. Tunggu sync selesai sebelum close aplikasi
3. Jangan edit data yang sama dari multiple devices secara bersamaan

### Untuk Developer:
1. Selalu cek `isInitialized` sebelum akses IndexedDB
2. Gunakan `try-catch` di semua fungsi async
3. Log setiap operasi penting untuk debugging
4. Test dengan network throttling dan offline mode
5. Monitor failed_ops table secara berkala

## Rollback Plan

Jika perlu kembali ke mode non-offline-first:
1. Comment out `importInitialData` call
2. Direct fetch dari Supabase di `useEffect`
3. Disable syncEngine auto-sync
4. Keep oplog untuk analisis masalah

## Kontak Support
Jika masalah tidak teratasi, kumpulkan:
1. Console log (full output)
2. IndexedDB screenshot
3. Network tab recording
4. Steps to reproduce

Dan buat issue di GitHub dengan label `sync-issue`.
