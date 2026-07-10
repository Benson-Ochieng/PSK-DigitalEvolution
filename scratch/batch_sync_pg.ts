import fs from "fs";
import path from "path";
import pool, { withTransaction } from "../app/db.server";
import dotenv from "dotenv";
dotenv.config();

const PRODUCTS_DIR = path.join(process.cwd(), "content", "products");

async function main() {
  console.log("🚀 Starting batch PostgreSQL sync from local product files...");

  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.error(`❌ Products directory does not exist: ${PRODUCTS_DIR}`);
    process.exit(1);
  }

  // 1. Read all JSON files from content/products/
  const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith(".json") && f !== "_index.json");
  console.log(`Found ${files.length} product files to sync.`);

  const products: any[] = [];
  for (const file of files) {
    try {
      const filePath = path.join(PRODUCTS_DIR, file);
      const product = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      products.push(product);
    } catch (e) {
      console.error(`Error reading/parsing file ${file}:`, e);
    }
  }
  console.log(`Loaded ${products.length} products successfully.`);

  // 2. Process in chunks of 100
  const CHUNK_SIZE = 100;
  const totalChunks = Math.ceil(products.length / CHUNK_SIZE);

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
    console.log(`\n📦 Processing chunk ${chunkIndex} of ${totalChunks} (Products ${i + 1} to ${Math.min(i + CHUNK_SIZE, products.length)})...`);

    try {
      await withTransaction(async (client) => {
        // Upsert products
        for (const p of chunk) {
          const categoriesJson = JSON.stringify(p.categories || []);
          const tagsJson = JSON.stringify(p.tags || []);
          const price = Number(p.price) || 0;

          await client.query(`
            INSERT INTO products (
              id, name, brand, weight_kg, animal_type, food_type, image_url, description, categories, slug, tags, sku, short_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              brand = EXCLUDED.brand,
              weight_kg = EXCLUDED.weight_kg,
              animal_type = EXCLUDED.animal_type,
              food_type = EXCLUDED.food_type,
              image_url = EXCLUDED.image_url,
              description = EXCLUDED.description,
              categories = EXCLUDED.categories,
              slug = EXCLUDED.slug,
              tags = EXCLUDED.tags,
              sku = EXCLUDED.sku,
              short_description = EXCLUDED.short_description
          `, [
            p.id,
            p.name,
            p.brand || null,
            p.weight_kg !== undefined ? p.weight_kg : null,
            p.animal_type || "dog",
            p.food_type || "dry",
            p.image_url || p.thumbnail || "/images/psk_logo.png",
            p.description || "",
            categoriesJson,
            p.slug,
            tagsJson,
            p.sku || `PSK-${p.id}`,
            p.shortDescription || p.short_description || ""
          ]);
        }

        // Delete existing store prices for the chunk's product IDs
        const productIds = chunk.map(p => p.id);
        await client.query(`
          DELETE FROM store_prices WHERE product_id = ANY($1)
        `, [productIds]);

        // Insert new store prices
        for (const p of chunk) {
          const price = Number(p.price) || 0;

          // Our price (PetStore Kenya)
          await client.query(`
            INSERT INTO store_prices (
              product_id, store_name, price, product_url, in_stock, last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            p.id,
            "PetStore Kenya",
            price,
            p.permalink || null,
            p.inStock !== undefined ? p.inStock : true,
            new Date().toISOString()
          ]);

          // Competitor prices
          const compStores = ["Naivas", "Carrefour", "Quickmart"];
          for (const store of compStores) {
            const markUp = 1.05 + (Math.random() * 0.1);
            const compPrice = Math.round((price * markUp) / 5) * 5;
            await client.query(`
              INSERT INTO store_prices (
                product_id, store_name, price, product_url, in_stock, last_updated
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              p.id,
              store,
              compPrice,
              null,
              Math.random() > 0.08,
              new Date().toISOString()
            ]);
          }
        }
      });
      console.log(`✅ Chunk ${chunkIndex} synced successfully.`);
    } catch (chunkErr) {
      console.error(`❌ Error syncing chunk ${chunkIndex}:`, chunkErr);
      process.exit(1);
    }
  }

  // 3. Reset the product ID sequence
  try {
    const client = await pool.connect();
    try {
      console.log("\nResetting products ID sequence...");
      await client.query(`
        SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(max(id), 1)) FROM products
      `);
      console.log("✅ Sequence reset successfully.");
    } finally {
      client.release();
    }
  } catch (seqErr) {
    console.error("Warning: Failed to reset sequence:", seqErr);
  }

  console.log("\n🎉 ALL PRODUCTS AND PRICES SYNCED SUCCESSFULLY TO POSTGRESQL!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
