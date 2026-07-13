import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const resCat = await pool.query(`
      SELECT COUNT(*) FROM products p 
      WHERE p.status = 'publish' 
      AND p.categories IS NOT NULL AND jsonb_typeof(p.categories) = 'array' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text) WHERE c.slug = 'clearance'
      )
    `);
    console.log("Category 'clearance' count:", resCat.rows[0].count);

    const resTag = await pool.query(`
      SELECT COUNT(*) FROM products p 
      WHERE p.status = 'publish' 
      AND p.tags IS NOT NULL AND jsonb_typeof(p.tags) = 'array' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.tags) AS t(slug text) WHERE t.slug = 'clearance'
      )
    `);
    console.log("Tag 'clearance' count:", resTag.rows[0].count);

    const resSku = await pool.query(`
      SELECT COUNT(*) FROM products p 
      WHERE p.status = 'publish' 
      AND p.sku ILIKE '%clearance%'
    `);
    console.log("SKU 'clearance' count:", resSku.rows[0].count);

    const resName = await pool.query(`
      SELECT COUNT(*) FROM products p 
      WHERE p.status = 'publish' 
      AND p.name ILIKE '%clearance%'
    `);
    console.log("Name 'clearance' count:", resName.rows[0].count);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
