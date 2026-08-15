# MVP Scope

Dokumen ini mendefinisikan batasan rilis pertama (Minimum Viable Product).

## MUST HAVE (Akan Diimplementasikan)
- **Dashboard:** Omzet harian/bulanan, total transaksi, belum bayar, lunas.
- **Customer Management:** Simpan nama dan HP, hitung statistik otomatis dari transaksi.
- **Buat Transaksi:** Dukungan 3 jenis (Kiloan, Kiloan + Satuan, Satuan).
- **Penghitungan Dinamis:** Total item dan grand total langsung terhitung di UI form.
- **Kiloan Details:** Field opsional untuk merinci jenis pakaian tanpa memengaruhi harga.
- **Status Transaksi:** Pembayaran (BELUM BAYAR / LUNAS) & Laundry (DITERIMA / DIPROSES / SELESAI / DIAMBIL).
- **Daftar & Detail Transaksi:** Menampilkan semua riwayat dan filter.
- **Cetak Nota Fisik:** Format CSS print rangkap 3 yang disesuaikan jenis transaksi.
- **Laporan & Export:** Tampilan rekap harian/bulanan dan tombol unduh CSV.
- **Pengaturan Dasar:** Nama laundry, alamat, kontak, preset harga kiloan, dan preset harga satuan.
- **Persistensi Data:** Seluruh data harus disimpan dan dibaca dari `localStorage`.

## OUT OF SCOPE (Tidak Akan Diimplementasikan)
- Payment Gateway (Midtrans, Xendit, Stripe, dll).
- Integrasi e-Wallet / QRIS Dinamis.
- Sistem DP (Down Payment) atau Cicilan.
- Integrasi WhatsApp API untuk notifikasi otomatis ke pelanggan.
- Sistem diskon, kode promo, loyalty point, membership.
- Fitur karyawan (Payroll, Absensi, Multi-user / Role kasir vs owner).
- Inventory Management (stok detergen, pewangi, plastik).
- Multi-cabang (Multi-branch).
- Manajemen Kurir (antar jemput).
- Customer Mobile App / Customer Web Portal untuk cek status mandiri.
- Sistem pemesanan online (Online ordering).
- OCR/AI untuk scan baju.
- Akuntansi kompleks (Jurnal, Buku Besar, Neraca, Laba/Rugi lengkap dengan pengeluaran operasional).

## Review Checklist TAHAP 2
- [x] Mendukung 3 jenis nota.
- [x] `Total Item` ada pada Kiloan dan Satuan.
- [x] Detail item kiloan *tidak mempunyai harga*.
- [x] Status pembayaran eksklusif: BELUM BAYAR & LUNAS.
- [x] Fitur di luar MVP dipastikan *tidak masuk* ke rancangan UI dan Data Model.
