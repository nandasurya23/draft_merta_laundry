# Implementation Guide & Timeline

## Ringkasan Eksekusi
Document ini berisi detail timeline, dependencies, dan checklist untuk implementasi migrasi Merta Laundry dari Vanilla JS ke Full-Stack Next.js dalam deadline 1 minggu.

**Timeline: 7 hari calendar**  
**Start: 2026-09-01 (Monday)**  
**End: 2026-09-07 (Sunday)**

---

## Dependencies & Tech Stack

### Runtime Dependencies

**package.json akan include:**

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pg": "^8.11.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.0.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.263.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/node": "^20.5.0",
    "@types/react": "^18.2.0",
    "@types/pg": "^8.11.0",
    "@types/bcryptjs": "^2.4.2",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.48.0",
    "eslint-config-next": "^14.0.0",
    "@netlify/plugin-nextjs": "^4.40.0"
  }
}
```

### System Requirements

- **Node.js:** v18+ (LTS)
- **PostgreSQL:** 12+ (lokal untuk dev)
- **npm/pnpm:** v8+

---

## Phase-by-Phase Timeline

### **Hari 1 (Monday) — Setup & Infrastructure**

**Durasi: Full day**

#### Task 1.1: Setup Project Structure ✅
- `npm create next-app@latest` → yes all defaults
- Setup TypeScript configuration
- Setup Tailwind CSS (auto dari Next.js setup)
- Remove default pages, setup folder structure per `docs/frontend.md`

**Files created:**
- `next.config.js`
- `tailwind.config.ts`
- `tsconfig.json`
- Basic `app/layout.tsx`

**Time estimate:** 30 min

#### Task 1.2: PostgreSQL Setup ✅
- Pastikan PostgreSQL running lokal (brew services start postgresql)
- Create database: `createdb merta_laundry`
- Create `.env.local` dengan `DATABASE_URL=postgresql://postgres:password@localhost:5432/merta_laundry`

**Time estimate:** 20 min

#### Task 1.3: Database Schema ✅
- Create `db/schema.sql` (dari `docs/database.md`)
- Run: `psql merta_laundry < db/schema.sql`
- Verify tables: `\dt` dalam psql

**Files created:**
- `db/schema.sql`

**Time estimate:** 20 min

#### Task 1.4: Database Seeding ✅
- Create Node.js script `db/seed.js`:
  - Hash 3 PIN dengan bcryptjs
  - Insert users (Owner, Pegawai A, Pegawai B)
  - Insert default settings (laundry name, harga kiloan/satuan)
- Run script: `node db/seed.js`
- Verify data: SELECT * FROM users; SELECT * FROM settings;

**Files created:**
- `db/seed.js`
- `db/seed.sql` (generated dari script)

**Time estimate:** 30 min

#### Task 1.5: Netlify Config ✅
- Create `netlify.toml`
- Add `@netlify/plugin-nextjs` configuration

**Files created:**
- `netlify.toml`

**Time estimate:** 15 min

#### Task 1.6: Database Connection Library ✅
- Create `lib/db.ts` → export Pool singleton
- Test connection: `npm run dev` → no errors

**Files created:**
- `lib/db.ts`

**Time estimate:** 20 min

**End of Day 1: Infrastructure ready, database seeded, can start coding**

---

### **Hari 2 (Tuesday) — Authentication System**

**Durasi: Full day**

#### Task 2.1: Auth Library ✅
- Create `lib/auth.ts`:
  - `hashPin(pin: string)` → bcryptjs.hash
  - `verifyPin(pin, hash)` → bcryptjs.compare
  - `signSession(user)` → jose JWT
  - `verifySession(token)` → jose verify
  - `getCurrentUser(req)` → extract from cookie

**Files created:**
- `lib/auth.ts`
- `.env.local` update dengan `SESSION_SECRET`

**Time estimate:** 45 min

#### Task 2.2: Validation Schemas ✅
- Create `lib/validation.ts` dengan Zod schemas:
  - LoginSchema
  - CustomerSchema
  - TransactionSchema
  - SettingsSchema

**Files created:**
- `lib/validation.ts`

**Time estimate:** 45 min

#### Task 2.3: Login API Route ✅
- Create `app/api/auth/login/route.ts`
- Implement PIN verification logic
- Rate limiting (failed_attempts tracking)
- Set httpOnly cookie

**Files created:**
- `app/api/auth/login/route.ts`

