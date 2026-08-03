import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const catId = 2330; // cat-treats

    const res = await pool.query(`
      SELECT p.id, p.name, p.brand, p.categories
      FROM products p
      WHERE (p.status IS NULL OR p.status = 'publish')
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(p.categories) elem
          WHERE (elem->>'id')::int = $1
        )
      ORDER BY p.brand, p.name
    `, [catId]);

    const byBrand = {};
    for (const r of res.rows) {
      const b = r.brand || "UNBRANDED";
      if (!byBrand[b]) byBrand[b] = [];
      byBrand[b].push(r.name);
    }

    console.log("Products count per brand in cat-treats:");
    for (const [b, items] of Object.entries(byBrand)) {
      console.log(`- ${b}: ${items.length} products`);
      console.log(`  Sample:`, items.slice(0, 2));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
