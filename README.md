# POS Es Teh

Aplikasi Point of Sale (POS) berbasis web untuk manajemen penjualan dan pengeluaran harian bisnis minuman. Proyek ini dikembangkan untuk keperluan pribadi.

## Teknologi
- Frontend: React (Vite)
- Backend & Database: Supabase (PostgreSQL & Authentication)
- Styling: Vanilla CSS

## Fitur Utama
- **Manajemen Akses**: Terdiri dari dua peran pengguna (Owner dan Kasir).
- **Verifikasi OTP**: Pengamanan login untuk akun kasir baru menggunakan kode OTP via email.
- **Halaman Kasir**: Sistem pencatatan pesanan (keranjang), checkout (Tunai & QRIS/Transfer), cetak struk transaksi, dan pencatatan pengeluaran harian.
- **Halaman Owner**: Dashboard analitik pendapatan, manajemen produk (tambah/edit/hapus), riwayat transaksi, laporan harian/bulanan yang dapat dicetak menjadi PDF, serta manajemen akun pengguna.

## Cara Menjalankan Proyek

1. Clone repositori ke komputer lokal:
   ```bash
   git clone [https://github.com/Syaekhul/teh-rumahan-pos.git](https://github.com/Syaekhul/teh-rumahan-pos.git)
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd teh-rumahan-pos
   ```
3. Instal semua dependensi:
   ```bash
   npm install
   ```
4. Buat file .env di folder utama (root) dan tambahkan kredensial Supabase berikut:
   ```bash
   VITE_SUPABASE_URL=url_proyek_supabase_anda
   VITE_SUPABASE_KEY=anon_key_supabase_anda
   ```
5. Jalankan Aplikasinya:
   ```bash
   npm run dev
   ```
