const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // 1. Check migrations tracking table to see if our migration was applied
    const migRes = await pool.query("SELECT * FROM _migrations ORDER BY id ASC");
    console.log("Migrations applied:");
    console.log(migRes.rows);

    // 2. Query how many products now have the 'pet-care' tag
    const tagRes = await pool.query(`
      SELECT COUNT(*) 
      FROM products 
      WHERE tags @> '[{"slug": "pet-care"}]'::jsonb
    `);
    console.log("Number of products with 'pet-care' tag:", tagRes.rows[0].count);

    // 3. Query some of the products with 'pet-care' tag
    if (Number(tagRes.rows[0].count) > 0) {
      const sampleRes = await pool.query(`
        SELECT name, categories, tags 
        FROM products 
        WHERE tags @> '[{"slug": "pet-care"}]'::jsonb 
        LIMIT 5
      `);
      console.log("Sample pet-care tagged products:");
      for (const row of sampleRes.rows) {
        console.log(`- ${row.name}`);
        console.log(`  Categories: ${JSON.stringify(row.categories)}`);
        console.log(`  Tags: ${JSON.stringify(row.tags)}`);
      }
    }
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await pool.end();
  }
}

main();