**Test:**
- `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"pin":"1111"}'`
- Should return success + set cookie

**Time estimate:** 60 min

#### Task 2.4: Logout API Route ✅
- Create `app/api/auth/logout/route.ts`
- Clear cookie

**Files created:**
- `app/api/auth/logout/route.ts`

**Time estimate:** 15 min

#### Task 2.5: Auth/Me API Route ✅
- Create `app/api/auth/me/route.ts`
- Extract user dari session cookie

**Files created:**
- `app/api/auth/me/route.ts`

**Time estimate:** 15 min

#### Task 2.6: Middleware ✅
- Create `middleware.ts` di root
- Protect all routes kecuali /login, /api/auth/login

**Files created:**
- `middleware.ts`

**Time estimate:** 30 min

#### Task 2.7: Login Page UI ✅
- Create `app/login/page.tsx`
- Form: PIN input, submit button, error display
- Redirect ke `/` if logged in
- Call `/api/auth/login`, handle response

**Files created:**
- `app/login/page.tsx`

**Test:**
- Visit http://localhost:3000
- Should redirect ke /login
- Login dengan PIN 1111 atau 2222 atau 3333
- Should redirect ke dashboard

**Time estimate:** 60 min

**End of Day 2: Full auth system working (login → dashboard), middleware protecting routes**

---

### **Hari 3 (Wednesday) — Backend API (Part 1)**

**Durasi: Full day**

#### Task 3.1: Customers API ✅
- Create `app/api/customers/route.ts` (GET, POST)
- Create `app/api/customers/[id]/route.ts` (PATCH, DELETE)
- Implement CRUD logic per `docs/backend.md`
- Database queries (raw SQL, parameterized)

**Files created:**
- `app/api/customers/route.ts`
- `app/api/customers/[id]/route.ts`

**Test:**
```bash
# POST (create)
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Bapak Budi","phone":"0811111111"}'

# GET (list)
curl http://localhost:3000/api/customers

# PATCH (update)
curl -X PATCH http://localhost:3000/api/customers/[id] \
  -H "Content-Type: application/json" \
  -d '{"name":"Bapak Budi Baru"}'

# DELETE
curl -X DELETE http://localhost:3000/api/customers/[id]
```

**Time estimate:** 90 min

#### Task 3.2: Settings API ✅
- Create `app/api/settings/route.ts` (GET, PUT)
- Update laundry profile, harga kiloan/satuan

**Files created:**
- `app/api/settings/route.ts`

**Test:**
```bash
# GET
curl http://localhost:3000/api/settings

# PUT
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"laundryName":"Merta Laundry Baru",...}'
```

**Time estimate:** 60 min

#### Task 3.3: Transactions API (GET, POST) ✅
- Create `app/api/transactions/route.ts` (GET, POST)
- Implement filtering (search, date, status)
- Implement create with auto-calculation & invoice generation
- Update customer counters

**Files created:**
- `app/api/transactions/route.ts`

**Test:**
```bash
# GET
curl http://localhost:3000/api/transactions?search=TRX

# POST
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Bapak Budi","type":"KILOAN",...}'
```

**Time estimate:** 120 min

#### Task 3.4: Transactions Detail API (GET, PATCH, DELETE) ✅
- Create `app/api/transactions/[id]/route.ts`
- Implement status updates, delete with customer counter updates

**Files created:**
- `app/api/transactions/[id]/route.ts`

**Time estimate:** 60 min

**End of Day 3: Core CRUD APIs working (customers, settings, transactions)**

---

### **Hari 4 (Thursday) — Backend API (Part 2) & Frontend Layout**

**Durasi: Full day**

#### Task 4.1: Reports API ✅
- Create `app/api/reports/route.ts` (GET)
- Period filtering (today, week, month, all)
- Calculate metrics (total, lunas, belum bayar)

**Files created:**
- `app/api/reports/route.ts`

**Time estimate:** 60 min

#### Task 4.2: Reports Export (CSV) ✅
- Create `app/api/reports/export/route.ts`
- Generate CSV dengan proper encoding
- Return dengan `Content-Disposition: attachment`

**Files created:**
- `app/api/reports/export/route.ts`

**Time estimate:** 45 min

#### Task 4.3: Frontend Common Components ✅
- Create `components/Common/Button.tsx`
- Create `components/Common/Input.tsx`
- Create `components/Common/Select.tsx`
- Create `components/Common/Modal.tsx`
- Create `components/Common/Toast.tsx`
- Create `components/Common/Loader.tsx`

