# Category filter sidebar — implementation plan (v2, corrected against live site)

## 0. Correction from v1 — read this first

The first version of this plan conflated two different pieces of UI on the reference site:

1. **The hamburger / mobile nav menu** — a fully nested accordion tree of every category, 3 levels deep. You already have this built. **Out of scope for this doc.**
2. **The actual sidebar filter widget** that appears on category archive pages — this is what actually needed matching, and it is **not** the nested tree. It's a small, page-specific, flat (non-nested) widget whose content and heading change depending on which category you're viewing.

Everything below replaces the frontend/component sections of v1. The product-listing query (recursive descendant matching, for the "297 results" type counts) was correct in v1 and is carried over unchanged.

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
- `FILTER BY BRAND` dynamically lists **only** official recognized shop brands (Bonnie, Josera, King, Montego, Proline, Reflex, Royal Canin, Spectrum, Trendline) that have **≥1 products in the currently selected category**.
- Brands with 0 products in the selected category are omitted (e.g. `Cat Treats` displays Montego, Proline, Reflex, Spectrum, but omits Bonnie, Josera, King, Royal Canin, Trendline).
- Unrecognized brand descriptors (e.g. "Churu", "Dashi", "Inaba", "CS", "Maasai Shukas") are excluded.

No nesting, no expand/collapse, no chevrons, no parent or sibling entries, no ancestor context inside the widget itself. It's recomputed fresh, server-side, for whichever category page is being viewed — the browser never toggles it, it just gets a new flat list on navigation.

---

## 2. Data model

Carried over from v1, plus a `brands` table (cleaner than the reference site's own approach, which reuses the category taxonomy for brands too — no need to copy that quirk):

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

If this returns zero rows, fall through to (b).

**b) Brands stocked in a leaf category** (used for "Filter by brand" mode):

```sql
SELECT DISTINCT b.id, b.name, b.slug
FROM brands b
JOIN products p ON p.brand_id = b.id
JOIN product_categories pc ON pc.product_id = p.id
WHERE pc.category_id = $1
ORDER BY b.name ASC;
```

**c) Breadcrumb ancestors** (for "Home / Cat / Cat Food & Treats / Wet Cat Food"):

```sql
WITH RECURSIVE ancestors AS (
  SELECT id, parent_id, name, slug, 0 AS depth FROM categories WHERE slug = $1
  UNION ALL
  SELECT c.id, c.parent_id, c.name, c.slug, a.depth + 1
  FROM categories c JOIN ancestors a ON c.id = a.parent_id
)
SELECT name, slug FROM ancestors ORDER BY depth DESC;
```

**d) Product listing with descendant aggregation** — unchanged from v1, already verified correct: "Cat Food & Treats" shows 297 results (itself + all its descendants combined: Wet Cat Food alone is 129 of those), matching the pattern from "Cat" showing 393 (itself + every descendant across all its branches).

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

## 4. API endpoint

One endpoint drives the whole category page — breadcrumb, sidebar, and product list — so the frontend never has to decide sidebar mode itself:

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

The server decides `mode` by running query (a) first and falling back to (b) — the frontend just renders whatever `sidebar` contains.

---

## 5. Frontend: sidebar component

Much simpler than the accordion from v1 — no tree, no expand state, no recursion:

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

The whole widget just re-renders with new props on every category navigation — the server already scoped `items` and `mode` to whichever category is current.

---

## 6. The `from_cat` cross-filter (worth a deliberate scope decision)

Clicking a brand from a leaf category's "Filter by brand" list carries the originating category along as a query param (`?from_cat=wet-cat-food`). On the brand's own category page, that's presumably used to intersect brand + originating category, rather than showing everything that brand makes. Two honest options:

- **Build the intersection now** — brand page checks for `from_cat` and adds it as an extra `WHERE category_id = X` alongside the brand filter.
- **Land unfiltered for now** — accept the param, ignore it, treat true intersection as a fast-follow.

Either is reasonable — flagging it so it's a decision you make on purpose rather than a gap you find later.

---

## 7. Interaction spec

| Situation | Sidebar shows |
|---|---|
| Viewing a category with subcategories (Cat, Cat Food & Treats, etc.) | "Categories" — flat list of its direct children only, nothing deeper, no siblings, no parent |
| Viewing a leaf category with no subcategories (Wet Cat Food, Cat Treats, etc.) | "Filter by brand" — flat list of brands stocked in that specific category |
| Clicking any sidebar item | Full navigation to that category's page — the sidebar is replaced by whatever the new page's API response returns. Nothing toggles client-side. |

---

## 8. Carried over from v1, unchanged

- Recursive descendant product-count query (section 3d above)
- URL convention: `/product-category/:slug/`
- Breadcrumb display logic
- The hamburger nav menu tree you already built — separate component, always fully nested, not touched by any of this

---

## 9. Build order

1. Add `brands` table + `brand_id` on `products`; backfill brand assignments for existing products.
2. Build `GET /api/categories/:slug` — category, breadcrumb, mode-detected sidebar, paginated products via the recursive descendant query.
3. Build the sidebar component — flat list, heading + link target driven entirely by `sidebar.mode`. No client-side state.
4. Decide and implement the `from_cat` handling (section 6).
5. QA against the reference site: check a category with children (flat children list), one a couple levels deep, and a true leaf (brand list) — confirm your output has the same *shape*, not necessarily the same counts or brands.
