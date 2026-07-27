import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();

  const finalBulkQuery = `
    SELECT p.id, p.name FROM products p
    JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    WHERE p.status = 'publish' AND bbp.in_stock = true
    AND NOT (
      (p.categories IS NOT NULL AND jsonb_typeof(p.categories) = 'array' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text) WHERE c.slug = 'clearance'
      ))
      OR (p.tags IS NOT NULL AND jsonb_typeof(p.tags) = 'array' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.tags) AS t(slug text) WHERE t.slug = 'clearance'
      ))
      OR p.sku ILIKE '%clearance%'
      OR p.name ILIKE '%clearance%'
    )
    AND (
      p.name ILIKE 'Pack Of%'
      OR p.name ILIKE '%(Pack of%'
      OR p.name ILIKE '%-Pack of%'
      OR (p.tags IS NOT NULL AND jsonb_typeof(p.tags) = 'array' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.tags) AS t(slug text) WHERE t.slug = 'bulk'
      ))
      OR (p.categories IS NOT NULL AND jsonb_typeof(p.categories) = 'array' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text) WHERE c.slug = 'bulk'
      ))
    )
    ORDER BY p.name ASC
  `;
  const res = await client.query(finalBulkQuery);
  console.log('Final Bulk Products Count:', res.rows.length);
  console.log('First 5:', res.rows.slice(0, 5));
  console.log('Last 5:', res.rows.slice(-5));

  // Check if any donate item or backpack exists in the list
  const donateItems = res.rows.filter(r => r.name.toLowerCase().includes('donate'));
  const backpackItems = res.rows.filter(r => r.name.toLowerCase().includes('backpack'));
  console.log('Donate items in bulk list:', donateItems.length);
  console.log('Backpack items in bulk list:', backpackItems.length);

  await client.end();
}
run().catch(console.error);
