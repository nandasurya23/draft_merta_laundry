# Backend API Documentation

## Ringkasan
Backend Merta Laundry adalah Next.js API Routes yang menjalankan business logic aplikasi. Semua API protected dengan session authentication (kecuali login endpoint). Validasi input dilakukan dengan Zod.

**Stack:**
- **Framework:** Next.js API Routes (App Router)
- **Database:** PostgreSQL + `pg` driver
- **Auth:** PIN-based, JWT via `jose`, httpOnly cookie
- **Validation:** Zod
- **Security:** Parameterized queries, server-side validation, rate limiting

---

## Authentication Flow

### Login Flow

1. User menginput PIN di `/login`
2. Frontend POST ke `/api/auth/login` dengan `{ pin: "1111" }`
3. Backend:
   - Cek apakah user di-lock (`locked_until > now()`)
   - Jika lock aktif → return 429 error "Terlalu banyak percobaan"
   - Jalankan `bcryptjs.compare(pin, pin_hash)` dari DB
   - Jika salah → increment `failed_attempts`
   - Jika `failed_attempts >= 5` → set `locked_until = now + 5 menit`, reset counter
   - Jika salah < 5x → return 401 error (pesan generic)
   - Jika benar → reset `failed_attempts = 0`, locked_until = NULL, buat JWT session
4. Set httpOnly cookie dengan JWT
5. Redirect ke `/` (dashboard)

### Session Cookie

```typescript
cookie: {
  name: 'session',
  value: JWT_token,
  httpOnly: true,
  secure: true, // HTTPS only di production
  sameSite: 'lax',
  path: '/',
  maxAge: 12 * 60 * 60 // 12 jam
}
```

### Logout Flow

1. User klik "Logout"
2. Frontend POST ke `/api/auth/logout`
3. Backend: hapus cookie (set maxAge = 0)
4. Redirect ke `/login`

### Protected Routes

`middleware.ts` protect semua routes kecuali:
- `/login`
- `/api/auth/login`
- Public static assets

Jika tidak ada session valid → redirect ke `/login`

---

## API Endpoints

### Auth Endpoints

#### `POST /api/auth/login`

**Request:**
```json
{
  "pin": "1111"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Owner",
    "createdAt": "2026-08-31T10:00:00Z"
  }
}
```
Cookie session juga di-set secara automatic (Next.js `cookies()`)

**Response (401 Unauthorized):**
```json
{
  "error": "PIN salah atau expired"
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Terlalu banyak percobaan. Coba lagi dalam 5 menit"
}
```

---

#### `POST /api/auth/logout`

**Request:** (no body)

**Response (200 OK):**
```json
{
  "success": true
}
```

Cookie session di-hapus (maxAge = 0).

---

#### `GET /api/auth/me`

Returns current logged-in user info.

**Request:** (no body, session via cookie)

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Owner",
    "createdAt": "2026-08-31T10:00:00Z"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

---

### Customers Endpoints

#### `GET /api/customers`

Fetch semua customers (dengan pagination optional).

**Query params:**
- `search?: string` — filter by name/phone
- `limit?: number` — default 50
- `offset?: number` — default 0

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Bapak Budi",
      "phone": "0811111111",
      "customKiloanPrice": null,
      "customItems": null,
      "totalTransactions": 5,
      "totalSpent": 125000,
      "createdAt": "2026-08-20T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

#### `POST /api/customers`

Buat customer baru.

**Request:**
```json
{
  "name": "Bapak Budi",
  "phone": "0811111111",
  "customKiloanPrice": null,
  "customItems": [
    { "name": "Kemeja", "qty": 5 }
  ]
}
```

**Validation (Zod):**
- `name` — required, string, max 150 chars
- `phone` — optional, string, max 20 chars
- `customKiloanPrice` — optional, integer >= 0
- `customItems` — optional, array of {name, qty}

**Response (201 Created):**
```json
{
  "data": {
    "id": "new-uuid",
    "name": "Bapak Budi",
    "phone": "0811111111",
    "customKiloanPrice": null,
    "customItems": [...],
    "totalTransactions": 0,
    "totalSpent": 0,
    "createdAt": "2026-08-31T10:00:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Name is required"
}
```

---

#### `PATCH /api/customers/[id]`

Update customer.

