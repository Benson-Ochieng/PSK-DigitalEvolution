import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 1. Get unique category slugs from DB
    const dbRes = await pool.query(`
      SELECT DISTINCT c.slug, c.name
      FROM products p,
      LATERAL jsonb_to_recordset(p.categories) AS c(id int, name text, slug text)
      WHERE p.status = 'publish'
    `);
    const dbSlugs = new Set(dbRes.rows.map(r => r.slug));
    console.log(`Unique categories in DB: ${dbSlugs.size}`);

    // 2. Load JSON categories
    const categoriesPath = path.join(process.cwd(), 'content', 'categories', '_index.json');
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    const jsonSlugs = new Set(categories.map(c => c.slug));
    console.log(`Unique categories in JSON: ${jsonSlugs.size}`);

    // 3. Find slugs that are in DB but NOT in JSON
    const missingInJson = [...dbSlugs].filter(s => !jsonSlugs.has(s));
    console.log(`\nCategories in DB but missing in JSON (_index.json): ${missingInJson.length}`);
    if (missingInJson.length > 0) {
      console.log(missingInJson.slice(0, 10));
    }

    // 4. Find slugs that are in JSON but NOT in DB
    const missingInDb = [...jsonSlugs].filter(s => !dbSlugs.has(s));
    console.log(`\nCategories in JSON but missing in DB: ${missingInDb.length}`);
    if (missingInDb.length > 0) {
      console.log(missingInDb.slice(0, 10));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
