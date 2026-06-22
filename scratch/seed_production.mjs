/**
 * Seed production database
 * node scratch/seed_production.mjs
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'postgres://postgres:n380fia9QZLvzb2twZkUsk4YCbWAYlsva4jf11UvofbCJ6GwyXf5PAV9Md2Dwwjh@46.225.146.51:5432/postgres';
const DB_NAME  = 'petstore_aggregator';
const PROD_URL = BASE_URL.replace(/\/postgres$/, `/${DB_NAME}`);

async function run() {
  // Step 1: create database
  console.log(`\n1️⃣  Connecting to create '${DB_NAME}'...`);
  const adminPool = new pg.Pool({ connectionString: BASE_URL, ssl: false });
  try {
    const exists = await adminPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
    if (exists.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`   ✅ Database '${DB_NAME}' created.`);
    } else {
      console.log(`   ℹ️  Database '${DB_NAME}' already exists — will re-seed.`);
    }
  } finally {
    await adminPool.end();
  }

  // Step 2: run schema + seed
  console.log(`\n2️⃣  Running production.sql...`);
  const appPool = new pg.Pool({ connectionString: PROD_URL, ssl: false });
  try {
    const sql = readFileSync(path.join(__dirname, '..', 'production.sql'), 'utf8');
    await appPool.query(sql);
    console.log(`   ✅ Schema + seed complete.`);

    const { rows } = await appPool.query(`
      SELECT
        (SELECT COUNT(*) FROM products)     AS products,
        (SELECT COUNT(*) FROM store_prices) AS prices
    `);
    console.log(`\n3️⃣  Sanity check:`);
    console.log(`   Products: ${rows[0].products}  |  Prices: ${rows[0].prices}`);
  } finally {
    await appPool.end();
  }

  console.log(`\n🎉  Done! Production DB URL:\n   ${PROD_URL}\n`);
}

run().catch(err => { console.error('\n❌', err.message); process.exit(1); });
