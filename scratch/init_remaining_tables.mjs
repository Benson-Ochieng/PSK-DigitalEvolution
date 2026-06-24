import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

console.log('Initializing remaining tables in Supabase...');

async function run() {
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create coupons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code            TEXT PRIMARY KEY,
        "discountValue" NUMERIC(10,2) NOT NULL,
        "discountType"  TEXT NOT NULL,
        active          BOOLEAN DEFAULT true,
        "createdAt"     TEXT NOT NULL
      );
    `);
    console.log('✅ coupons table initialized.');

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id        TEXT PRIMARY KEY,
        title     TEXT NOT NULL,
        slug      TEXT UNIQUE NOT NULL,
        date      TEXT NOT NULL,
        content   TEXT NOT NULL,
        excerpt   TEXT,
        thumbnail TEXT,
        status    TEXT DEFAULT 'publish',
        author    TEXT DEFAULT 'System Admin'
      );
    `);
    console.log('✅ posts table initialized.');

  } catch (err) {
    console.error('❌ Error initializing remaining tables:', err);
  } finally {
    await pool.end();
  }
}

run();
