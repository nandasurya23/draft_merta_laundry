# Frontend Documentation

## Ringkasan
Frontend Merta Laundry adalah aplikasi React yang di-build dengan Next.js App Router. UI di-style dengan Tailwind CSS. State management menggunakan React hooks (useState, useContext) dan server actions untuk data fetching. Tidak ada state management library kompleks seperti Redux.

**Stack:**
- **Framework:** Next.js (App Router)
- **UI Library:** React
- **Styling:** Tailwind CSS
- **Icons:** Lucide React (atau inline SVG)
- **State:** React hooks + React Context (bila diperlukan)
- **Data fetching:** `fetch()` di client actions atau via API routes

---

## Struktur Folder

```
app/
├── layout.tsx                          # Root layout
├── login/
│   └── page.tsx                        # Login page
├── (dashboard)/
│   ├── layout.tsx                      # Dashboard layout (sidebar + topbar)
│   ├── page.tsx                        # Dashboard / Home page
│   ├── transactions/
│   │   ├── page.tsx                    # Transactions list page
│   │   ├── new/
│   │   │   └── page.tsx                # Create transaction page
│   │   └── [id]/
│   │       └── page.tsx                # Transaction detail page
│   ├── customers/
│   │   └── page.tsx                    # Customers list & management page
│   ├── reports/
│   │   └── page.tsx                    # Reports page
│   └── settings/
│       └── page.tsx                    # Settings page
├── api/
│   ├── auth/
│   │   ├── login/route.ts              # POST /api/auth/login
│   │   ├── logout/route.ts             # POST /api/auth/logout
│   │   └── me/route.ts                 # GET /api/auth/me
│   ├── customers/
│   │   ├── route.ts                    # GET/POST /api/customers
│   │   └── [id]/route.ts               # PATCH/DELETE /api/customers/[id]
│   ├── transactions/
│   │   ├── route.ts                    # GET/POST /api/transactions
│   │   └── [id]/route.ts               # GET/PATCH/DELETE /api/transactions/[id]
│   ├── settings/route.ts               # GET/PUT /api/settings
│   └── reports/
│       ├── route.ts                    # GET /api/reports
│       └── export/route.ts             # GET /api/reports/export (CSV)
└── components/                         # Reusable components
    ├── Sidebar.tsx
    ├── Topbar.tsx
    ├── Dashboard/
    │   └── MetricsCard.tsx
    ├── Transactions/
    │   ├── TransactionForm.tsx
    │   ├── TransactionList.tsx
    │   └── TransactionDetail.tsx
    ├── Customers/
    │   ├── CustomerList.tsx
    │   ├── CustomerModal.tsx
    │   └── CustomerForm.tsx
    ├── Reports/
    │   └── ReportMetrics.tsx
    ├── Settings/
    │   ├── LaundryProfileForm.tsx
    │   └── PriceManagement.tsx
    ├── Common/
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── Select.tsx
    │   ├── Modal.tsx
    │   ├── Toast.tsx
    │   └── Loader.tsx
    └── Layout/
        └── ProtectedLayout.tsx
lib/
├── api.ts                              # API client helper functions
├── auth.ts                             # Client-side auth utilities
├── utils.ts                            # Formatting, validation utils
└── hooks/
    ├── useAuth.ts                      # Hook untuk get current user
    ├── useFetch.ts                     # Hook untuk data fetching
    └── useToast.ts                     # Hook untuk toast notifications
public/
└── (static assets)
```

---

## Page Structure & Routing

### `/login` — Login Page
**File:** `app/login/page.tsx`

**Fitur:**
- Form input PIN (password field)
- Submit button
- Error message display
- Redirect ke `/` jika login sukses
- Protected: Jika sudah login, redirect ke `/`

**State:**
- `pin`: string (form input)
- `error`: string | null (error message)
- `isLoading`: boolean (during login request)

**API Call:** POST `/api/auth/login`

---

### `/(dashboard)` — Main Layout
**File:** `app/(dashboard)/layout.tsx`

**Komponen:**
- `Sidebar` — Navigation menu dengan links: Dashboard, Transactions, Customers, Reports, Settings
- `Topbar` — Branding, current time, user name, logout button
- Navigation active state based on current page

**State:**
- `sidebarOpen`: boolean (mobile sidebar toggle)

**Logout:** POST `/api/auth/logout` → redirect ke `/login`

