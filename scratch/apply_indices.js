import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const { Pool } = pg;

const urlStr = process.env.DATABASE_URL;
let ssl = { rejectUnauthorized: false };
if (urlStr) {
  const hostPart = urlStr.split("@")[1]?.split("/")[0]?.split(":")[0];
  if (hostPart) {
    const lowerHost = hostPart.toLowerCase();
    if (
      lowerHost === "localhost" ||
      lowerHost === "127.0.0.1" ||
      lowerHost === "host.docker.internal" ||
      lowerHost === "petstore-db" ||
      lowerHost === "postgres" ||
      lowerHost === "db" ||
      lowerHost === "database"
    ) {
      ssl = undefined;
    }
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: ssl
});

const sql = `
  -- Index for products brand, animal_type, food_type
  CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
  CREATE INDEX IF NOT EXISTS idx_products_animal_type ON products(animal_type);
  CREATE INDEX IF NOT EXISTS idx_products_food_type ON products(food_type);

  -- GIN Index for JSONB categories and tags
  CREATE INDEX IF NOT EXISTS idx_products_categories_gin ON products USING gin(categories);
  CREATE INDEX IF NOT EXISTS idx_products_tags_gin ON products USING gin(tags);

  -- Index for store_prices queries (e.g. JOINs and filtering on PetStore Kenya)
  CREATE INDEX IF NOT EXISTS idx_store_prices_covering ON store_prices(product_id, store_name, price);

  -- Special partial indices for fast lookup of our store prices and competitor prices
  CREATE INDEX IF NOT EXISTS idx_store_prices_petstore_kenya ON store_prices(product_id, price) WHERE store_name = 'PetStore Kenya';
  CREATE INDEX IF NOT EXISTS idx_store_prices_competitors ON store_prices(product_id, price) WHERE store_name != 'PetStore Kenya';

  -- Track in _migrations table so the app knows it was run
  INSERT INTO _migrations (id, name) VALUES (9, 'add_performance_indices') ON CONFLICT (id) DO NOTHING;
`;

async function main() {
  console.log("Applying database performance indices...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Performance indices applied successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Failed to apply indices:", err);
  process.exit(1);
});