**Files created:** 6 files

**Time estimate:** 90 min

#### Task 4.4: Layout Components ✅
- Create `components/Sidebar.tsx` (navigation menu)
- Create `components/Topbar.tsx` (header, logout)
- Create `components/Layout/ProtectedLayout.tsx` (wrapper untuk auth check)

**Files created:** 3 files

**Time estimate:** 90 min

#### Task 4.5: Dashboard Layout Setup ✅
- Create `app/(dashboard)/layout.tsx`
- Use Sidebar + Topbar + <children>
- Add basic Tailwind styling

**Files created:**
- `app/(dashboard)/layout.tsx`

**Time estimate:** 45 min

**End of Day 4: All APIs done, layout framework ready**

---

### **Hari 5 (Friday) — Frontend Pages (Part 1)**

**Durasi: Full day**

#### Task 5.1: Dashboard Page ✅
- Create `app/(dashboard)/page.tsx`
- Fetch metrics from `/api/reports` + `/api/transactions`
- Display 4 metric cards + recent transactions table
- Add "Create Transaction" button

**Files created:**
- `app/(dashboard)/page.tsx`
- `components/Dashboard/MetricsCard.tsx` (optional reusable)

**Time estimate:** 90 min

#### Task 5.2: Transactions List Page ✅
- Create `app/(dashboard)/transactions/page.tsx`
- Search box, 3 filter dropdowns
- Table dengan 9 kolom
- Pagination or simple "show all"
- "Detail" button → link ke `[id]`

**Files created:**
- `app/(dashboard)/transactions/page.tsx`
- `components/Transactions/TransactionList.tsx` (optional)

**Time estimate:** 120 min

#### Task 5.3: Create Transaction Page (Setup) ✅
- Create `app/(dashboard)/transactions/new/page.tsx`
- Layout: 2 columns (left form, right summary)
- Fetch customers & settings on load
- Setup state for form

**Files created:**
- `app/(dashboard)/transactions/new/page.tsx`
- `components/Transactions/TransactionForm.tsx` (big component)

**Time estimate:** 120 min

#### Task 5.4: Transaction Form Logic ✅
- Customer selector (dropdown dengan existing customers)
- Transaction type selector (3 radios)
- Dynamic sections (kiloan, satuan, kiloan_satuan)
- Real-time grand total calculation
- Submit → POST `/api/transactions` → redirect ke `/transactions/[id]`

**Files created:** (part of TransactionForm.tsx)

**Time estimate:** 120 min

**End of Day 5: Dashboard + transaction list + create form (basic, untested)**

---

### **Hari 6 (Saturday) — Frontend Pages (Part 2) & Testing**

**Durasi: Full day**

#### Task 6.1: Transaction Detail Page ✅
- Create `app/(dashboard)/transactions/[id]/page.tsx`
- Fetch transaction from API
- Display invoice layout
- Update status dropdown, "Mark Paid" button
- Delete button + confirmation
- Print button (CSS @media print)

**Files created:**
- `app/(dashboard)/transactions/[id]/page.tsx`
- `components/Transactions/TransactionDetail.tsx` (optional)
- Print CSS (inline or in global)

**Time estimate:** 120 min

#### Task 6.2: Customers Page ✅
- Create `app/(dashboard)/customers/page.tsx`
- List table, search box
- "Add Customer" button → modal
- Edit/Delete buttons
- Modal form (add/edit)
- API integration (POST, PATCH, DELETE)

**Files created:**
- `app/(dashboard)/customers/page.tsx`
- `components/Customers/CustomerList.tsx` (optional)
- `components/Customers/CustomerModal.tsx`
- `components/Customers/CustomerForm.tsx`

**Time estimate:** 120 min

#### Task 6.3: Reports & Settings Pages ✅
- Create `app/(dashboard)/reports/page.tsx`
- Period filter, 4 metric cards, "Export CSV" button
- Create `app/(dashboard)/settings/page.tsx`
- Laundry profile form, kiloan prices table, satuan prices table
- Add/edit/delete price rows

**Files created:**
- `app/(dashboard)/reports/page.tsx`
- `app/(dashboard)/settings/page.tsx`
- `components/Reports/ReportMetrics.tsx`
- `components/Settings/LaundryProfileForm.tsx`
- `components/Settings/PriceManagement.tsx`

