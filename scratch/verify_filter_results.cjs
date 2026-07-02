const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CAT_CATEGORIES = [
  { label: "Cat Beds & Houses", slug: "cat-beds-houses" },
  { label: "Cat Bowls & Feeders", slug: "cat-bowls-and-feeders" },
  { label: "Cat Carries, Bags & Travel", slug: "cat-carriers-travels" },
  { label: "Cat Collars, Leashes, Harnesses", slug: "cat-collars-leashes-harnesses" },
  { label: "Cat Food & Treats", slug: "cat-food-and-treats" },
  { label: "Cat Grooming", slug: "cat-grooming" },
  { label: "Cat Healthcare Supplies", slug: "cat-healthcare" },
  { label: "Cat Toys", slug: "cat-toys" },
  { label: "Litter and Litter Box & Accessories", slug: "cat-litter-and-accessories" }
];

const DOG_CATEGORIES = [
  { label: "Dog Beds & Furniture", slug: "dog-beds-furniture" },
  { label: "Dog Bowls & Feeders", slug: "dog-bowls-feeders" },
  { label: "Dog Collars, Leashes & Harnesses", slug: "dog-collars-leashes-and-harnesses" },
  { label: "Dog Food & Treats", slug: "dog-food-treats" },
  { label: "Dog Grooming & Cleaning", slug: "dog-grooming-cleaning-supplies" },
  { label: "Dog Healthcare Supplies", slug: "dog-healthcare-supplies" },
  { label: "Dog Hygiene & Potty Solutions", slug: "dog-hygiene-potty-solutions" },
  { label: "Dog Toys", slug: "dog-toys" }
];

const SLUG_ALIASES = {
  "cat-food": "cat-food-and-treats",
  "dog-food": "dog-food-treats",
  "bird-food": "bird-food-treats",
  "bird-food-treats": "bird-food-treats",
};

const ANIMAL_STORE_SLUGS = {
  "cat": "cat",
  "cat-supplies-store": "cat",
  "dog": "dog",
  "dog-supplies-store": "dog",
  "bird": "bird",
  "bird-supplies-store": "bird",
  "rabbit": "rabbit",
  "rabbit-supplies-store": "rabbit",
};

async function main() {
  const client = await pool.connect();
  try {
    const categoriesPath = path.join(__dirname, '..', 'content', 'categories', '_index.json');
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

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

    const getActiveSidebarSlug = (slugStr) => {
      const sidebarSlugs = new Set([
        ...CAT_CATEGORIES.map(c => c.slug),
        ...DOG_CATEGORIES.map(c => c.slug)
      ]);
      
      let current = categories.find(c => c.slug === slugStr);
      while (current) {
        if (sidebarSlugs.has(current.slug)) {
          return current.slug;
        }
        const parentId = current.parent;
        current = categories.find(c => c.id === parentId);
      }
      return slugStr;
    };

    const testCases = [
      'cat-food',
      'cat-litter',
      'kitten-food',
      'cat-litter-and-accessories',
      'dog-food-treats'
    ];

    for (const testSlug of testCases) {
      console.log(`\n=================== TESTING SLUG: ${testSlug} ===================`);
      let canonicalSlug = testSlug;
      if (SLUG_ALIASES[canonicalSlug]) {
        canonicalSlug = SLUG_ALIASES[canonicalSlug];
      }
      console.log(`Canonical Slug: ${canonicalSlug}`);

      let categorySlug = "";
      if (!ANIMAL_STORE_SLUGS[canonicalSlug]) {
        categorySlug = canonicalSlug;
      }
      console.log(`Category Slug (for query): ${categorySlug}`);

      const descendantSlugs = getDescendants(categorySlug);
      console.log(`Descendant slugs found:`, descendantSlugs);

      const activeSidebarSlug = getActiveSidebarSlug(categorySlug);
      console.log(`Active Sidebar Slug: ${activeSidebarSlug}`);

      // Run query simulating the route query
      const res = await client.query(`
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p
        JOIN store_prices bbp  ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
        WHERE p.categories IS NOT NULL 
          AND jsonb_typeof(p.categories) = 'array' 
          AND EXISTS (
            SELECT 1 
            FROM jsonb_to_recordset(p.categories) AS x(slug text)
            WHERE x.slug = ANY($1::text[])
          )
      `, [descendantSlugs]);

      console.log(`Matching product count: ${res.rows[0].count}`);

      // Fetch sample products
      const samplesRes = await client.query(`
        SELECT p.id, p.name, p.categories
        FROM products p
        JOIN store_prices bbp  ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
        WHERE p.categories IS NOT NULL 
          AND jsonb_typeof(p.categories) = 'array' 
          AND EXISTS (
            SELECT 1 
            FROM jsonb_to_recordset(p.categories) AS x(slug text)
            WHERE x.slug = ANY($1::text[])
          )
        LIMIT 3
      `, [descendantSlugs]);
      
      console.log(`Samples:`);
      samplesRes.rows.forEach(p => {
        console.log(`  - [ID: ${p.id}] ${p.name}`);
      });
    }

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
