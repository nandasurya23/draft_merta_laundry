# Local Development Setup Guide

## Prerequisites

- Node.js v18+
- PostgreSQL 12+ (installed locally or Docker)

## Step 1: Install Dependencies

Already done! Run:
```bash
npm install
```

## Step 2: Setup PostgreSQL Database Locally

### Option A: Using macOS Homebrew
```bash
# Install PostgreSQL (if not already installed)
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb merta_laundry

# Verify connection
psql -d merta_laundry -c "SELECT version();"
```

### Option B: Using Docker
```bash
docker run --name merta-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Wait a few seconds then create database
docker exec merta-pg createdb -U postgres merta_laundry
```

## Step 3: Setup Environment Variables (.env.local)

Copy the example environment file to `.env.local`:
```bash
cp .env.example .env.local
```

Default `.DATABASE_URL` in `.env.local` should work if using default local Postgres:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/merta_laundry
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters
NODE_ENV=development
```

If your PostgreSQL has different credentials, update `.env.local` accordingly.

## Step 4: Run Database Migrations

```bash
npm run db:migrate
```

This will create all tables (users, customers, settings, transactions) from `db/schema.sql`.

## Step 5: Seed Initial Data

```bash
npm run db:seed
```

This will:
- Create 3 users: Owner (PIN 1111), Pegawai A (PIN 2222), Pegawai B (PIN 3333)
- Insert default settings (laundry name, address, default prices)
- All PINs are bcrypt-hashed (never plaintext)

## Step 6: Verify Database

```bash
psql -d merta_laundry -c "SELECT * FROM users;"
```

You should see 3 user records (names visible, pins hashed).

## Step 7: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should be redirected to `/login` page (since no session yet).

## Step 8: Test Login

Try logging in with PIN: **1111** (Owner)

If successful:
- ✅ Session cookie is set
- ✅ Redirected to dashboard
- ✅ Full stack is working!

---

## Troubleshooting

### "ECONNREFUSED" error
- Postgres is not running. Start it with `brew services start postgresql` or Docker.

### "FATAL: database "merta_laundry" does not exist"
- Run `createdb merta_laundry` first.

### "EAUTH" error during seed
- Check .env.local DATABASE_URL credentials match your Postgres user/password.

### PIN validation fails
- Wait for the code to implement Phase 2 (Authentication). Phase 1 only sets up DB structure.

---

## Production Deployment (Neon)

When ready to deploy to Netlify:

1. Create account on [Neon.tech](https://neon.tech)
2. Create a new PostgreSQL database
3. Copy the connection string (looks like: `postgresql://user:password@host.neon.tech/merta_laundry?sslmode=require`)
4. In Netlify dashboard, set environment variables:
   - `DATABASE_URL` = Neon connection string
   - `SESSION_SECRET` = Generate with: `openssl rand -base64 32`

---

## Next: Phase 2 - Authentication

Once setup is verified locally, we'll implement:
- `lib/auth.ts` (PIN hash/verify, JWT session)
- `POST /api/auth/login` (authentication endpoint)
- `middleware.ts` (route protection)
- `app/login/page.tsx` (login UI)

See `docs/implementation.md` for full timeline.
