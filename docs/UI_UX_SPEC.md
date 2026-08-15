# UI/UX Specifications

## Design Principles
- **Clean & Modern:** Menggunakan whitespace yang cukup, tipografi modern (misal: Inter/Roboto), warna netral dengan aksen biru/hijau.
- **Minimal:** Hindari dekorasi, gradient, atau animasi yang tidak ada fungsinya.
- **Professional:** Menggunakan font yang jelas terbaca.
- **Speed-Oriented:** Form input bisa dinavigasi dengan tab, kalkulasi otomatis tanpa perlu klik tombol "Hitung".
- **Focus on Data & Action:** Call to Action (CTA) utama dan data (harga, nomor nota) memiliki hierarki visual tertinggi.

## Struktur Layout
- **Sidebar (Kiri):** Lebar statis (sekitar 250px) dengan menu: Dashboard, Transaksi, Laporan, Pengaturan.
- **Topbar (Atas):** Berisi nama aplikasi, jam/tanggal terkini, atau informasi profil singkat.
- **Main Content (Tengah):** Area utama untuk form, tabel, dan dashboard.

## Halaman Detail

### 1. Dashboard
- **Top Metrics:** 4 buah card sederhana (Omzet Hari Ini, Omzet Bulan Ini, Total Transaksi, Piutang/Belum Bayar).
- **Recent Transactions:** Tabel 5 transaksi terakhir untuk akses cepat.
- **Primary CTA:** Tombol "Buat Transaksi" besar berwarna kontras (misal: Primary Blue).

### 2. Transaction Page (Daftar)
- Tabel dengan kolom: No. Nota, Customer, Jenis, Total Harga, Pembayaran, Status Laundry, Action.
- Badge warna untuk status:
  - Pembayaran: Merah (Belum Bayar), Hijau (Lunas)
  - Laundry: Abu-abu (Diterima), Kuning (Diproses), Biru (Selesai), Hijau (Diambil).
- Filter status di atas tabel berupa pills/dropdown.

### 3. Transaction Form
- Dibagi menjadi 2 kolom jika di desktop: Kiri (Customer & Tipe), Kanan (Rincian Kalkulasi).
- **Dynamic Form:** Bagian input item berubah sesuai radio button "Tipe Transaksi".
- Detail item pada Kiloan bersifat opsional, tombol "+ Tambah Detail Pakaian" disembunyikan sampai diklik.

### 4. Detail Transaksi
- View mode (bukan edit form). Tampilan mirip struk digital besar.
- Menampilkan rincian transaksi, total, history status.
- Tombol aksi jelas: "Tandai Lunas", "Ubah Status", "Cetak Nota".

### 5. Print Layout (Nota Fisik)
- Didesain khusus menggunakan CSS `@media print`.
- Menyembunyikan sidebar, topbar, dan tombol.
- Membagi layar menjadi 3 kolom/bagian persis (Customer Copy, Laundry Copy, Archive Copy).
- Menggunakan font monospace atau sans-serif kecil yang tajam untuk printer kasir/printer biasa.
- Hanya mencetak bagian yang relevan (Kiloan saja, Satuan saja, atau keduanya).

## States
- **Empty States:** Pesan yang jelas (misal: "Belum ada transaksi hari ini") beserta ilustrasi sederhana/icon.
- **Loading States:** Walaupun sinkron lokal, beri transisi halus jika melakukan aksi simpan.
- **Error States:** Toast merah muda jika input tidak valid.
- **Confirmation Modal:** Untuk aksi krusial (misal: Menandai Lunas atau Menghapus).
