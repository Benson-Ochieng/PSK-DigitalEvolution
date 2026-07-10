const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT COUNT(*) FROM products");
    console.log("Current product count in database:", res.rows[0].count);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
main();
