const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT id, name, categories 
      FROM products 
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_to_recordset(categories) AS x(slug text) 
        WHERE x.slug = 'kitten-food'
      ) AND LOWER(name) NOT LIKE '%kitten%'
    `);
    console.log("Kitten products missed by text-search:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
