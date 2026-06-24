import pg from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

console.log(`Connecting to local DB: ${dbUrl}`);

async function run() {
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    const sql = readFileSync('petstore_seed.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Local database seeded successfully.');
    
    const { rows } = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM products)     AS products,
        (SELECT COUNT(*) FROM store_prices) AS prices
    `);
    console.log(`Products: ${rows[0].products} | Prices: ${rows[0].prices}`);
  } finally {
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Error seeding local DB:', err.message);
  process.exit(1);
});
