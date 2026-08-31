# Database Documentation

## Ringkasan
Aplikasi Merta Laundry menggunakan **PostgreSQL** sebagai database utama. Data diakses melalui driver `pg` (node-postgres) dengan raw SQL queries yang di-parameterize (tanpa ORM).

**Environment:**
- **Development:** PostgreSQL lokal (localhost)
- **Production:** Neon PostgreSQL (managed service)
- **Connection string env var:** `DATABASE_URL`

---

## Skema Database

### 1. Tabel `users`
Menyimpan informasi akun PIN untuk setiap operator/owner.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Kolom:**
- `id`: UUID unik per user
- `name`: Nama user (misal: "Owner", "Pegawai A", "Pegawai B")
- `pin_hash`: PIN di-hash dengan `bcryptjs` (tidak pernah plaintext)
- `failed_attempts`: Counter percobaan login gagal (direset setiap sukses)
- `locked_until`: Timestamp sampai user di-lock (brute-force protection, lock 5 menit setelah 5x salah)
- `created_at`: Waktu user dibuat

**Indeks:**
- `id` (PRIMARY KEY)

---

### 2. Tabel `customers`
Menyimpan data pelanggan laundry.

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  custom_kiloan_price INTEGER,
  custom_items JSONB,
  total_transactions INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Kolom:**
- `id`: UUID unik per customer
- `name`: Nama pelanggan (required)
- `phone`: Nomor HP pelanggan (opsional)
- `custom_kiloan_price`: Harga kiloan khusus untuk customer ini (opsional, override harga default)
- `custom_items`: JSONB array untuk item spesifik milik customer (format: `[{"name": "Kemeja", "qty": 5}, ...]`)
- `total_transactions`: Jumlah transaksi yang sudah dibuat (auto-increment saat transaksi dibuat)
- `total_spent`: Total omzet dari customer ini (auto-increment saat transaksi dibuat)
- `created_at`: Waktu customer dibuat

**Indeks:**
- `id` (PRIMARY KEY)
- `name` (untuk search)
- `phone` (untuk search)

**Catatan `custom_items` JSONB:**
- Struktur: `[{"name": "Kemeja", "qty": 5}, {"name": "Celana", "qty": 3}]`
- Ini adalah catatan khusus barang yang dimiliki customer (tidak ada harga, hanya qty)
- Dapat digunakan saat membuat transaksi type KILOAN untuk "quick fill" detail pakaian customer

---

### 3. Tabel `settings`
Menyimpan konfigurasi global aplikasi (satu record saja).

