import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const brandSlug = "reflex";

    // Query categories for brand Reflex
    const res = await pool.query(`
      SELECT 
        c.slug, 
        c.name,
        COUNT(DISTINCT p.id) as count
      FROM products p
      CROSS JOIN LATERAL jsonb_to_recordset(p.categories) AS c(id int, name text, slug text)
      WHERE (p.status IS NULL OR p.status = 'publish')
        AND (
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p.brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) = $1
          OR EXISTS (SELECT 1 FROM brands b WHERE b.id = p.brand_id AND LOWER(b.slug) = $1)
        )
        AND c.slug NOT IN ('dog-supplies-store', 'cat-supplies-store', 'dog', 'cat', 'dog-food', 'cat-food', 'dog-food-treats', 'cat-food-and-treats', 'sale', 'clearance', 'bundles')
      GROUP BY c.slug, c.name
      ORDER BY c.name ASC
    `, [brandSlug]);

    console.log("Reflex brand categories count:", res.rows.length);
    console.log(res.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
