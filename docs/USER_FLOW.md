# User Flow

## 1. Flow Utama: Pembuatan Transaksi
```text
Dashboard
   ↓
Klik "Buat Transaksi"
   ↓
Masukkan Data Customer (Nama, No. HP)
   ↓
Pilih Tipe Transaksi
   ├── Kiloan
   ├── Kiloan + Satuan
   └── Satuan
   ↓
Input Detail Transaksi
   ├── Kiloan: Input Berat (kg), Harga/kg, Total Item (pcs), dan Rincian Pakaian (opsional, tanpa harga).
   └── Satuan: Input Nama Item, Qty, Harga Satuan.
   ↓
Sistem Menghitung Total Harga Secara Otomatis
   ↓
Pilih Status Pembayaran (Belum Bayar / Lunas)
   ↓
Simpan Transaksi
   ↓
Tampilkan Dialog/Modal Berhasil
   ↓
Cetak Nota Fisik (Rangkap 3 Print Layout)
   ↓
Selesai, kembali ke Dashboard/Daftar Transaksi
```

## 2. Flow Update Status
```text
Daftar Transaksi
   ↓
Cari Transaksi / Filter (cth: "Belum Bayar" atau "Selesai")
   ↓
Klik Detail Transaksi
   ↓
Ubah Status Laundry (Diterima -> Diproses -> Selesai -> Diambil)
   ATAU
Ubah Status Pembayaran (Belum Bayar -> Lunas)
   ↓
Simpan Perubahan
```

## 3. Flow Laporan (Owner)
```text
Menu Laporan
   ↓
Pilih Periode (Hari Ini / Minggu Ini / Bulan Ini / Custom)
   ↓
Lihat Rekapitulasi (Total Transaksi, Omzet, Lunas, Belum Bayar)
   ↓
Klik "Export CSV"
   ↓
File CSV terunduh ke komputer lokal
```