```sql
CREATE TABLE settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  laundry_name VARCHAR(150) NOT NULL DEFAULT 'Merta Laundry',
  address TEXT,
  phone VARCHAR(20),
  kiloan_prices JSONB NOT NULL DEFAULT '[]',
  satuan_prices JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Kolom:**
- `id`: Fixed value 1 (hanya 1 record untuk seluruh app)
- `laundry_name`: Nama bisnis laundry (ditampilkan di atas nota/invoice)
- `address`: Alamat lengkap
- `phone`: Nomor telepon/WhatsApp bisnis
- `kiloan_prices`: JSONB array harga kiloan (format: `[{"id": "uuid", "name": "Cuci Kering", "price": 6000}, ...]`)
- `satuan_prices`: JSONB array harga satuan (format: `[{"id": "uuid", "name": "Selimut Tipis", "price": 15000}, ...]`)
- `updated_at`: Waktu terakhir settings diupdate

**Indeks:**
- `id` (PRIMARY KEY)

**Catatan:**
- Kolom `id` selalu 1 → pastikan INSERT seed menggunakan `INSERT ... VALUES (1, ...)` atau gunakan `INSERT ... ON CONFLICT (id) DO UPDATE SET ...`
- Untuk update, gunakan: `UPDATE settings SET laundry_name = $1, ... WHERE id = 1`

---

### 4. Tabel `transactions`
Menyimpan data transaksi laundry (nota).

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(20) NOT NULL UNIQUE,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20),
  type VARCHAR(20) NOT NULL CHECK(type IN ('KILOAN', 'SATUAN', 'KILOAN_SATUAN')),
  
  kilo_detail JSONB,
  unit_detail JSONB,
  
  grand_total INTEGER NOT NULL DEFAULT 0,
  total_item INTEGER NOT NULL DEFAULT 0,
  
  payment_status VARCHAR(20) NOT NULL DEFAULT 'BELUM_BAYAR' CHECK(payment_status IN ('BELUM_BAYAR', 'LUNAS')),
  laundry_status VARCHAR(20) NOT NULL DEFAULT 'DITERIMA' CHECK(laundry_status IN ('DITERIMA', 'DIPROSES', 'SELESAI', 'DIAMBIL')),
  
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Kolom:**
- `id`: UUID unik per transaksi
- `invoice_number`: Nomor nota unik (format: `TRX-XXXXXX`, generated dari timestamp)
- `date`: Tanggal transaksi (default saat dibuat, dapat diubah user)
- `customer_id`: Foreign key ke `customers` table (bisa NULL jika pelanggan manual)
- `customer_name`: Nama pelanggan (required, copy dari customer atau input manual)
- `customer_phone`: Nomor HP pelanggan (opsional)
- `type`: Jenis transaksi (KILOAN, SATUAN, KILOAN_SATUAN)
- `kilo_detail`: JSONB untuk detail kiloan (lihat struktur di bawah)
- `unit_detail`: JSONB untuk detail satuan (lihat struktur di bawah)
- `grand_total`: Total keseluruhan dalam Rupiah
- `total_item`: Total jumlah pcs/unit barang
- `payment_status`: Status pembayaran (BELUM_BAYAR atau LUNAS)
- `laundry_status`: Status laundry (DITERIMA, DIPROSES, SELESAI, DIAMBIL)
- `created_by_user_id`: Foreign key ke `users` (siapa yang membuat transaksi)
- `created_by_name`: Nama user yang membuat (copy untuk keperluan laporan jika user dihapus)
- `created_at`: Waktu transaksi dibuat
- `updated_at`: Waktu transaksi terakhir diupdate

**Struktur `kilo_detail` JSONB:**
```json
{
  "weight": 5.5,
  "pricePerKg": 8000,
  "subtotal": 44000,
  "totalItemCount": 15,
  "items": [
    { "id": "uuid", "name": "Kemeja", "qty": 5 },
    { "id": "uuid", "name": "Kaos", "qty": 10 }
  ]
}
```

**Struktur `unit_detail` JSONB:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Selimut Tipis",
      "qty": 1,
      "unitPrice": 15000,
      "subtotal": 15000
    },
    {
      "id": "uuid",
      "name": "Bed Cover Besar",
      "qty": 2,
      "unitPrice": 35000,
      "subtotal": 70000
    }
  ],
  "subtotal": 85000
}
```

**Indeks:**
- `id` (PRIMARY KEY)
- `invoice_number` (UNIQUE)
- `customer_id` (untuk filter by customer)
- `date` (untuk filter by date/period)
- `payment_status` (untuk laporan)
- `laundry_status` (untuk laporan)
- `created_by_user_id` (untuk audit trail)

---

## Rasionalisasi Desain

### Mengapa JSONB untuk `kilo_detail`, `unit_detail`, `custom_items`, dll?

1. **Fleksibilitas:** Struktur nested (items array) dapat berubah tanpa migration schema
2. **Tidak ada relasi kompleks:** Skala aplikasi kecil (internal, satu laundry), tidak perlu normalisasi penuh
3. **Query sederhana:** Dapat query langsung satu field tanpa JOIN
4. **Sesuai MVP:** Cukup untuk requirement yang ada tanpa over-engineering

