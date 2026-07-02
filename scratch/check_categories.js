const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Checking categories in products table...");
    const res = await client.query(`
      SELECT DISTINCT jsonb_array_elements(categories) as cat
      FROM products
      LIMIT 100
    `);
    const cats = new Set();
    res.rows.forEach(row => {
      cats.add(JSON.stringify(row.cat));
    });
    console.log("Categories found:", Array.from(cats));

    console.log("\nChecking animal_type distinct values:");
    const res2 = await client.query(`SELECT DISTINCT animal_type FROM products`);
    console.log(res2.rows);

    console.log("\nChecking total count of products:");
    const res3 = await client.query(`SELECT COUNT(*) FROM products`);
    console.log(res3.rows);

    console.log("\nChecking sample products with categories:");
    const res4 = await client.query(`
      SELECT name, categories 
      FROM products 
      WHERE categories IS NOT NULL 
      LIMIT 10
    `);
    console.log(JSON.stringify(res4.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
