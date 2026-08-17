# Sidebar Filter Implementation Plan (Categories & Brand Pages)

This document contains the unified implementation plan for both **Category Page Sidebar Filters** (Part 1) and **Brand Page Sidebar Filters** (Part 2), matching the live reference site (`petstore.co.ke`).

---

# Part 1: Category Page Sidebar Filters

## 0. Overview & Scope

The sidebar filter widget that appears on category archive pages is a page-specific, flat (non-nested) widget whose content and heading change depending on which category you're viewing.

---

## 1. What the sidebar filter actually does (verified against live pages)

| Page | Sidebar heading | Sidebar contents |
|---|---|---|
| `/product-category/cat-supplies-store/` (Cat — has children) | CATEGORIES | Its 9 direct children, flat, A→Z: Cat Beds & Houses, Cat Bowls & Feeders, Cat Carries Bags & Travel, Cat Collars Leashes Harnesses, Cat Food & Treats, Cat Grooming, Cat Healthcare Supplies, Cat Toys, Litter and Litter Box & Accessories |
| `/product-category/cat-food-and-treats/` (has children) | CATEGORIES | Its 5 direct children, flat, A→Z: Cat Treats, Dry Cat Food, Kitten Food, Kitten Treats, Wet Cat Food |
| `/product-category/wet-cat-food/` (leaf under Cat Food & Treats) | FILTER BY BRAND | Brands that actually have products in *this* category, flat, A→Z: Bonnie, Josera, King, Montego, Proline, Reflex, Royal Canin — each linking to `/product-category/{brand}/?from_cat=wet-cat-food` |
| `/product-category/cat-beds-houses/` (non-food leaf) | (none) | No sidebar widget rendered at all. |
| `/product-category/cat-bowls-and-feeders/` (non-food leaf) | (none) | No sidebar widget rendered at all. |

The rule:

```
if currentCategory has direct children:
    sidebar = { heading: "CATEGORIES", items: currentCategory's direct children, sorted A→Z }
else if currentCategory is in Brand Filter Allowlist AND has valid recognized brands:
    sidebar = { heading: "FILTER BY BRAND", items: recognized brands in currentCategory, sorted A→Z }
else:
    sidebar = { heading: "", items: [] } // No sidebar widget rendered
```

### Brand Filter Allowlist & Product Category Scoping
`FILTER BY BRAND` **only** applies to leaf pages under the following categories:
1. `bird-food-treats`
2. `puppy` (and all subcategories/leafs containing Puppy, e.g., `puppy-food`, `puppy-treats`)
3. All categories under **Dog Food & Treats** (inner pages / leaf categories)
4. `kitten` (and all subcategories/leafs containing Kitten, e.g., `kitten-food`, `kitten-treats`)
5. All categories under **Cat Food & Treats** (inner pages / leaf categories, e.g., `cat-treats`, `wet-cat-food`, `dry-cat-food`)

All other categories (accessories, supplies, beds, bowls, carriers, toys, etc.) render no brand filter sidebar.

**Brand Filtering Rule**:
- `FILTER BY BRAND` dynamically lists **only** official recognized PetStore Kenya shop brands:
  1. **Bonnie** (`bonnie`)
  2. **Josera** (`josera`)
  3. **King** (`king`)
  4. **Miglior Cane** (`miglior`, `miglior-cane`)
  5. **Montego** (`montego`)
  6. **Proline** (`proline`)
  7. **Reflex** (`reflex`)
  8. **Royal Canin** (`royal-canin`)
  9. **Spectrum** (`spectrum`)
  10. **Thunder** (`thunder`)
  11. **Trendline** (`trendline`)
  12. **Unique** (`unique`)
- A brand is **only** included if it has **≥1 products in the currently selected category**.
- Recognized brands with 0 products in the selected category are omitted (e.g. `Wet Cat Food` displays Bonnie, Josera, King, Montego, Proline, Reflex, Royal Canin, but omits Spectrum, Trendline, etc.).
- Unrecognized brand descriptors, variant strings, or extra brands (e.g. "Chuck", "Dashi", "Felix", "Friskies", "Inaba", "Leonardo", "Mio", "Simba", "Soup Time", "Truly", "Wanpy", "Whiskas", "CS", "Maasai Shukas") are strictly excluded.

