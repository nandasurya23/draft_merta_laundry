/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath =
  process.env.DOTENV_CONFIG_PATH ||
  (fs.existsSync('.env.local') ? '.env.local' : '.env.production');
require('dotenv').config({ path: envPath });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment or env file.');
  process.exit(1);
}

const isNeon =
  connectionString.includes('neon.tech') ||
  connectionString.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
  console.log('Connecting to database:', connectionString.replace(/:[^:@]+@/, ':****@'));
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'migrate.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running database migrations from db/migrate.sql...');
    await client.query(sql);
    console.log('Migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
