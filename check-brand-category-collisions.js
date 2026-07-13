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
    // 1. Get unique brand slugs
    const brandRes = await pool.query("SELECT DISTINCT brand FROM products WHERE status = 'publish' AND brand IS NOT NULL");
    const brandSlugs = brandRes.rows.map(r => r.brand.toLowerCase().replace(/ /g, '-'));

    // 2. Get categories
    const categoriesPath = path.join(process.cwd(), 'content', 'categories', '_index.json');
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    const categorySlugs = categories.map(c => c.slug);

    const collisions = brandSlugs.filter(b => categorySlugs.includes(b));
    console.log("Collisions between brands and categories:", collisions);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