No nesting, no expand/collapse, no chevrons, no parent or sibling entries, no ancestor context inside the widget itself. It's recomputed fresh, server-side, for whichever category page is being viewed — the browser never toggles it, it just gets a new flat list on navigation.

---

## 2. Data model

Carried over from v1, plus a `brands` table:

```sql
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

CREATE TABLE product_categories (
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);

CREATE TABLE brands (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

ALTER TABLE products ADD COLUMN brand_id INTEGER REFERENCES brands(id);
```

---

## 3. Queries

**a) Direct children of the current category** (used when deciding "Categories" mode):

```sql
SELECT id, name, slug
FROM categories
WHERE parent_id = $1
ORDER BY name ASC;
```

**b) Brands stocked in a leaf category** (used for "Filter by brand" mode):

```sql
SELECT DISTINCT b.id, b.name, b.slug
FROM brands b
JOIN products p ON p.brand_id = b.id
JOIN product_categories pc ON pc.product_id = p.id
WHERE pc.category_id = $1
ORDER BY b.name ASC;
```

**c) Breadcrumb ancestors**:

```sql
WITH RECURSIVE ancestors AS (
  SELECT id, parent_id, name, slug, 0 AS depth FROM categories WHERE slug = $1
  UNION ALL
  SELECT c.id, c.parent_id, c.name, c.slug, a.depth + 1
  FROM categories c JOIN ancestors a ON c.id = a.parent_id
)
SELECT name, slug FROM ancestors ORDER BY depth DESC;
```

**d) Product listing with descendant aggregation**:

```sql
WITH RECURSIVE descendants AS (
  SELECT id FROM categories WHERE slug = $1
  UNION ALL
  SELECT c.id FROM categories c JOIN descendants d ON c.parent_id = d.id
)
SELECT p.*
FROM products p
JOIN product_categories pc ON pc.product_id = p.id
WHERE pc.category_id IN (SELECT id FROM descendants)
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;
```

---

## 4. API Endpoint (Categories)

```
GET /api/categories/:slug?page=1&perPage=72
```

```json
{
  "category": { "name": "Wet Cat Food", "slug": "wet-cat-food" },
  "breadcrumb": [
    { "name": "Cat", "slug": "cat-supplies-store" },
    { "name": "Cat Food & Treats", "slug": "cat-food-and-treats" }
  ],
  "sidebar": {
    "mode": "brands",
    "heading": "Filter by brand",
    "items": [{ "name": "Bonnie", "slug": "bonnie" }]
  },
  "productCount": 129,
  "products": []
}
```

---

## 5. Frontend: Category Sidebar Component

```tsx
type SidebarData = {
  mode: 'categories' | 'brands';
  heading: string;
  items: { name: string; slug: string }[];
};

function CategorySidebar({ sidebar, currentSlug }: { sidebar: SidebarData; currentSlug: string }) {
  return (
    <div className="filter-sidebar">
      <h3>{sidebar.heading}</h3>
      <ul>
        {sidebar.items.map(item => (
          <li key={item.slug}>
            <a href={
              sidebar.mode === 'brands'
                ? `/product-category/${item.slug}/?from_cat=${currentSlug}`
                : `/product-category/${item.slug}/`
            }>
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---


<!-- ===================================================================== -->
<!-- BRAND PAGE SIDEBAR FILTERS (FILTER BY CATEGORY)                       -->
<!-- The section below covers sidebar filters on Brand Pages                -->
<!-- ===================================================================== -->

---

# Part 2: Brand Page Sidebar Filters (Filter by Category)

## 0. Overview & Scope

This section covers the mirror-image case of category page filtering: what the sidebar widget does on a **Brand Page** (e.g. `/product-category/reflex/` or `?brand=Reflex`).

The 12 official PetStore Kenya brands are:
```
proline, reflex, spectrum, trendline, josera, bonnie,
king, unique, miglior-cane, royal-canin, montego, thunder
```

---

## 1. What Sidebar Shows on Brand Pages

On a brand page (such as `/product-category/reflex/` or `/product-category/proline/`), the sidebar is titled **"FILTER BY CATEGORY"** and lists every *category* that has products from that specific brand, along with a direct-assignment product count:

```
Reflex →  Brushes & Fur Removal Tools (1)
          Brushes, Combs & Fur Removal Tools (1)
          Bundles (3)
          Cat Litter (1)
          Cat Treats (25)
          Clearance (3)
          Dog (1)
          Dog Hygiene & Potty Solutions (5)
          Dog Treats (17)
          Dry Cat Food (24)
          Dry Dog Food (47)
          Kitten Food (6)
          Kitten Treats (2)
          Puppy Food (9)
          Puppy Treats (6)
          Shampoo (3)
          Wet Cat Food (17)

