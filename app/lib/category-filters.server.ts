import { query } from "../db.server";
import fs from "fs";
import path from "path";

export type SidebarItem = {
  name: string;
  slug: string;
};

export type SidebarData = {
  mode: "categories" | "brands";
  heading: string;
  items: SidebarItem[];
};

export type BreadcrumbItem = {
  name: string;
  slug: string;
};

export type CategoryRecord = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  sort_order: number;
};

let cachedJsonCategories: any[] | null = null;

function getJsonCategories(): any[] {
  if (cachedJsonCategories) return cachedJsonCategories;
  try {
    const jsonPath = path.join(process.cwd(), "content", "categories", "_index.json");
    if (fs.existsSync(jsonPath)) {
      cachedJsonCategories = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      return cachedJsonCategories || [];
    }
  } catch (err) {
    console.error("Error reading categories JSON:", err);
  }
  return [];
}

/**
 * Ensures categories table, product_categories junction, and brands table are seeded.
 */
export async function seedCategoriesAndBrands(pool?: any) {
  const q = pool ? (sql: string, params?: any[]) => pool.query(sql, params) : query;
  try {
    // 1. Seed categories table from JSON index if table is empty or missing rows
    const catCheck = await q("SELECT COUNT(*)::int AS count FROM categories");
    const jsonCats = getJsonCategories();

    if ((catCheck.rows[0]?.count || 0) < jsonCats.length && jsonCats.length > 0) {
      console.log(`Seeding categories table (${jsonCats.length} items)...`);
      // Pass 1: Insert all nodes without parent_id constraint
      for (const cat of jsonCats) {
        await q(
          `INSERT INTO categories (id, parent_id, name, slug, sort_order)
           VALUES ($1, NULL, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             sort_order = EXCLUDED.sort_order`,
          [cat.id, cat.name, cat.slug, cat.sort_order || 0]
        );
      }
      // Pass 2: Update parent_id for nodes with valid parent
      for (const cat of jsonCats) {
        if (cat.parent && cat.parent !== 0) {
          await q(
            `UPDATE categories SET parent_id = $2 WHERE id = $1`,
            [cat.id, cat.parent]
          );
        }
      }
      await q("SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1))");
      console.log("Categories table seeding complete.");
    }

    // 2. Seed product_categories from products.categories JSONB if needed
    const pcCheck = await q("SELECT COUNT(*)::int AS count FROM product_categories");
    if ((pcCheck.rows[0]?.count || 0) === 0) {
      console.log("Seeding product_categories junction table from products JSONB...");
      await q(`
        INSERT INTO product_categories (product_id, category_id)
        SELECT DISTINCT p.id, (elem->>'id')::int
        FROM products p,
             jsonb_array_elements(p.categories) AS elem
        JOIN categories c ON c.id = (elem->>'id')::int
        ON CONFLICT DO NOTHING;
      `);
      console.log("product_categories junction seeding complete.");
    }

    // 3. Seed brands table and products.brand_id FK
    const brandCheck = await q("SELECT COUNT(*)::int AS count FROM brands");
    if ((brandCheck.rows[0]?.count || 0) === 0) {
      console.log("Seeding brands table...");
      await q(`
        INSERT INTO brands (name, slug)
        SELECT DISTINCT
          TRIM(brand) AS name,
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) AS slug
        FROM products
        WHERE brand IS NOT NULL AND TRIM(brand) != ''
        ON CONFLICT (slug) DO NOTHING;
      `);

      await q(`
        UPDATE products p
        SET brand_id = b.id
        FROM brands b
        WHERE p.brand IS NOT NULL
          AND p.brand_id IS NULL
          AND (
            LOWER(TRIM(p.brand)) = LOWER(b.name)
            OR LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p.brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) = b.slug
          );
      `);
      console.log("Brands seeding complete.");
    }
  } catch (err) {
    console.error("Error seeding categories and brands:", err);
  }
}

/**
 * Fetches category by slug (database first, JSON fallback)
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
  const normSlug = slug.toLowerCase().trim().replace(/\/$/, "");
  try {
    const res = await query(
      "SELECT id, parent_id, name, slug, sort_order FROM categories WHERE LOWER(slug) = $1 LIMIT 1",
      [normSlug]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (e) {
    console.warn("DB query failed for getCategoryBySlug, falling back to JSON:", e);
  }

  // Fallback to JSON
  const jsonCats = getJsonCategories();
  const found = jsonCats.find((c: any) => c.slug.toLowerCase() === normSlug);
  if (found) {
    return {
      id: found.id,
      parent_id: found.parent && found.parent !== 0 ? found.parent : null,
      name: found.name,
      slug: found.slug,
      sort_order: found.sort_order || 0
    };
  }
  return null;
}

/**
 * Returns direct children of a category ordered A-Z by name.
 */
