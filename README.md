# MAXIMUS 🚀
**Asisten Finansial & Strategis Cerdas untuk Driver Maxim Modern.**

MAXIMUS adalah aplikasi Progressive Web App (PWA) yang dirancang khusus untuk membantu pengemudi Maxim mengelola keuangan, mengoptimalkan pendapatan, dan memantau performa harian secara profesional. Dengan antarmuka yang modern dan fitur berbasis data, MAXIMUS menjadi partner setia di jalanan.

---

## ✨ Fitur Utama

-   **📈 Profit Engine**: Kalkulator pendapatan cerdas yang membantu Anda menghitung hasil bersih setelah komisi dan biaya operasional secara *real-time*.
-   **🗺️ Smart Strategy Map**: Peta interaktif yang menunjukkan titik-titik strategis untuk mendapatkan orderan lebih optimal menggunakan teknologi Leaflet.
-   **📊 Financial Dashboard**: Visualisasi data pendapatan, pengeluaran, dan efisiensi harian melalui grafik interaktif yang ditenagai oleh Recharts.
-   **💸 Expense Tracking**: Catat pengeluaran operasional maupun pribadi dengan mudah untuk mendapatkan laporan laba rugi yang akurat.
-   **⚡ High Performance PWA**: Instal aplikasi langsung di layar utama smartphone Anda. Ringan, cepat, dan didesain khusus untuk layar OLED agar hemat baterai.
-   **🔐 Secure Authentication**: Keamanan data terjamin dengan integrasi Supabase Auth menggunakan metode Magic Link yang praktis.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun dengan teknologi mutakhir untuk menjamin kecepatan dan keandalan:

-   **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **Motion & Animasi**: [Framer Motion](https://www.framer.com/motion/)
-   **Mapping**: [React Leaflet](https://react-leaflet.js.org/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Memulai (Local Setup)

Ikuti langkah-langkah berikut untuk menjalankan MAXIMUS di perangkat lokal Anda:

### 1. Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) (versi terbaru direkomendasikan).

### 2. Instalasi
Clone repositori ini atau download source codenya, lalu jalankan perintah berikut di terminal:

```bash
# Masuk ke direktori projek
cd MAXIMUS

# Instal dependensi (lebih stabil jika ada package-lock.json)
npm ci
# jika npm ci gagal, gunakan:
# npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di direktori utama dan isi dengan kredensial Supabase Anda:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# URL tujuan redirect magic link (disarankan: domain Vercel/production)
VITE_SITE_URL=https://your-production-domain
```

> **Catatan Supabase**: Database schema dan migrations dikelola melalui folder `supabase/migrations/`. File SQL di folder `legacy_sql/` hanya untuk arsip dan tidak digunakan dalam produksi.

### 4. Menjalankan Aplikasi
Jalankan server pengembangan:

```bash
npm run dev
```
Buka browser dan akses alamat yang tertera (biasanya `http://localhost:5173`).

---

## 🌐 Develop in Codespaces

MAXIMUS mendukung development langsung dari browser menggunakan GitHub Codespaces.

### Quick Start
1. Klik tombol **Code** → **Codespaces** → **Create codespace on main**
2. Tunggu container setup selesai (dependency akan otomatis ter-install via `npm ci`)
3. Buat file `.env` (jangan commit) dengan environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Disarankan isi dengan domain production (Vercel) agar Magic Link stabil di HP
   VITE_SITE_URL=https://your-production-domain
   ```
4. Jalankan development server (wajib pakai host 0.0.0.0 agar bisa dibuka dari browser/HP):
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
5. Buka tab **Ports** → cari port 5173 → klik ikon globe / "Open in Browser"

### Tips (Mobile Friendly)
- Jika Chrome di HP sering crash, tutup tab lain dan jalankan agent dalam tugas kecil (1–3 file per run).
- Copilot & ESLint direkomendasikan otomatis lewat `.vscode/extensions.json`.
- Mengapa `VITE_SITE_URL` diarahkan ke domain produksi (Vercel)? Karena Anda login dari HP. Kalau `VITE_SITE_URL` mengarah ke localhost/codespace preview, Anda akan sering "nyangkut" ketika link dibuka dari device yang berbeda. Dengan domain produksi, magic link paling stabil.

---

## 📦 Deployment

Aplikasi ini siap dideploy ke platform cloud seperti **Netlify** atau **Vercel**. Pastikan untuk mengatur *Environment Variables* di dashboard hosting Anda sesuai dengan file `.env`.

---

## 🤝 Kontribusi

Kami sangat terbuka untuk segala bentuk kontribusi! Jika Anda memiliki ide fitur atau menemukan bug, silakan buat *Issue* atau kirimkan *Pull Request*.

### Aturan Penting untuk Kontributor:
- ⚠️ **Jangan pernah commit folder `dist/` ke Git**. Folder ini adalah build artifact dan akan di-generate otomatis saat deployment.
- Pastikan kode Anda lolos ESLint sebelum commit: `npm run lint`
- Verifikasi build sukses: `npm run build`
- CI akan otomatis memeriksa setiap push/PR untuk memastikan kode tidak rusak.

---

## 📜 Lisensi & Harapan
Dibuat dengan ❤️ untuk mendukung komunitas pengemudi di Indonesia agar lebih melek finansial dan efisien dalam bekerja.

**MAXIMUS - Maximizing Your Result.**