Proline → Bundles (2)
          Cat Litter (18)
          Cat Treats (1)
          Dry Cat Food (13)
          Dry Dog Food (5)
          Kitten Food (2)
          Puppy Food (2)
          Wet Cat Food (15)
          Wet Dog Food (3)
```

On a brand page, brand switching does not belong in the sidebar. Brand switching is handled via the "Shop By Brands" navigation grid. The sidebar's job on brand pages is category faceting.

---

## 2. The Brand Page Sidebar Rule

```
On a Brand Page:
  sidebar.heading = "FILTER BY CATEGORY"
  sidebar.items   = every category with ≥1 product from this brand,
                     each showing product count, sorted A→Z
  each item links to /product-category/{category-slug}/?from_brand={brand-slug}
```

*Note*: This uses **direct-assignment counts** (categories explicitly tagged to products of that brand).

---

## 3. Brand Page Query

```sql
SELECT c.id, c.name, c.slug, COUNT(DISTINCT p.id) AS product_count
FROM categories c
JOIN product_categories pc ON pc.category_id = c.id
JOIN products p ON p.id = pc.product_id
WHERE p.brand_id = $1 OR LOWER(p.brand) = LOWER($2)
GROUP BY c.id, c.name, c.slug
ORDER BY c.name ASC;
```

---

## 4. API Endpoint (Brand Pages)

```
GET /api/brands/:slug?page=1&perPage=72
```

```json
{
  "brand": { "name": "Proline", "slug": "proline" },
  "sidebar": {
    "heading": "FILTER BY CATEGORY",
    "items": [
      { "name": "Cat Litter", "slug": "cat-litter", "count": 18 },
      { "name": "Wet Cat Food", "slug": "wet-cat-food", "count": 15 }
    ]
  },
  "productCount": 38,
  "products": []
}
```

---

## 5. Frontend: Brand Page Sidebar Component

```tsx
type BrandSidebarItem = { name: string; slug: string; count: number };

function BrandCategorySidebar({ items, brandSlug }: { items: BrandSidebarItem[]; brandSlug: string }) {
  return (
    <div className="filter-sidebar">
      <h3>FILTER BY CATEGORY</h3>
      <ul>
        {items.map(item => (
          <li key={item.slug}>
            <a href={`/product-category/${item.slug}/?from_brand=${brandSlug}`}>
              {item.name} ({item.count})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 6. Cross-Filtering (`from_cat` and `from_brand`)

The two sidebar modes form a symmetric cross-filter:
- From a leaf category page, clicking a brand → `/product-category/{brand}/?from_cat={category}`
- From a brand page, clicking a category → `/product-category/{category}/?from_brand={brand}`

When receiving the param, the destination page intersects brand + category to display the narrowed product subset.

---

## 7. Unified Build Order

1. **Category Pages (Part 1)**:
   - Server-side `getSidebarDataForCategory` determines `CATEGORIES` vs `FILTER BY BRAND` vs `none`.
   - Restrict `FILTER BY BRAND` to allowlist categories and recognized 12 brands with ≥1 products in selected category.
2. **Brand Pages (Part 2)**:
   - Compute `FILTER BY CATEGORY` sidebar items for brand pages showing categories with ≥1 products from that brand.
   - Render `FILTER BY CATEGORY` with product counts on brand pages.
3. **Cross-Filtering**:
   - Handle `from_cat` and `from_brand` URL query parameters consistently.