---

### `/(dashboard)` — Dashboard Page
**File:** `app/(dashboard)/page.tsx`

**Fitur:**
- 4 metric cards: Omzet Hari Ini, Omzet Bulan Ini, Total Transaksi, Belum Bayar
- Recent transactions table (5 baris, sortable by date desc)
- "Buat Transaksi" button → link ke `/transactions/new`

**Data fetching:** GET `/api/reports?period=today` + GET `/api/transactions?limit=5`

**Components:**
- `MetricsCard` — Reusable card untuk display metric
- `TransactionList` — Table komponen

---

### `/transactions` — Transactions List Page
**File:** `app/(dashboard)/transactions/page.tsx`

**Fitur:**
- Search by invoice number / customer name
- Filters:
  - Date (All, Today, This Month)
  - Payment Status (All, Belum Bayar, Lunas)
  - Laundry Status (All, Diterima, Diproses, Selesai, Diambil)
- Table dengan kolom: No. Nota, Tanggal, Pelanggan, Jenis, Total Item, Total, Pembayaran, Laundry Status, Action (Detail button)
- Pagination (simple offset/limit)

**Data fetching:** GET `/api/transactions?search=...&paymentStatus=...&laundryStatus=...&startDate=...&endDate=...&limit=50&offset=0`

**Navigation:** Click "Detail" → `/transactions/[id]`

---

### `/transactions/new` — Create Transaction Page
**File:** `app/(dashboard)/transactions/new/page.tsx`

**Layout:**
- Left column: Customer data + transaction type selector + dynamic form
- Right column: Sticky summary panel dengan grand total

**Fitur:**

1. **Customer Selection**
   - Dropdown: "-- Pelanggan Baru / Manual --" atau select existing customer
   - Jika select existing: populate name/phone (readonly), show custom kiloan price
   - Jika "Pelanggan Baru": allow edit name/phone

2. **Transaction Type (Radio buttons)**
   - KILOAN
   - SATUAN
   - KILOAN_SATUAN
   - Toggle visibility of sections based on type

3. **KILOAN Section**
   - Berat (kg) — number input
   - Harga/Kg — select dropdown (dari settings kiloanPrices)
   - Total Barang (pcs) — number input
   - Toggle "Tambah Detail Pakaian" — reveal table untuk optional detail items
   - Detail items table: Nama pakaian, Qty, buttons to add/remove row

4. **SATUAN Section**
   - Table: Nama Barang, Qty, Harga Satuan, Subtotal, Action (remove)
   - Button "Tambah Barang Satuan" → add row

5. **Ringkasan Panel (Right)**
   - Status Pembayaran dropdown (Belum Bayar / Lunas)
   - Grand Total display (real-time calculation)
   - Submit & Cancel buttons

**Calculation Logic (Client-side, real-time):**
```
if KILOAN || KILOAN_SATUAN:
  kiloSubtotal = weight * pricePerKg
  grandTotal += kiloSubtotal

if SATUAN || KILOAN_SATUAN:
  for each satuan item:
    itemSubtotal = qty * unitPrice
    grandTotal += itemSubtotal

totalItem = (kiloDetail.totalItemCount || 0) + sum(satuanItems.qty)
```

**Form Submission:**
- POST `/api/transactions`
- Redirect ke `/transactions/[id]` (newly created) dengan success toast

**State:**
- `customers`: array (fetched on page load)
- `settings`: object dengan kiloanPrices/satuanPrices
- `selectedCustomer`: Customer | null
- `transactionType`: enum
- `kiloWeight`, `kiloPrice`, `kiloTotalItem`: numbers
- `kiloDetails`: array of {id, name, qty}
- `satuanItems`: array of {id, name, qty, unitPrice}
- `paymentStatus`: enum
- `grandTotal`: number (computed)

---

### `/transactions/[id]` — Transaction Detail Page
**File:** `app/(dashboard)/transactions/[id]/page.tsx`

**Fitur:**

1. **Action Bar**
   - "Kembali" button
   - "Delete" button (confirm modal)
   - "Tampilkan Rincian Harga" toggle (show/hide price breakdown)

2. **Status Controls**
   - Laundry Status dropdown (Diterima, Diproses, Selesai, Diambil)
   - "Tandai Lunas" button (jika payment status = BELUM_BAYAR)
   - "Print Nota" button → trigger `window.print()`

