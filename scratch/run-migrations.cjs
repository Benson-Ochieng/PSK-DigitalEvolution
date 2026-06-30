const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Create _migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Check if migration 5 is applied
    const checkRes = await client.query("SELECT id FROM _migrations WHERE id = 5");
    if (checkRes.rows.length === 0) {
      console.log("Applying Migration 5 (add_tags_to_products)...");
      await client.query("BEGIN");
      
      // Execute the migration
      await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB;");
      
      // Record migration
      await client.query(
        "INSERT INTO _migrations (id, name) VALUES ($1, $2)",
        [5, 'add_tags_to_products']
      );
      
      await client.query("COMMIT");
      console.log("Migration 5 applied successfully.");
    } else {
      console.log("Migration 5 already applied.");
    }

    // 3. Seed pet-care tags
    console.log("Updating pet-care tags on products...");
    const seedRes = await client.query(`
      UPDATE products
      SET tags = COALESCE(tags, '[]'::jsonb) || '[{"name": "Pet Care", "slug": "pet-care"}]'::jsonb
      WHERE (categories @> '[{"slug": "dog-healthcare-supplies"}]'
         OR categories @> '[{"slug": "cat-healthcare"}]'
         OR categories @> '[{"slug": "dog-flea-tick"}]'
         OR categories @> '[{"slug": "cat-flea-tick"}]'
         OR categories @> '[{"slug": "dog-dewormers"}]'
         OR categories @> '[{"slug": "cat-dewormers"}]'
         OR categories @> '[{"slug": "dog-grooming-cleaning-supplies"}]'
         OR categories @> '[{"slug": "cat-grooming"}]')
        AND (tags IS NULL OR NOT (tags @> '[{"slug": "pet-care"}]'::jsonb));
    `);
    console.log(`Updated ${seedRes.rowCount} product(s) with 'pet-care' tag.`);

  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Migration/seeding failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