export async function getCategoryDirectChildren(categoryId: number): Promise<SidebarItem[]> {
  try {
    const res = await query(
      `SELECT name, slug
       FROM categories
       WHERE parent_id = $1
       ORDER BY name ASC`,
      [categoryId]
    );
    if (res.rows.length > 0) {
      return res.rows.map(r => ({ name: r.name, slug: r.slug }));
    }
  } catch (e) {
    console.warn("DB query for direct children failed, checking JSON fallback:", e);
  }

  // Fallback to JSON
  const jsonCats = getJsonCategories();
  const children = jsonCats
    .filter((c: any) => c.parent === categoryId)
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
  return children.map((c: any) => ({ name: c.name, slug: c.slug }));
}

const NON_BRAND_SLUGS = new Set([
  "cs",
  "maasai-shukas",
  "maasai-shuka",
  "generic",
  "uncategorized",
  "none",
  "na",
  "n-a"
]);

const NO_BRAND_FILTER_CATEGORIES = new Set([
  "cat-beds-houses",
  "cat-bowls-and-feeders",
  "cat-carriers-travels",
  "cat-collars-leashes-harnesses",
  "cat-toys",
  "litter-box-accessories",
  "dog-beds-furniture",
  "dog-bowls-feeders",
  "dog-carriers-travel-accessories",
  "dog-collars-leashes-harnesses",
  "dog-toys",
  "dog-apparel-accessories"
]);

/**
 * Returns distinct brands with >=1 product in the specified leaf category, ordered A-Z by name.
 */
export async function getCategoryLeafBrands(categoryId: number, categorySlug?: string): Promise<SidebarItem[]> {
  const normSlug = categorySlug ? categorySlug.toLowerCase().trim().replace(/\/$/, "") : "";
  if (normSlug && NO_BRAND_FILTER_CATEGORIES.has(normSlug)) {
    return [];
  }

  try {
    const res = await query(
      `SELECT DISTINCT b.name, b.slug
       FROM brands b
       JOIN products p ON p.brand_id = b.id OR (p.brand IS NOT NULL AND LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p.brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) = b.slug)
       WHERE (p.status IS NULL OR p.status = 'publish')
         AND (
           EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = $1)
           OR p.categories @> jsonb_build_array(jsonb_build_object('id', $1))
           OR ($2::text IS NOT NULL AND EXISTS (
             SELECT 1 FROM jsonb_array_elements(p.categories) elem
             WHERE elem->>'slug' = $2
           ))
         )
       ORDER BY b.name ASC`,
      [categoryId, categorySlug || null]
    );
    const validBrands = res.rows
      .filter(r => r.name && r.slug && !NON_BRAND_SLUGS.has(r.slug.toLowerCase().trim()))
      .map(r => ({ name: r.name, slug: r.slug }));
    if (validBrands.length > 0) {
      return validBrands;
    }
  } catch (e) {
    console.warn("DB query for leaf brands failed, running fallback query:", e);
  }

  // Fallback query directly on products table if brands table isn't joined
  try {
    const res = await query(
      `SELECT DISTINCT TRIM(p.brand) AS name,
              LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p.brand), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) AS slug
       FROM products p
       WHERE p.brand IS NOT NULL
         AND TRIM(p.brand) != ''
         AND (p.status IS NULL OR p.status = 'publish')
         AND (
           p.categories @> jsonb_build_array(jsonb_build_object('id', $1))
           OR ($2::text IS NOT NULL AND EXISTS (
             SELECT 1 FROM jsonb_array_elements(p.categories) elem
             WHERE elem->>'slug' = $2
           ))
         )
       ORDER BY name ASC`,
      [categoryId, categorySlug || null]
    );
    return res.rows
      .filter(r => r.name && r.slug && !NON_BRAND_SLUGS.has(r.slug.toLowerCase().trim()))
      .map(r => ({ name: r.name, slug: r.slug }));
  } catch (err) {
    console.error("Fallback leaf brands query failed:", err);
    return [];
  }
}

/**
 * Returns recursive breadcrumb ancestor path for a category slug.
 */
export async function getCategoryBreadcrumb(slug: string): Promise<BreadcrumbItem[]> {
  const normSlug = slug.toLowerCase().trim().replace(/\/$/, "");
  try {
    const res = await query(
      `WITH RECURSIVE ancestors AS (
         SELECT id, parent_id, name, slug, 0 AS depth FROM categories WHERE LOWER(slug) = $1
         UNION ALL
         SELECT c.id, c.parent_id, c.name, c.slug, a.depth + 1
         FROM categories c JOIN ancestors a ON c.id = a.parent_id
       )
       SELECT name, slug FROM ancestors ORDER BY depth DESC`,
      [normSlug]
    );
    if (res.rows.length > 0) {
      return res.rows.map(r => ({ name: r.name, slug: r.slug }));
    }
  } catch (e) {
    console.warn("DB query for breadcrumbs failed, running JSON fallback:", e);
  }

  // JSON fallback
  const jsonCats = getJsonCategories();
  const breadcrumb: BreadcrumbItem[] = [];
  let curr = jsonCats.find((c: any) => c.slug.toLowerCase() === normSlug);
  while (curr) {
    breadcrumb.unshift({ name: curr.name, slug: curr.slug });
    if (!curr.parent || curr.parent === 0) break;
    curr = jsonCats.find((c: any) => c.id === curr.parent);
  }
  return breadcrumb;
}

