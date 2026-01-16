# Setup Lengkap: Migrasi & Geocoding (Versi GRATIS)

Panduan ini telah disesuaikan untuk menggunakan **OpenStreetMap (Nominatim)** yang 100% GRATIS dan tidak memerlukan API Key Google.

## **Tahap 1: Migrasi Database (Wajib)**
Fitur ini memerlukan kolom tambahan di database untuk menyimpan koordinat.

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Masuk ke **SQL Editor** → **New Query**
3. Jalankan kode dari file `RUN_MIGRATION_MANUALLY.md`

*(Jika sudah pernah dijalankan sebelumnya, lewati tahap ini)*

---

## **Tahap 2: Jalankan Script Geocoding**

Script ini akan mencari koordinat secara otomatis menggunakan OpenStreetMap.

### Cara Menjalankan:
1.  **Dapatkan SUPABASE SERVICE ROLE KEY:**
    - Buka [Supabase Settings > API](https://supabase.com/dashboard/project/haywceiagliqoqxixaks/settings/api)
    - Cari **"Service Role"** secret key.
    - Copy key tersebut.

2.  **Jalankan Perintah di Terminal:**
```bash
# Set key (Ganti dengan key Anda yang diawali 'ey...')
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUz..."

# Jalankan script
bash run-geocoding.sh
```

**Catatan Penting:**
- Script ini akan berjalan agak lambat (1.5 detik per lokasi) untuk mematuhi aturan penggunaan gratis OpenStreetMap.
- Total waktu untuk 100 lokasi: ±3-4 menit.
- Anda bisa melihat progress bar berjalan di terminal.

---

## **Tahap 3: Selesai!**

Setelah script menampilkan pesan `FINISHED!`:
1. Refresh aplikasi Anda.
2. Menu **Insight** → Tab **Spot** sekarang akan menampilkan:
   - Jarak (km)
   - Status Aktif/Tidak
   - Rekomendasi Spot
