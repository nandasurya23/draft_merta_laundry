/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const envPath = process.env.DOTENV_CONFIG_PATH || (fs.existsSync('.env.local') ? '.env.local' : '.env.production');
require('dotenv').config({ path: envPath });

const isNeon =
  process.env.DATABASE_URL?.includes('neon.tech') ||
  process.env.DATABASE_URL?.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
});

async function hashPin(pin) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seed...');

    // Hash PINs
    const ownerPinHash = await hashPin('1111');
    const pegawaiAPinHash = await hashPin('2222');
    const pegawaiBPinHash = await hashPin('3333');

    // 1. Insert users
    console.log('📝 Seeding users...');
    await client.query(`
      INSERT INTO users (name, pin_hash, role) VALUES
        ($1, $2, 'OWNER'),
        ($3, $4, 'KARYAWAN'),
        ($5, $6, 'KARYAWAN')
    `, [
      'Owner', ownerPinHash,
      'Pegawai A', pegawaiAPinHash,
      'Pegawai B', pegawaiBPinHash
    ]);
    console.log('✅ Users seeded (Owner, Pegawai A, Pegawai B)');

    // 2. Insert default settings
    console.log('📝 Seeding settings...');
    const kiloanPrices = [
      { id: 'kp-001', name: 'Cuci Kering', price: 6000 },
      { id: 'kp-002', name: 'Cuci + Setrika', price: 8000 },
      { id: 'kp-003', name: 'Setrika Saja', price: 3000 },
      { id: 'kp-004', name: 'Express 24 Jam', price: 10000 }
    ];

    const satuanPrices = [
      { id: 'sp-001', name: 'Selimut Tipis', price: 15000 },
      { id: 'sp-002', name: 'Bed Cover', price: 35000 },
      { id: 'sp-003', name: 'Jas/Safari', price: 25000 },
      { id: 'sp-004', name: 'Sepatu Sneaker', price: 20000 },
      { id: 'sp-005', name: 'Karpet', price: 50000 }
    ];

    await client.query(`
      INSERT INTO settings (id, laundry_name, address, phone, kiloan_prices, satuan_prices)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        laundry_name = $2,
        address = $3,
        phone = $4,
        kiloan_prices = $5,
        satuan_prices = $6
    `, [
      1,
      'Merta Laundry',
      'Jl. Raya Sudirman No. 88',
      '081234567890',
      JSON.stringify(kiloanPrices),
      JSON.stringify(satuanPrices)
    ]);
    console.log('✅ Settings seeded (kiloan & satuan prices)');

    console.log('\n✨ Database seed completed successfully!');
    console.log('\n📌 Test user PINs (for login):\n');
    console.log('  Owner:    PIN 1111');
    console.log('  Pegawai A: PIN 2222');
    console.log('  Pegawai B: PIN 3333');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await client.end();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
