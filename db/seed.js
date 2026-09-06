/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const envPath =
  process.env.DOTENV_CONFIG_PATH ||
  (fs.existsSync('.env.local') ? '.env.local' : '.env.production');
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
    console.log('🌱 Memulai seeding database...');

    // 1. Hash PINs untuk akun awal
    const ownerPinHash = await hashPin('1111');
    const pegawaiAPinHash = await hashPin('2222');
    const pegawaiBPinHash = await hashPin('3333');

    // 2. Seed akun: 1 Owner & 2 Pegawai
    console.log('📝 Seeding akun (1 Owner & 2 Pegawai)...');
    await client.query('DELETE FROM users');
    await client.query(
      `
      INSERT INTO users (name, pin_hash, role) VALUES
        ($1, $2, 'OWNER'),
        ($3, $4, 'KARYAWAN'),
        ($5, $6, 'KARYAWAN')
    `,
      [
        'Owner', ownerPinHash,
        'Pegawai A', pegawaiAPinHash,
        'Pegawai B', pegawaiBPinHash,
      ]
    );
    console.log('✅ Akun berhasil dibuat:');
    console.log('   - Owner     (Role: OWNER, PIN: 1111)');
    console.log('   - Pegawai A (Role: KARYAWAN, PIN: 2222)');
    console.log('   - Pegawai B (Role: KARYAWAN, PIN: 3333)');

    // 3. Inisialisasi pengaturan laundry kosong (TANPA mock data layanan)
    console.log('📝 Inisialisasi pengaturan laundry (kosong tanpa mock data layanan)...');
    await client.query(`
      INSERT INTO settings (id, laundry_name, address, phone, kiloan_prices, satuan_prices)
      VALUES (1, 'Merta Laundry', '', '', '[]'::jsonb, '[]'::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        address = '',
        phone = '',
        kiloan_prices = '[]'::jsonb,
        satuan_prices = '[]'::jsonb
    `);
    console.log('✅ Pengaturan diinisialisasi bersih:');
    console.log('   - Paket Kiloan: [] (0 paket)');
    console.log('   - Paket Satuan: [] (0 item)');

    console.log('\n✨ Seeding selesai 100%! Database bersih & siap dipakai produksi.');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seed gagal:', error);
  process.exit(1);
});