3. **Invoice Display**
   - Header: Laundry name/address/phone (dari settings)
   - Invoice number, date, customer info
   - Kiloan section (jika applicable)
   - Satuan section (jika applicable)
   - Grand total
   - Payment status & laundry status badges

4. **Print Layout**
   - CSS `@media print` untuk 3-copy layout
   - Hide buttons/action bar saat print
   - Layout rangkap 3: Customer Copy | Laundry Copy | Archive Copy
   - Gunakan page breaks untuk separation

**Data fetching:** GET `/api/transactions/[id]`

**Update Status:** PATCH `/api/transactions/[id]` dengan `{paymentStatus: "LUNAS"}` atau `{laundryStatus: "SELESAI"}`

**Delete:** DELETE `/api/transactions/[id]` → redirect ke `/transactions`

**State:**
- `transaction`: Transaction object
- `showPriceDetails`: boolean

---

### `/customers` — Customers List & Management Page
**File:** `app/(dashboard)/customers/page.tsx`

**Fitur:**

1. **List Section**
   - Search box: filter by name/phone
   - Table dengan kolom: Nama, No HP, Harga Kiloan Khusus, Total Transaksi, Action (Edit/Delete)
   - Empty state: "Belum ada pelanggan"

2. **Add/Edit Modal**
   - Form fields:
     - Nama Pelanggan (required)
     - No HP (required)
     - Harga Kiloan Khusus (optional number)
     - Custom Items (optional table): Nama Barang, Qty, buttons to add/remove
   - Modal buttons: Batal, Simpan

**Data fetching:** GET `/api/customers?search=...`

**Add:** POST `/api/customers` → close modal, refresh list, show success toast

**Edit:** 
- Click "Edit" button → populate form dari customer data → PATCH `/api/customers/[id]` → refresh list

**Delete:** 
- Click "Delete" button → confirmation modal → DELETE `/api/customers/[id]` → refresh list

**State:**
- `customers`: array
- `searchTerm`: string
- `modalOpen`: boolean
- `editingCustomer`: Customer | null
- `formData`: form state

---

### `/reports` — Reports Page
**File:** `app/(dashboard)/reports/page.tsx`

**Fitur:**

1. **Period Filter**
   - Select dropdown: Today, This Week, This Month, All Time

2. **Metrics Section**
   - 4 cards: Total Transactions, Total Omzet, Total Lunas, Total Belum Bayar

3. **Export Section**
   - "Ekspor CSV" button → GET `/api/reports/export?period=...` → trigger download

**Data fetching:** GET `/api/reports?period=...`

**CSV Export:** Trigger download, filename: `merta_laundry_report_TIMESTAMP.csv`

---

### `/settings` — Settings Page
**File:** `app/(dashboard)/settings/page.tsx`

**Sections:**

1. **Laundry Profile Form**
   - Nama Bisnis
   - Alamat
   - Telepon
   - Submit button → PUT `/api/settings`

2. **Kiloan Prices Management**
   - Table: Nama Layanan, Harga (Rp), Action (Delete)
   - Button "Tambah Kiloan" → add row
   - Inline edit pada fields
   - Save button → PUT `/api/settings`

3. **Satuan Prices Management**
   - Table: Nama Layanan, Harga (Rp), Action (Delete)
   - Button "Tambah Satuan" → add row
   - Inline edit pada fields
   - Save button → PUT `/api/settings`

4. **Danger Zone**
   - "Factory Reset" button → confirmation modal → clear all data (localStorage clear + reload)
   - **Note:** Untuk versi Next.js, ini tidak applicable. Atau buat endpoint DELETE untuk reset semua (tapi ini overkill untuk MVP).

**Data fetching:** GET `/api/settings` on page load

**Update:** PUT `/api/settings` dengan form data

**State:**
- `settings`: Settings object
- `kiloanPrices`: array (editable)
- `satuanPrices`: array (editable)

---

## Reusable Components

### `components/Common/Button.tsx`
Wrapper button dengan variant: primary, secondary, danger, success
Props: `variant`, `size`, `disabled`, `children`, `onClick`

### `components/Common/Input.tsx`
Text input dengan label, error message
Props: `label`, `value`, `onChange`, `placeholder`, `error`, `type`, `required`

### `components/Common/Select.tsx`
Dropdown select dengan label, error message
Props: `label`, `value`, `onChange`, `options`, `error`, `required`

