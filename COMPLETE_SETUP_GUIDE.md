# Setup Lengkap: Migrasi Database + Geocoding Strategic Spots

Ada 3 tahap yang harus diselesaikan untuk fitur Heatmap/Strategic Spots berfungsi sempurna:

## **Tahap 1: Migrasi Database (Tambah Kolom)**

### Opsi A: Via Supabase Dashboard (Paling Mudah)
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project: `erfjhbrsttzkvggksdhx`
3. Menu **SQL Editor** → **New Query**
4. Copy-paste kode dari file `RUN_MIGRATION_MANUALLY.md`
5. Klik **Run** (tombol hijau)

### Opsi B: Via CLI (Jika Anda punya akses)
```bash
# Install Supabase CLI (jika belum)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref erfjhbrsttzkvggksdhx

# Jalankan migration
supabase db push
```

---

## **Tahap 2: Jalankan Script Geocoding**

Script ini akan mengquery Google Places API untuk setiap 100 lokasi strategis dan mengisi koordinat latitude/longitude.

### Persiapan:
1. **Dapatkan SUPABASE SERVICE ROLE KEY:**
   - Buka [Supabase Settings > API](https://supabase.com/dashboard/project/erfjhbrsttzkvggksdhx/settings/api)
   - Cari **"Service Role"** secret key (bukan ANON key!)
   - Copy key tersebut

2. **Dapatkan GOOGLE PLACES API KEY:**
   - Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Buat API key atau gunakan yang sudah ada
   - Pastikan **Google Places API** sudah enabled di project

### Jalankan Script:
```bash
# Set environment variables
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
export GOOGLE_PLACES_API_KEY="your-google-places-api-key-here"

# Jalankan script geocoding
bash run-geocoding.sh
```

**Output yang akan Anda lihat:**
```
🚀 Starting geocoding job for strategic_spots...

📍 Found 100 spots to geocode

📦 Processing batch 1...
  ✅ Stasiun Bandung (Hall) → OK
  ✅ Pasar Baru Trade Center → OK
  ✅ Pasar Ciroyom → OK
  ...
  
(proses berlanjut selama 5-10 menit)

📊 GEOCODING SUMMARY
============================================================
✅ Success (OK):   95
⚠️  Not Found:      3
❌ Errors:         2
📍 Total:          100
📈 Success Rate:   95.0%
============================================================

✅ Job completed successfully (>= 90% success rate)
```

---

## **Tahap 3: Verifikasi di Frontend**

Setelah script selesai:

1. **Refresh aplikasi** (Ctrl+F5 atau Cmd+Shift+R)
2. Buka halaman **Insight** → Tab **Spot**
3. Seharusnya Anda akan melihat:
   - ✅ List lokasi strategis (nama + kategori)
   - ✅ Jarak dari posisi Anda saat ini (dalam km)
   - ✅ Jam operasional (start_hour - end_hour)
   - ✅ Rekomendasi berdasarkan heatmap (active + upcoming)

---

## Troubleshooting

### "0 lokasi strategis di Bandung"
**Sebab:** Database migrasi belum dijalankan atau data seed belum masuk
**Solusi:** Jalankan Tahap 1 (migrasi)

### "Script error: Missing env"
**Sebab:** SUPABASE_SERVICE_ROLE_KEY atau GOOGLE_PLACES_API_KEY tidak diset
**Solusi:** Export kedua variable sesuai instruksi di atas

### "Column geocode_status does not exist"
**Sebab:** Migrasi database belum selesai
**Solusi:** Jalankan Tahap 1

### "No results found" untuk beberapa lokasi
**Sebab:** Google Places API tidak menemukan lokasi tersebut
**Solusi:** Normal! Script akan merekam error, dan Anda masih bisa melihat spot (tanpa koordinat) di aplikasi

---

## Checklist Completion

- [ ] Tahap 1 selesai: Database migration executed
- [ ] Tahap 2 selesai: Geocoding script completed
- [ ] Tahap 3 selesai: Frontend menampilkan spots dengan jarak

Setelah semua selesai, fitur **Heatmap/Strategic Spots** akan fully operational! 🎉