/**
 * Checks if Filter by Brand is allowed for a given category.
 * Filter by Brand ONLY applies to:
 * - bird-food-treats
 * - Puppy categories (puppy, puppy-food, puppy-treats)
 * - All categories under Dog Food & Treats
 * - Kitten categories (kitten, kitten-food, kitten-treats)
 * - All categories under Cat Food & Treats
 */
export function isBrandFilterAllowedForCategory(slug: string, breadcrumb: BreadcrumbItem[]): boolean {
  const normSlug = slug.toLowerCase().trim().replace(/\/$/, "");
  const ancestorSlugs = breadcrumb.map(b => b.slug.toLowerCase().trim().replace(/\/$/, ""));

  if (normSlug === "bird-food-treats" || normSlug.includes("bird-food") || normSlug.includes("bird-treat")) {
    return true;
  }
  if (normSlug.includes("puppy")) {
    return true;
  }
  if (normSlug.includes("kitten")) {
    return true;
  }
  if (
    ancestorSlugs.includes("dog-food-and-treats") ||
    ancestorSlugs.includes("cat-food-and-treats") ||
    ancestorSlugs.includes("dog-food-treats") ||
    ancestorSlugs.includes("cat-food-treats")
  ) {
    return true;
  }
  if (
    normSlug === "dog-treats" ||
    normSlug === "dry-dog-food" ||
    normSlug === "wet-dog-food" ||
    normSlug === "cat-treats" ||
    normSlug === "dry-cat-food" ||
    normSlug === "wet-cat-food"
  ) {
    return true;
  }

  return false;
}

/**
 * Primary helper to compute sidebar data (Categories vs Filter By Brand) for any category slug.
 */
export async function getSidebarDataForCategory(categorySlug: string): Promise<SidebarData> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    return {
      mode: "categories",
      heading: "CATEGORIES",
      items: []
    };
  }

  // Check direct children
  const directChildren = await getCategoryDirectChildren(category.id);
  if (directChildren.length > 0) {
    return {
      mode: "categories",
      heading: "CATEGORIES",
      items: directChildren
    };
  }

  // Leaf category: check if Brand Filter is allowed for this category
  const breadcrumb = await getCategoryBreadcrumb(category.slug);
  if (!isBrandFilterAllowedForCategory(category.slug, breadcrumb)) {
    return {
      mode: "brands",
      heading: "",
      items: []
    };
  }

  // Allowed leaf category: fetch brands with products in this category
  const leafBrands = await getCategoryLeafBrands(category.id, category.slug);
  return {
    mode: "brands",
    heading: "FILTER BY BRAND",
    items: leafBrands
  };
}

/**
 * Returns recursive descendant category IDs for a category slug (inclusive of self).
 */
export async function getCategoryDescendantIds(slug: string): Promise<{ ids: number[]; slugs: string[] }> {
  const normSlug = slug.toLowerCase().trim().replace(/\/$/, "");
  try {
    const res = await query(
      `WITH RECURSIVE descendants AS (
         SELECT id, slug FROM categories WHERE LOWER(slug) = $1
         UNION ALL
         SELECT c.id, c.slug FROM categories c JOIN descendants d ON c.parent_id = d.id
       )
       SELECT id, slug FROM descendants`,
      [normSlug]
    );
    if (res.rows.length > 0) {
      return {
        ids: res.rows.map(r => Number(r.id)),
        slugs: res.rows.map(r => r.slug)
      };
    }
  } catch (e) {
    console.warn("DB query for category descendants failed, running JSON fallback:", e);
  }

  // JSON fallback
  const jsonCats = getJsonCategories();
  const root = jsonCats.find((c: any) => c.slug.toLowerCase() === normSlug);
  if (!root) return { ids: [], slugs: [normSlug] };

  const ids: number[] = [root.id];
  const slugs: string[] = [root.slug];
  const traverse = (parentId: number) => {
    jsonCats.forEach((c: any) => {
      if (c.parent === parentId) {
        ids.push(c.id);
        slugs.push(c.slug);
        traverse(c.id);
      }
    });
  };
  traverse(root.id);
  return { ids, slugs };
}
