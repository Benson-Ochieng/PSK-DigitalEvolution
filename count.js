import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 1. Load categories
    const categoriesPath = path.join(process.cwd(), 'content', 'categories', '_index.json');
    if (!fs.existsSync(categoriesPath)) {
      console.error('Categories file not found at:', categoriesPath);
      return;
    }
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    console.log(`Loaded ${categories.length} categories.`);

    // 2. Helper to get descendants (matching shop.tsx)
    const getDescendants = (slugStr) => {
      const target = categories.find(c => c.slug === slugStr);
      if (!target) return [slugStr];
      const list = [slugStr];
      const traverse = (parentId) => {
        categories.forEach(c => {
          if (c.parent === parentId) {
            list.push(c.slug);
            traverse(c.id);
          }
        });
      };
      traverse(target.id);
      return list;
    };

    console.log('\n--- Category Product Counts (status = \'publish\') ---');
    
    // 3. Query count for each category
    for (const cat of categories) {
      const descendants = getDescendants(cat.slug);
      
      const queryStr = `
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p
        JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
        WHERE p.status = 'publish'
          AND p.categories IS NOT NULL 
          AND jsonb_typeof(p.categories) = 'array' 
          AND EXISTS (
            SELECT 1 
            FROM jsonb_to_recordset(p.categories) AS x(slug text)
            WHERE x.slug = ANY($1::text[])
          )
      `;

      const res = await pool.query(queryStr, [descendants]);
      const count = Number(res.rows[0].count);
      
      // Print categories that have products or are top-level to inspect
      if (count > 0 || cat.parent === 0) {
        console.log(`Category: "${cat.name}" | Slug: "${cat.slug}" | Count: ${count}`);
      }
    }

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await pool.end();
  }
}

run();
