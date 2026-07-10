const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Get most common tags
    console.log("=== TOP 30 PRODUCT TAGS ===");
    const tagRes = await client.query(`
      SELECT t.name, t.slug, COUNT(*) as count
      FROM products p,
      LATERAL jsonb_to_recordset(p.tags) as t(name text, slug text)
      GROUP BY t.name, t.slug
      ORDER BY count DESC
      LIMIT 30
    `);
    console.table(tagRes.rows);

    // 2. Check for life stages in tags specifically
    console.log("\n=== LIFE STAGE TAG FREQUENCY IN DATABASE ===");
    const lifeStageRes = await client.query(`
      SELECT t.name, t.slug, COUNT(*) as count
      FROM products p,
      LATERAL jsonb_to_recordset(p.tags) as t(name text, slug text)
      WHERE t.slug IN ('puppy', 'junior', 'adult', 'senior', 'kitten', 'young-adult')
      GROUP BY t.name, t.slug
      ORDER BY count DESC
    `);
    console.table(lifeStageRes.rows);

    // 3. Check for categories count
    console.log("\n=== TOP 20 PRODUCT CATEGORIES ===");
    const catRes = await client.query(`
      SELECT c.name, c.slug, COUNT(*) as count
      FROM products p,
      LATERAL jsonb_to_recordset(p.categories) as c(name text, slug text)
      GROUP BY c.name, c.slug
      ORDER BY count DESC
      LIMIT 20
    `);
    console.table(catRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
