# Product Requirements Document (PRD)

## Product Overview
Aplikasi manajemen internal sederhana untuk operasional bisnis laundry, dirancang sebagai pengganti pencatatan manual (buku nota) menjadi digital. Aplikasi ini akan berjalan di browser dan berbasis web technologies standar (HTML, CSS, Vanilla JS) dengan localStorage untuk MVP.

## Problem
- Pencatatan nota secara fisik (manual) rentan hilang, kotor, dan susah dilacak.
- Kesalahan perhitungan harga saat membuat nota untuk pelanggan.
- Sulit memonitor omzet harian dan bulanan secara cepat.
- Penulisan detail pakaian (misal: kemeja, celana) seringkali tidak seragam.

## Goal
- Mempercepat proses pembuatan nota laundry dengan perhitungan otomatis.
- Menyediakan riwayat transaksi yang rapi dan dapat difilter (lunas/belum bayar, status laundry).
- Menyediakan laporan omzet instan untuk owner.
- Dapat mencetak nota fisik rangkap 3 untuk operasional toko (Customer Copy, Laundry Copy, Archive Copy).

## Target User
- **Operator Laundry:** Membutuhkan UI yang cepat, jelas, dan meminimalisir klik. Akan sering menggunakan aplikasi di PC/Laptop di kasir.
- **Owner Laundry:** Membutuhkan rekapitulasi data (dashboard omzet) dan laporan yang bisa diekspor.

## Core Workflow
1. Operator menerima pakaian dari customer.
2. Operator memasukkan data customer dan memilih tipe transaksi (Kiloan, Kiloan + Satuan, Satuan).
3. Operator memasukkan detail berat, harga, total item, dan rincian opsional.
4. Sistem menghitung grand total.
5. Operator menyimpan dan mencetak nota fisik rangkap 3.
6. Pakaian diproses. Setelah selesai, status diupdate.
7. Pelanggan mengambil dan melunasi (jika belum lunas), status diupdate menjadi "Diambil" dan "Lunas".

## Functional Requirements
- Manajemen pelanggan sederhana (Nama, No HP).
- Manajemen transaksi dengan 3 tipe: Kiloan, Kiloan + Satuan, Satuan.
- Pencetakan nota khusus (print layout) yang sesuai dengan ukuran kertas nota rangkap 3.
- Kalkulasi harga otomatis (Berat x Harga Kiloan) + (Qty x Harga Satuan).
- Dashboard statistik (Omzet hari ini, bulan ini, jumlah lunas/belum lunas).
- Laporan dan Export CSV.
- LocalStorage sebagai mock database yang persisten di browser.

## Non-functional Requirements
- **Simplicity:** Tidak memerlukan proses onboarding kompleks.
- **Speed:** Minim input mengetik; lebih banyak pilihan cepat.
- **Responsive & Desktop First:** Optimasi penggunaan di meja kasir.
- **Print Optimization:** CSS `@media print` harus sempurna.

## MVP Boundaries
- Sistem hanya berjalan di sisi client-side dengan mock database lokal (localStorage).
- Tanpa backend/server.
- Fitur difokuskan pada "Mencatat, Menghitung, dan Mencetak".

## Hal yang Sengaja TIDAK Dibuat (Out of Scope)
- Payment Gateway / QRIS dinamis.
- Sistem DP / Cicilan.
- Integrasi WhatsApp API / Notifikasi otomatis.
- Loyalty point / Membership / CRM kompleks.
- Payroll & Absensi Karyawan.
- Inventory / Manajemen Stok Detergen.
- Multi-cabang & Kurir.
- Customer Mobile App / Online Ordering.
- Fitur AI / OCR.
- Sistem Akuntansi kompleks.
