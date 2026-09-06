-- Merta Laundry Database Schema
-- PostgreSQL

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (authentication & authorization)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'KARYAWAN',
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_id ON users(id);

-- Customers table
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

CREATE INDEX idx_customers_id ON customers(id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Settings table (single record, id always = 1)
CREATE TABLE settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  laundry_name VARCHAR(150) NOT NULL DEFAULT 'Merta Laundry',
  address TEXT,
  phone VARCHAR(20),
  kiloan_prices JSONB NOT NULL DEFAULT '[]'::jsonb,
  satuan_prices JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_id ON settings(id);

INSERT INTO settings (id, laundry_name, address, phone, kiloan_prices, satuan_prices)
VALUES (1, 'Merta Laundry', '', '', '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Transactions table (laundry notes/invoices)
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

CREATE INDEX idx_transactions_id ON transactions(id);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX idx_transactions_laundry_status ON transactions(laundry_status);
CREATE INDEX idx_transactions_created_by ON transactions(created_by_user_id);

-- Grant permissions (if needed for production)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO merta_app;
