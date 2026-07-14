import { query } from "../app/db.server";

async function main() {
  console.log("Updating extra donation products to 'draft' status...");
  const updateRes = await query(`
    UPDATE products
    SET status = 'draft'
    WHERE (name ILIKE '%donate%' OR slug ILIKE '%donate%')
      AND id NOT IN (90033, 38507, 38506, 38505, 15291)
  `);
  console.log("Updated rows:", updateRes.rowCount);

  const res = await query(`
    SELECT id, name, slug, status
    FROM products
    WHERE name ILIKE '%donate%'
    ORDER BY status DESC, name ASC
  `);
  console.log("Products in database after update:");
  for (const row of res.rows) {
    console.log(`ID: ${row.id} | Name: ${row.name} | Slug: ${row.slug} | Status: ${row.status}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
