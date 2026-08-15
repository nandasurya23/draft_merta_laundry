# Data Model

Karena sistem menggunakan `localStorage`, data akan disimpan dalam bentuk JSON string. Berikut adalah struktur data utamanya.

## Enum
```typescript
enum PaymentStatus {
  UNPAID = "BELUM_BAYAR",
  PAID = "LUNAS"
}

enum LaundryStatus {
  RECEIVED = "DITERIMA",
  PROCESSING = "DIPROSES",
  DONE = "SELESAI",
  PICKED_UP = "DIAMBIL"
}

enum TransactionType {
  KILOAN = "KILOAN",
  SATUAN = "SATUAN",
  KILOAN_SATUAN = "KILOAN_SATUAN"
}
```

## Entitas

### 1. Customer
```typescript
interface Customer {
  id: string; // UUID
  name: string;
  phone: string;
  totalTransactions: number;
  totalSpent: number;
}
```

### 2. Transaction
```typescript
interface Transaction {
  id: string;          // UUID
  invoiceNumber: string; // e.g., "TRX-000123"
  date: string;        // ISO Date String
  customerId: string;
  customerName: string;
  type: TransactionType;
  
  // Kiloan Part (Nullable/Optional if SATUAN only)
  kiloDetail?: {
    weight: number;
    pricePerKg: number;
    subtotal: number;
    totalItemCount: number; // Jumlah total pcs baju
    items?: {             // Detail pakaian opsional, tanpa harga
      name: string;
      qty: number;
    }[];
  };

  // Satuan Part (Nullable/Optional if KILOAN only)
  unitDetail?: {
    items: {
      name: string;
      qty: number;
      unitPrice: number;
      subtotal: number; // qty * unitPrice
    }[];
    subtotal: number;
  };

  grandTotal: number;
  totalItem: number; // Aggregate total pcs
  
  paymentStatus: PaymentStatus;
  laundryStatus: LaundryStatus;
}
```

### 3. Settings (Pengaturan Default)
```typescript
interface Settings {
  laundryProfile: {
    name: string;
    address: string;
    phone: string;
  };
  kiloanPrices: {
    name: string;
    price: number;
  }[];
  satuanPrices: {
    name: string;
    price: number;
  }[];
}
```

## Catatan Model
- **Kiloan Total Item:** `totalItemCount` wajib diisi manual. Detail pakaian `items` bersifat opsional dan tidak ada field `price`.
- **Satuan:** Kalkulasi subtotal dilakukan per item.
