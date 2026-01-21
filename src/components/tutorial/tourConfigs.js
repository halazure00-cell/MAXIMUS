/**
 * Tour configurations for each page
 * Each tour is an array of steps with:
 * - id: unique identifier
 * - selector: data-tour attribute value to target
 * - title: step title
 * - body: step description
 * - placement: optional tooltip placement (default: auto)
 */

export const homeTourSteps = [
    {
        id: 'home-intro',
        selector: 'home-page',
        title: 'Halaman Home',
        body: 'Di sini Anda bisa mencatat setiap order dan menghitung profit bersih secara real-time.',
    },
    {
        id: 'home-input-price',
        selector: 'home-input-price',
        title: 'Input Harga Order',
        body: 'Masukkan harga yang Anda terima dari customer. Anda juga bisa gunakan tombol cepat di bawah untuk nilai umum.',
    },
    {
        id: 'home-input-distance',
        selector: 'home-input-distance',
        title: 'Input Jarak',
        body: 'Masukkan jarak tempuh dalam kilometer. Ini akan digunakan untuk menghitung biaya bahan bakar.',
    },
    {
        id: 'home-priority-toggle',
        selector: 'home-priority-toggle',
        title: 'Status Prioritas',
        body: 'Toggle ini untuk menandai apakah order ini prioritas (10% komisi) atau biasa (15% komisi).',
    },
    {
        id: 'home-summary',
        selector: 'home-summary',
        title: 'Ringkasan Profit',
        body: 'Lihat estimasi profit bersih setelah dikurangi komisi aplikasi, biaya bahan bakar, dan maintenance.',
    },
    {
        id: 'home-save-button',
        selector: 'home-save-button',
        title: 'Simpan Order',
        body: 'Klik tombol ini untuk menyimpan order. Data akan tersimpan secara offline dan otomatis tersinkronisasi.',
    },
];

export const insightTourSteps = [
    {
        id: 'insight-intro',
        selector: 'insight-page',
        title: 'Halaman Insight',
        body: 'Lihat analisis dan rekomendasi lokasi terbaik berdasarkan data historis Anda dan driver lain.',
    },
    {
        id: 'insight-tabs',
        selector: 'insight-tabs',
        title: 'Filter Waktu',
        body: 'Pilih periode waktu: Pagi, Siang, Sore, atau Malam untuk melihat rekomendasi sesuai jam kerja Anda.',
    },
    {
        id: 'insight-recommendations',
        selector: 'insight-recommendations',
        title: 'Rekomendasi Lokasi',
        body: 'Daftar lokasi strategis dengan estimasi profit dan tingkat kesibukan. Klik untuk melihat detail atau navigasi.',
    },
    {
        id: 'insight-stats',
        selector: 'insight-stats',
        title: 'Statistik Real-time',
        body: 'Lihat rata-rata profit, jumlah order, dan tren dibandingkan periode sebelumnya.',
    },
];

export const historyTourSteps = [
    {
        id: 'history-intro',
        selector: 'history-page',
        title: 'Halaman History',
        body: 'Pantau semua transaksi Anda, review performa harian, dan kelola data dengan mudah.',
    },
    {
        id: 'history-recap',
        selector: 'history-recap',
        title: 'Rekap Harian',
        body: 'Lihat total income, expense, dan setoran bersih untuk hari ini. Data ini di-update real-time.',
    },
    {
        id: 'history-chart',
        selector: 'history-chart',
        title: 'Grafik 7 Hari',
        body: 'Visualisasi tren omzet atau profit Anda dalam 7 hari terakhir untuk analisis performa.',
    },
    {
        id: 'history-transactions',
        selector: 'history-transactions',
        title: 'Daftar Transaksi',
        body: 'Semua order dan expense tercatat di sini. Anda bisa edit atau hapus transaksi jika ada kesalahan.',
    },
    {
        id: 'history-sync-status',
        selector: 'history-sync-status',
        title: 'Status Sinkronisasi',
        body: 'Banner ini menunjukkan status sinkronisasi data. Hijau berarti tersinkron, kuning berarti ada pending.',
    },
];

export const profileTourSteps = [
    {
        id: 'profile-intro',
        selector: 'profile-page',
        title: 'Halaman Profile',
        body: 'Atur preferensi Anda untuk mendapatkan kalkulasi dan rekomendasi yang lebih akurat.',
    },
    {
        id: 'profile-personal',
        selector: 'profile-personal',
        title: 'Informasi Personal',
        body: 'Nama driver dan target harian Anda. Target ini digunakan untuk menghitung pencapaian.',
    },
    {
        id: 'profile-vehicle',
        selector: 'profile-vehicle',
        title: 'Jenis Kendaraan',
        body: 'Pilih jenis motor Anda. Ini mempengaruhi perhitungan efisiensi bahan bakar.',
    },
    {
        id: 'profile-costs',
        selector: 'profile-costs',
        title: 'Biaya Operasional',
        body: 'Atur biaya bahan bakar per km dan biaya maintenance. Angka ini digunakan untuk kalkulasi profit bersih.',
    },
    {
        id: 'profile-reset-tutorial',
        selector: 'profile-reset-tutorial',
        title: 'Reset Tutorial',
        body: 'Jika Anda ingin melihat tutorial lagi, gunakan tombol ini untuk mengatur ulang semua panduan.',
    },
];