Alternatif (normalisasi penuh):
- Buat tabel `transaction_items`, `kiloan_items`, dll → lebih kompleks, lebih banyak JOIN
- Tidak diperlukan untuk skala internal ini

### Mengapa `custom_items` di `customers` table?

- Catatan khusus item milik customer (barang yang sering dibawa, dll)
- Digunakan untuk "quick fill" saat membuat transaksi type KILOAN untuk customer tersebut
- Tidak ada yang "salah" jika tidak digunakan → opsional

### Mengapa `created_by_name` di `transactions` (copy)?

- Jika user (operator) dihapus di masa depan, laporan tetap bisa menunjukkan siapa yang membuat transaksi
- `created_by_user_id` bisa NULL (ON DELETE SET NULL), tapi nama tetap tercatat

### Brute-Force Protection via DB

- Kolom `failed_attempts` dan `locked_until` di `users` table
- Backend cek ini setiap kali login → jika lock masih aktif, reject request
- Setelah lock expire (5 menit), user bisa coba lagi
- Lebih robust daripada rate-limit di memory saja (jika server restart, counter hilang)

---

## Seed Data

File: `db/seed.sql`

### Users (3 user dengan PIN yang sudah di-hash)

PIN awal sebelum di-hash (untuk testing):
- **Owner:** PIN `1111`
- **Pegawai A:** PIN `2222`
- **Pegawai B:** PIN `3333`

Seed script akan:
1. Hash PIN dengan `bcryptjs` (dilakukan di Node.js, bukan di SQL)
2. Insert ke tabel `users`

**Catatan:** PIN hashing dilakukan offline (di script Node.js) sebelum INSERT, bukan pakai SQL function.

### Settings (1 record)

- Nama laundry: "Merta Laundry"
- Alamat: "Jl. Raya Sudirman No. 88"
- Telepon: "081234567890"
- Kiloan prices: Default dari `js/db.js` lama (Cuci Kering, Cuci+Setrika, Setrika Saja, Express 24 Jam)
- Satuan prices: Default dari `js/db.js` lama (Selimut Tipis, Bed Cover, Jas/Safari, Sepatu Sneaker, Karpet)

### Customers (Kosong)

Mulai fresh, tidak ada customer dummy.

### Transactions (Kosong)

Mulai fresh, tidak ada transaksi dummy.

---

## Migration Strategy

### Initial Setup
1. `psql -d merta_laundry -f db/schema.sql` → jalankan schema
2. Node.js script (`db/seed.js`) → hash PIN, seed ke database

### Updates Schema (masa depan)
- Jika ada perubahan schema, buat file migrasi baru (`db/migrations/0002_add_xxx.sql`)
- Jalankan manual saat deploy

**Catatan:** Untuk MVP ini, seed hanya dilakukan sekali saat setup. Tidak ada auto-migration saat deploy.

---

## Koneksi & Konfigurasi

### Development (.env.local)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/merta_laundry
```

### Production (Neon, env di Netlify)
```env
DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/merta_laundry?sslmode=require
```

### Connection Pool (lib/db.ts)
- Min pool size: 1
- Max pool size: 20 (atau sesuai limit Neon)
- Idle timeout: 30 detik
- Query timeout: 30 detik

---

## Backup & Recovery

**Untuk MVP ini (1 minggu deadline):**
- Tidak ada automatic backup system
- Setelah production, manual backup via Neon dashboard

**Rekomendasi jangka panjang:**
- Neon memiliki automatic daily backup (included)
- Untuk disaster recovery, manual export dump via `pg_dump` secara berkala

---

## Kesimpulan

Database design fokus pada:
1. **Simplicity:** JSONB untuk nested data, tidak over-normalize
2. **Security:** PIN di-hash, queries di-parameterize
3. **Auditability:** Track siapa membuat transaksi (created_by_user_id)
4. **Scalability:** Untuk internal use (1 laundry), struktur ini cukup scalable sampai beberapa ribu transaksi/bulan

---

*Last Updated: 2026-08-31*
