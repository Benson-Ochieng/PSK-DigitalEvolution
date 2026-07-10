const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const categoriesJson = require('../content/categories/_index.json');

const getDescendants = (slugStr) => {
  const target = categoriesJson.find(c => c.slug === slugStr);
  if (!target) return [slugStr];
  const list = [slugStr];
  const traverse = (parentId) => {
    categoriesJson.forEach(c => {
      if (c.parent === parentId) {
        list.push(c.slug);
        traverse(c.id);
      }
    });
  };
  traverse(target.id);
  return list;
};

async function testFilter(label, { categorySlug, brand, lifeStage, tagSlug }) {
  console.log(`\n=================== TESTING FILTER: ${label} ===================`);
  
  const conditions = [];
  const sqlParams = [];

  if (brand) {
    sqlParams.push(brand);
    conditions.push(`REPLACE(LOWER(p.brand), ' ', '-') = LOWER($${sqlParams.length})`);
  }

  if (lifeStage) {
    const paramIdx = sqlParams.push(JSON.stringify([{ slug: lifeStage }]));
    conditions.push(`p.tags @> $${paramIdx}::jsonb`);
  }

  if (tagSlug) {
    const paramIdx = sqlParams.push(JSON.stringify([{ slug: tagSlug }]));
    conditions.push(`p.tags @> $${paramIdx}::jsonb`);
  }

  if (categorySlug) {
    const descendantSlugs = getDescendants(categorySlug);
    sqlParams.push(descendantSlugs);
    conditions.push(`
      p.categories IS NOT NULL 
      AND jsonb_typeof(p.categories) = 'array' 
      AND EXISTS (
        SELECT 1 
        FROM jsonb_to_recordset(p.categories) AS x(slug text)
        WHERE x.slug = ANY($${sqlParams.length}::text[])
      )
    `);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const queryText = `
    SELECT
      p.id, p.name, p.brand, p.tags
    FROM products p
    ${where}
    LIMIT 5
  `;

  try {
    const res = await pool.query(queryText, sqlParams);
    console.log(`Query found ${res.rows.length} sample results (total count or matching query):`);
    res.rows.forEach(r => {
      console.log(`- [ID: ${r.id}] ${r.name} (Brand: ${r.brand})`);
    });
  } catch (err) {
    console.error("Error executing query:", err);
  }
}

async function run() {
  // Test 1: Category "puppy-food" + Brand "Bonnie" + Life Stage "puppy"
  await testFilter("Puppy Food + Bonnie + Puppy", {
    categorySlug: "puppy-food",
    brand: "Bonnie",
    lifeStage: "puppy"
  });

  // Test 1b: Category "dry-dog-food" + Brand "Bonnie" + Life Stage "adult"
  await testFilter("Dry Dog Food + Bonnie + Adult", {
    categorySlug: "dry-dog-food",
    brand: "Bonnie",
    lifeStage: "adult"
  });

  // Test 2: Category "dry-cat-food" + Brand "Reflex" + Life Stage "kitten"
  await testFilter("Dry Cat Food + Reflex + Kitten", {
    categorySlug: "dry-cat-food",
    brand: "Reflex",
    lifeStage: "kitten"
  });

  // Test 3: Category "dog-food-treats" + Brand "Montego" + Life Stage "adult"
  await testFilter("Dog Food & Treats + Montego + Adult", {
    categorySlug: "dog-food-treats",
    brand: "Montego",
    lifeStage: "adult"
  });

  await pool.end();
}

run();
