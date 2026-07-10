const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const { rows } = await pool.query(
    `SELECT id, name, brand, categories, tags FROM products WHERE name ILIKE '%bonnie%' AND name ILIKE '%puppy%'`
  );
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}
main();
