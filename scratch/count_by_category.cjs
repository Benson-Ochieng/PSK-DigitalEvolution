const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Analyzing category slugs and their product counts in the DB...");
    const res = await client.query(`
      SELECT 
        cat->>'slug' as slug, 
        cat->>'name' as name, 
        COUNT(*) as product_count
      FROM products,
      LATERAL jsonb_array_elements(categories) as cat
      GROUP BY cat->>'slug', cat->>'name'
      ORDER BY product_count DESC
    `);
    
    console.log(JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