**Request:**
```json
{
  "name": "Bapak Budi Baru",
  "phone": "0822222222",
  "customKiloanPrice": 5000,
  "customItems": [...]
}
```

**Response (200 OK):** Updated customer object

**Response (404 Not Found):**
```json
{
  "error": "Customer not found"
}
```

---

#### `DELETE /api/customers/[id]`

Hapus customer.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Response (404 Not Found):**
```json
{
  "error": "Customer not found"
}
```

---

### Settings Endpoints

#### `GET /api/settings`

Fetch settings global (laundry profile, harga kiloan, harga satuan).

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "laundryName": "Merta Laundry",
    "address": "Jl. Raya Sudirman No. 88",
    "phone": "081234567890",
    "kiloanPrices": [
      { "id": "uuid", "name": "Cuci Kering", "price": 6000 },
      { "id": "uuid", "name": "Cuci + Setrika", "price": 8000 }
    ],
    "satuanPrices": [
      { "id": "uuid", "name": "Selimut Tipis", "price": 15000 }
    ],
    "updatedAt": "2026-08-31T10:00:00Z"
  }
}
```

---

#### `PUT /api/settings`

Update settings (laundry profile + harga).

**Request:**
```json
{
  "laundryName": "Merta Laundry",
  "address": "Jl. Raya Sudirman No. 88",
  "phone": "081234567890",
  "kiloanPrices": [
    { "id": "uuid", "name": "Cuci Kering", "price": 6000 }
  ],
  "satuanPrices": [
    { "id": "uuid", "name": "Selimut Tipis", "price": 15000 }
  ]
}
```

**Validation:**
- `laundryName` — required, string, max 150 chars
- `address` — optional, string
- `phone` — optional, string
- `kiloanPrices`, `satuanPrices` — array of {id, name, price}, price >= 0

**Response (200):** Updated settings object

---

### Transactions Endpoints

#### `GET /api/transactions`

Fetch semua transaksi dengan filter.

**Query params:**
- `search?: string` — filter by invoiceNumber/customerName
- `paymentStatus?: "BELUM_BAYAR" | "LUNAS"`
- `laundryStatus?: "DITERIMA" | "DIPROSES" | "SELESAI" | "DIAMBIL"`
- `startDate?: ISO string` — filter by date >= startDate
- `endDate?: ISO string` — filter by date <= endDate
- `limit?: number` — default 50
- `offset?: number` — default 0

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "TRX-123456",
      "date": "2026-08-31T10:00:00Z",
      "customerId": "uuid",
      "customerName": "Bapak Budi",
      "customerPhone": "0811111111",
      "type": "KILOAN",
      "kiloDetail": {
        "weight": 5,
        "pricePerKg": 8000,
        "subtotal": 40000,
        "totalItemCount": 15,
        "items": [
          { "id": "uuid", "name": "Kemeja", "qty": 5 }
        ]
      },
      "unitDetail": null,
      "grandTotal": 40000,
      "totalItem": 15,
      "paymentStatus": "BELUM_BAYAR",
      "laundryStatus": "DITERIMA",
      "createdByUserId": "uuid",
      "createdByName": "Owner",
      "createdAt": "2026-08-31T10:00:00Z",
      "updatedAt": "2026-08-31T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

#### `POST /api/transactions`

Buat transaksi baru.

**Request:**
```json
{
  "date": "2026-08-31T10:00:00Z",
  "customerId": "uuid-or-null",
  "customerName": "Bapak Budi",
  "customerPhone": "0811111111",
  "type": "KILOAN",
  "kiloDetail": {
    "weight": 5,
    "pricePerKg": 8000,
    "totalItemCount": 15,
    "items": [
      { "name": "Kemeja", "qty": 5 }
    ]
  },
  "unitDetail": null,
  "paymentStatus": "BELUM_BAYAR"
}
```

**Server-side logic:**
1. Kalkulasi `grand_total` dan `subtotal` dari kiloDetail/unitDetail
2. Generate `invoice_number` dari timestamp (TRX-XXXXXX)
3. Record `created_by_user_id` dari session (current user)
4. Jika `customerId` provided → update customer `total_transactions` & `total_spent`
5. Insert ke DB

**Response (201 Created):** Transaksi object dengan ID baru

**Response (400 Bad Request):**
```json
{
  "error": "customerName is required"
}
```

---

#### `GET /api/transactions/[id]`

Fetch satu transaksi by ID.

**Response (200):** Transaction object

**Response (404):**
```json
{
  "error": "Transaction not found"
}
```

---

#### `PATCH /api/transactions/[id]`

Update transaksi (status, pembayaran, dll).

**Request:**
```json
{
  "paymentStatus": "LUNAS",
  "laundryStatus": "SELESAI"
}
```

**Validation:** Only allow updating `paymentStatus` dan `laundryStatus`, jangan allow mengubah amount/items setelah dibuat.

**Response (200):** Updated transaction object

---

#### `DELETE /api/transactions/[id]`

Hapus transaksi.

**Response (200):**
```json
{
  "success": true
}
```

**Business logic:**
- Jika transaksi di-delete, kurangi `customer.total_transactions` & `customer.total_spent`

---

### Reports Endpoints

#### `GET /api/reports`

Fetch metrics laporan (omzet, lunas, belum bayar, dll).

**Query params:**
- `period?: "today" | "week" | "month" | "all"` — default "all"

**Response (200):**
```json
{
  "data": {
    "period": "month",
    "totalTransactions": 50,
    "totalOmzet": 500000,
    "totalLunas": 300000,
    "totalBelumBayar": 200000,
    "transactionCount": 50,
    "lunasCounT": 30
  }
}
```

---

#### `GET /api/reports/export`

Export transaksi sebagai CSV.

**Query params:**
- `period?: "today" | "week" | "month" | "all"` — default "all"

**Response (200):**
- Content-Type: `text/csv`
- Header: `Content-Disposition: attachment; filename=merta_laundry_report_TIMESTAMP.csv`
- Body: CSV dengan kolom: No Nota, Tanggal, Pelanggan, Jenis, Total Item, Total, Pembayaran, Status Laundry

---

## Error Handling

### Error Response Format

Semua error return dengan struktur:

```json
{
  "error": "Error message",
  "status": 400
}
```

### HTTP Status Codes

- **200** — OK
- **201** — Created
- **400** — Bad Request (validation error)
- **401** — Unauthorized (no session, invalid PIN)
- **404** — Not Found
- **429** — Too Many Requests (rate limit)
- **500** — Internal Server Error

### Logging

- Error detail di-log server-side hanya (tidak dikirim ke client)
- Pesan ke client generic ("Terjadi kesalahan", jangan expose detail database)

---

## Validation Rules

Semua API endpoint menggunakan Zod untuk validate input:

**Common rules:**
- String fields: required, non-empty (`.trim()`), max length
- Number fields: >= 0, integer
- Enum fields: must match allowed values
- Arrays: optional, each item validated

**Contoh Zod schema:**

```typescript
const CreateTransactionSchema = z.object({
  customerName: z.string().min(1).max(150),
  customerPhone: z.string().max(20).optional(),
  type: z.enum(['KILOAN', 'SATUAN', 'KILOAN_SATUAN']),
  paymentStatus: z.enum(['BELUM_BAYAR', 'LUNAS']).default('BELUM_BAYAR'),
  kiloDetail: z.object({
    weight: z.number().min(0.1),
    pricePerKg: z.number().int().min(0),
    totalItemCount: z.number().int().min(0)
  }).optional(),
  unitDetail: z.object({
    items: z.array(z.object({
      name: z.string().min(1),
      qty: z.number().int().min(1),
      unitPrice: z.number().int().min(0)
    }))
  }).optional()
});
```

---

## Performance Considerations

1. **Database Indexes:** Lihat `docs/database.md` untuk index strategy
2. **Query Optimization:** Gunakan `LIMIT` untuk pagination
3. **N+1 Prevention:** Join di SQL saat diperlukan, jangan loop di Node.js
4. **Caching:** Untuk MVP, tidak perlu caching (data relatif kecil)

---

## Security Checklist

✅ PIN di-hash, never plaintext  
✅ Session via httpOnly cookie  
✅ All queries parameterized ($1, $2, ...)  
✅ Input validation (Zod)  
✅ Rate limiting (brute-force protection)  
✅ No secret di-expose ke client  
✅ Error handling generic (tidak expose detail)  
✅ middleware.ts protects all routes  

---

*Last Updated: 2026-08-31*
