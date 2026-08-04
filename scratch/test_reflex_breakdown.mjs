import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const { query } = await import("../app/db.server.ts");

  const targetBrand = "reflex";

  // 1. Total products matching category or brand 'reflex' regardless of stock or clearance
  const totalRaw = await query(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM products p
    LEFT JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    WHERE (p.status IS NULL OR p.status = 'publish')
    AND (
      LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p.brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) = $1
      OR EXISTS (SELECT 1 FROM brands b WHERE b.id = p.brand_id AND LOWER(b.slug) = $1)
      OR (
        p.categories IS NOT NULL 
        AND jsonb_typeof(p.categories) = 'array' 
        AND EXISTS (
          SELECT 1 
          FROM jsonb_to_recordset(p.categories) AS x(slug text)
          WHERE LOWER(x.slug) = $1
        )
      )
      OR EXISTS (
        SELECT 1 FROM product_categories pc 
        JOIN categories c ON c.id = pc.category_id 
        WHERE pc.product_id = p.id AND LOWER(c.slug) = $1
      )
    )
  `, [targetBrand]);

  // 2. In stock vs Out of stock
  const inStockOnly = await query(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM products p
    LEFT JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    WHERE (p.status IS NULL OR p.status = 'publish')
    AND bbp.in_stock = true
    AND (
      LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p.brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) = $1
      OR EXISTS (SELECT 1 FROM brands b WHERE b.id = p.brand_id AND LOWER(b.slug) = $1)
      OR (
        p.categories IS NOT NULL 
        AND jsonb_typeof(p.categories) = 'array' 
        AND EXISTS (
          SELECT 1 
          FROM jsonb_to_recordset(p.categories) AS x(slug text)
          WHERE LOWER(x.slug) = $1
        )
      )
      OR EXISTS (
        SELECT 1 FROM product_categories pc 
        JOIN categories c ON c.id = pc.category_id 
        WHERE pc.product_id = p.id AND LOWER(c.slug) = $1
      )
    )
  `, [targetBrand]);

  // 3. In stock + Clearance excluded (Current Shop Page Filter)
  const shopQuery = await query(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM products p
    LEFT JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    WHERE p.status = 'publish'
    AND bbp.in_stock = true
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
      LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p.brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) = $1
      OR EXISTS (SELECT 1 FROM brands b WHERE b.id = p.brand_id AND LOWER(b.slug) = $1)
      OR (
        p.categories IS NOT NULL 
        AND jsonb_typeof(p.categories) = 'array' 
        AND EXISTS (
          SELECT 1 
          FROM jsonb_to_recordset(p.categories) AS x(slug text)
          WHERE LOWER(x.slug) = $1
        )
      )
      OR EXISTS (
        SELECT 1 FROM product_categories pc 
        JOIN categories c ON c.id = pc.category_id 
        WHERE pc.product_id = p.id AND LOWER(c.slug) = $1
      )
    )
  `, [targetBrand]);

  console.log("=== REFLEX BREAKDOWN ===");
  console.log("1. Total Reflex products in DB (all stock statuses):", totalRaw.rows[0].count);
  console.log("2. Reflex products with in_stock = true:", inStockOnly.rows[0].count);
  console.log("3. Reflex products in_stock = true AND clearance excluded (Shop filter):", shopQuery.rows[0].count);
}

main().catch(console.error);
