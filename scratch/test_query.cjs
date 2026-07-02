const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const targetSlugs = ['cat-litter-and-accessories', 'cat-litter', 'cat-litter-boxes'];
    console.log("Querying products in categories:", targetSlugs);
    const res = await client.query(`
      SELECT p.id, p.name, p.categories
      FROM products p
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_to_recordset(p.categories) AS x(slug text)
        WHERE x.slug = ANY($1::text[])
      )
      LIMIT 10
    `, [targetSlugs]);
    
    console.log(`Found ${res.rows.length} products (sample):`);
    res.rows.forEach(r => {
      console.log(`- ${r.name} | Cats: ${r.categories.map(c => c.slug).join(', ')}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
