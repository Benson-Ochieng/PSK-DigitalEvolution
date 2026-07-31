import { query } from "../app/db.server";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  console.log("=== INVESTIGATING PRODUCT COUNTS ===");

  // 1. Check content/products/_index.json total count
  const productsIndexPath = path.join(process.cwd(), "content", "products", "_index.json");
  const categoriesIndexPath = path.join(process.cwd(), "content", "categories", "_index.json");

  const productsIndex = JSON.parse(fs.readFileSync(productsIndexPath, "utf-8"));
  const categoriesIndex = JSON.parse(fs.readFileSync(categoriesIndexPath, "utf-8"));

  console.log("Total products in content/products/_index.json:", productsIndex.length);
  console.log("Total categories in content/categories/_index.json:", categoriesIndex.length);

  // Find 'cat' or 'cat-food-and-treats' or 'cat-supplies-store' categories
  const catCategories = categoriesIndex.filter((c: any) =>
    c.slug.includes("cat") || c.name.toLowerCase().includes("cat")
  );
  console.log("Cat-related categories count:", catCategories.length);
  console.log("Cat categories sample:", catCategories.slice(0, 10).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, parent: c.parent, count: c.count })));

  // Query database counts
  try {
    const totalPg = await query("SELECT COUNT(*) as count FROM products WHERE status = 'publish'", []);
    console.log("PostgreSQL total published products:", totalPg.rows[0].count);

    const totalPgInStock = await query("SELECT COUNT(*) as count FROM products p JOIN store_prices sp ON sp.product_id = p.id AND sp.store_name = 'PetStore Kenya' WHERE p.status = 'publish' AND sp.in_stock = true", []);
    console.log("PostgreSQL published & in_stock products:", totalPgInStock.rows[0].count);

    // Check count for 'cat-food-and-treats' and descendants
    const getDescendantSlugs = (startSlug: string) => {
      const startCat = categoriesIndex.find((c: any) => c.slug === startSlug);
      if (!startCat) return [startSlug];
      const slugs = [startSlug];
      const traverse = (pId: number) => {
        categoriesIndex.forEach((c: any) => {
          if (c.parent === pId) {
            slugs.push(c.slug);
            traverse(c.id);
          }
        });
      };
      traverse(startCat.id);
      return slugs;
    };

    const catFoodSlugs = getDescendantSlugs("cat-food-and-treats");
    console.log("\nDescendant category slugs for 'cat-food-and-treats':", catFoodSlugs);

    const catSuppliesSlugs = getDescendantSlugs("cat-supplies-store");
    console.log("Descendant category slugs for 'cat-supplies-store' (Cat):", catSuppliesSlugs);

    // Query DB for cat-food-and-treats WITH and WITHOUT in_stock / animal_type filters
    const catFoodAll = await query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      WHERE p.status = 'publish' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text)
        WHERE c.slug = ANY($1::text[])
      )
    `, [catFoodSlugs]);
    console.log("\n[cat-food-and-treats] All published products in DB:", catFoodAll.rows[0].count);

    const catFoodInStock = await query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      JOIN store_prices sp ON sp.product_id = p.id AND sp.store_name = 'PetStore Kenya'
      WHERE p.status = 'publish' AND sp.in_stock = true AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text)
        WHERE c.slug = ANY($1::text[])
      )
    `, [catFoodSlugs]);
    console.log("[cat-food-and-treats] Published + in_stock products:", catFoodInStock.rows[0].count);

    const catFoodInStockWithAnimal = await query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      JOIN store_prices sp ON sp.product_id = p.id AND sp.store_name = 'PetStore Kenya'
      WHERE p.status = 'publish' AND sp.in_stock = true AND p.animal_type = 'cat' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text)
        WHERE c.slug = ANY($1::text[])
      )
    `, [catFoodSlugs]);
    console.log("[cat-food-and-treats] Published + in_stock + animal_type='cat' products:", catFoodInStockWithAnimal.rows[0].count);


    // Same for 'cat-supplies-store' (Cat)
    const catSuppliesAll = await query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      WHERE p.status = 'publish' AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text)
        WHERE c.slug = ANY($1::text[])
      )
    `, [catSuppliesSlugs]);
    console.log("\n[cat-supplies-store / Cat] All published products in DB:", catSuppliesAll.rows[0].count);

    const catSuppliesInStock = await query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      JOIN store_prices sp ON sp.product_id = p.id AND sp.store_name = 'PetStore Kenya'
      WHERE p.status = 'publish' AND sp.in_stock = true AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.categories) AS c(slug text)
        WHERE c.slug = ANY($1::text[])
      )
    `, [catSuppliesSlugs]);
    console.log("[cat-supplies-store / Cat] Published + in_stock products:", catSuppliesInStock.rows[0].count);

  } catch (err: any) {
    console.error("DB Query error:", err.message);
  }

  process.exit(0);
}

run();