**Time estimate:** 120 min

#### Task 6.4: Manual Testing & Bug Fixes ✅
- Test login flow (PIN 1111, 2222, 3333)
- Test all pages navigation
- Test create transaction (KILOAN, SATUAN, KILOAN_SATUAN)
- Test customer add/edit/delete
- Test report filtering
- Test CSV export
- Test logout
- Test rate limiting (5 wrong PINs)
- Test accessing protected routes without login

**Time estimate:** 120 min

**End of Day 6: All pages implemented & manually tested**

---

### **Hari 7 (Sunday) — Polish & Deployment**

**Durasi: Half day (morning/afternoon)**

#### Task 7.1: Lint & Typecheck ✅
- Run `npm run lint` → fix all issues
- Run `npx tsc --noEmit` → fix all type errors
- Run `npm run build` → ensure clean build

**Time estimate:** 60 min

#### Task 7.2: Bug Fixes & Polish ✅
- Fix any critical bugs found
- Improve error messages
- Add loading states to all buttons
- Add success/error toasts

**Time estimate:** 60 min

#### Task 7.3: Clean Up Legacy Files ✅
- Delete `index.html`
- Delete `css/` folder
- Delete `js/` folder (vanilla JS)
- Keep all docs in `docs/` folder

**Time estimate:** 15 min

#### Task 7.4: Final Verification ✅
- Test end-to-end workflow:
  1. Login
  2. Create transaction (all 3 types)
  3. View dashboard metrics
  4. Update transaction status
  5. Mark paid
  6. Print nota
  7. Create customer
  8. Update settings
  9. View reports & export CSV
  10. Logout

**Time estimate:** 45 min

#### Task 7.5: Prepare for Deployment ✅
- Ensure `.env.local` has `DATABASE_URL` & `SESSION_SECRET`
- Create `.env.production` template untuk Neon
- Commit final code
- Push ke GitHub (jika ada remote)

**Time estimate:** 30 min

#### Task 7.6: Deploy to Netlify ✅
- Setup Netlify account
- Connect GitHub repo
- Add env vars (DATABASE_URL untuk Neon, SESSION_SECRET)
- Deploy
- Test production login + 1 transaksi flow

**Time estimate:** 45 min

**End of Day 7: Production deployed & verified**

---

## Success Criteria

✅ **Hari 1 End:** Database seeded, Node project running  
✅ **Hari 2 End:** Login & auth working  
✅ **Hari 3 End:** All CRUD APIs working  
✅ **Hari 4 End:** Layout & common components ready  
✅ **Hari 5 End:** Main 4 pages (dashboard, transactions list, create, customers) implemented  
✅ **Hari 6 End:** All pages done, manual testing complete  
✅ **Hari 7 End:** Deployed to Netlify, production verified  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Database connection issues | Test connection first (Hari 1), use simple `pg` Pool |
| Auth complexity | Use `jose` library (well-tested), test early (Hari 2) |
| API data mismatch | Strict Zod validation, test each API with curl before UI |
| Frontend bugs | Manual test each page, fix ASAP (Hari 6) |
| Deployment issues | Test locally first, setup Netlify early, doc env vars |
| Deadline pressure | Break into smaller tasks, prioritize critical paths |

---

## Rollback Plan

If critical blocker encountered:
1. **Database issue:** Rollback to fresh schema, re-seed
2. **Auth issue:** Revert auth.ts, use simpler session method (next-auth)
3. **API issue:** Debug with curl, check SQL queries
4. **UI issue:** Fallback to basic HTML forms (no fancy components)

**Key: Do NOT panic. Each component is testable independently.**

---

## Post-Launch Tasks (Not in 1-week scope)

- [ ] Unit & integration tests
- [ ] Performance optimization (caching, pagination optimization)
- [ ] Analytics/monitoring (error logging)
- [ ] Backup strategy (automated backups)
- [ ] Mobile app (future)
- [ ] Advanced reporting (charts, graphs)
- [ ] Multi-laundry support

---

## Documentation Maintenance

- Update `docs/database.md` if schema changes
- Update `docs/backend.md` if new APIs added
- Update `docs/frontend.md` if components change
- Keep this `implementation.md` updated with actual vs planned timings

---

*Last Updated: 2026-08-31*  
*Execution Start: 2026-09-01*  
*Execution End: 2026-09-07*