### `components/Common/Modal.tsx`
Generic modal wrapper
Props: `isOpen`, `onClose`, `title`, `children`, `footer`

### `components/Common/Toast.tsx`
Toast notification (bottom-right)
Props: `message`, `type` ("success" | "error")

### `components/Layout/ProtectedLayout.tsx`
HOC untuk protect pages yang require login
- Fetch `/api/auth/me`
- Jika 401 → redirect ke `/login`
- Jika success → render children dengan user data via Context

### `components/Sidebar.tsx`
Navigation sidebar dengan menu items
Props: `isOpen`, `onClose`, `currentPath`

### `components/Topbar.tsx`
Top header dengan laundry name, clock, user profile, logout button
Props: `userName`

---

## State Management Strategy

### React Context untuk Global State

File: `lib/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC = ({ children }) => {
  // Fetch /api/auth/me on mount
  // Handle login/logout
};

export const useAuth = () => {
  // Return context or throw error
};
```

**Usage in components:**
```typescript
const { user, isLoading, logout } = useAuth();
```

### Local State untuk Page/Component

Gunakan `useState` untuk form inputs, modal visibility, dll.

### Server Actions (Optional)

Jika diperlukan, gunakan Next.js Server Actions untuk mutation yang kompleks (tapi untuk MVP, API routes sudah cukup).

---

## Data Fetching Pattern

### Client-side fetch dengan loading/error handling:

```typescript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/transactions')
    .then(res => res.json())
    .then(data => { setData(data); setIsLoading(false); })
    .catch(err => { setError(err.message); setIsLoading(false); });
}, []);
```

Atau gunakan helper hook `useFetch`:

```typescript
const { data, isLoading, error } = useFetch('/api/transactions');
```

---

## Form Handling

### Controlled inputs (React pattern):

```typescript
const [formData, setFormData] = useState({ name: '', phone: '' });

const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  if (res.ok) {
    // Success
  }
};
```

---

## Styling with Tailwind CSS

### Class naming:

```tsx
<div className="flex flex-col gap-4 p-6 rounded-lg border border-gray-200">
  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    Action
  </button>
</div>
```

### Responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

### Dark mode (if needed in future):

```tsx
<div className="dark:bg-gray-900 dark:text-white">
  {/* Content */}
</div>
```

---

## Mapping dari Aplikasi Lama (Vanilla JS) ke Baru (Next.js)

| Fitur Lama | Implementasi Baru |
|----------|------------------|
| `index.html` views (SPA) | Next.js pages under `app/(dashboard)/` |
| `js/db.js` (localStorage) | PostgreSQL + backend API routes |
| `js/views/dashboard.js` | `app/(dashboard)/page.tsx` |
| `js/views/transactions.js` | `app/(dashboard)/transactions/page.tsx` + `/new/page.tsx` + `/[id]/page.tsx` |
| `js/views/customers.js` | `app/(dashboard)/customers/page.tsx` |
| `js/views/reports.js` | `app/(dashboard)/reports/page.tsx` |
| `js/views/settings.js` | `app/(dashboard)/settings/page.tsx` |
| `js/navigation.js` (SPA router) | Next.js App Router + Sidebar navigation |
| `js/utils.js` (formatters) | `lib/utils.ts` |
| Modal/Toast (vanilla JS) | React components (`components/Common/Modal.tsx`, `Toast.tsx`) |
| Form calculations (vanilla JS) | React state + `useEffect` |
| CSS classes (vanilla + tailwind) | Tailwind CSS classes only |

---

## Performance Optimization

1. **Image optimization:** Gunakan Next.js `<Image>` component
2. **Code splitting:** Automatic via Next.js
3. **Lazy loading:** Gunakan `React.lazy()` untuk non-critical components
4. **Debouncing:** Gunakan untuk search input (`useCallback` + `debounce`)

---

## Testing Strategy (Future)

- Unit tests untuk utility functions (Jest)
- Component tests untuk form components (React Testing Library)
- E2E tests untuk critical flows (Playwright)

**For MVP:** Manual testing via browser (documented di plan)

---

## Accessibility

- Semantic HTML (`<button>`, `<form>`, `<label>`)
- ARIA labels for icon buttons
- Keyboard navigation support
- Color contrast compliance

**For MVP:** Basic compliance, can improve post-launch

---

*Last Updated: 2026-08-31*
