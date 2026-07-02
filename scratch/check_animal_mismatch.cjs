const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Checking mismatch where category is cat-litter but animal_type is not 'cat':");
    const res = await client.query(`
      SELECT id, name, animal_type, categories
      FROM products
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_to_recordset(categories) AS x(slug text)
        WHERE x.slug = 'cat-litter'
      ) AND (animal_type != 'cat' OR animal_type IS NULL)
      LIMIT 10
    `);
    console.log(JSON.stringify(res.rows, null, 2));

    console.log("\nChecking mismatch where category starts with 'dog' or is 'dog-supplies-store' etc, but animal_type is not 'dog':");
    const res2 = await client.query(`
      SELECT id, name, animal_type, categories
      FROM products
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_to_recordset(categories) AS x(slug text)
        WHERE x.slug LIKE 'dog-%'
      ) AND (animal_type != 'dog' OR animal_type IS NULL)
      LIMIT 10
    `);
    console.log(res2.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
