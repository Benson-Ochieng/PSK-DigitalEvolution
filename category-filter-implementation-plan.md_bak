# Category Filter Sidebar — Implementation Plan
Reference: https://petstore.co.ke/ (WooCommerce `product_cat` nested taxonomy, rendered as an accordion sidebar)

## 1. What we're replicating

The inspiration site's sidebar is a **self-referencing category tree**, exactly 3 levels deep in places:

```
Cat                                  → /product-category/cat-supplies-store/
  Cat Food & Treats                  → /product-category/cat-food-and-treats/
    Wet Cat Food                     → /product-category/wet-cat-food/
    Dry Cat Food                     → /product-category/dry-cat-food/
    Kitten Food                      → /product-category/kitten-food/
    Cat Treats                       → /product-category/cat-treats/
    Kitten Treats                    → /product-category/kitten-treats/
  Litter and Litter Box & Accessories → /product-category/cat-litter-and-accessories/
    Cat Litter
    Litter Boxes
  Cat Collars, Leashes, Harnesses
    Cat Collars
    Cat Harnesses
  Cat Healthcare Supplies
    Flea & Tick
    Cat Dewormers
    Supplements
  Cat Carries, Bags & Travel          (no children — plain link)
  Cat Beds & Houses                   (no children — plain link)
  Cat Toys                            (no children — plain link)
  Cat Grooming
    Brushes & Fur Removal Tools
    Shampoo
  Cat Bowls & Feeders                 (no children — plain link)
Dog                                  → sibling of Cat, same pattern repeats
```

Key behaviors to match (mapped to your 3 screenshots):

1. **Image 1** — Landing on `/product-category/cat-supplies-store/` shows a breadcrumb (`Home / Cat`), an underlined page title, and **393 results** — i.e. every product from *Cat AND all of its descendant subcategories combined*, not just products tagged directly to "Cat".
2. **Image 2** — Clicking "Cat" navigates to that URL **and** expands inline to reveal its direct children, stopping right before the next top-level sibling ("Dog"). Chevron icons (blue boxes) only appear next to categories that have children.
3. **Image 3** — Clicking "Cat Food & Treats" expands *its* children (Wet Cat Food, Dry Cat Food, etc.) at a deeper indent, while "Cat" stays expanded above it. It's a drill-down, not a replace.

So functionally: navigation + expand happen together, indentation increases per depth level, and parent branches stay open while you drill into a child — an accordion-style nested tree, not a flat filter list.

---

## 2. Data model (PostgreSQL)

```sql
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- many-to-many: a product can sit in more than one leaf category
CREATE TABLE product_categories (
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);
```

`parent_id IS NULL` = top-level (Cat, Dog, Bird, Fish...). Depth is derived, not stored, so the tree stays flexible if you ever add a 4th level.

---

## 3. The "393 results" query — recursive descendant matching

This is the part that's easy to miss: a category archive page must include products from **every descendant**, not just direct children. Use a recursive CTE:

```sql
WITH RECURSIVE descendants AS (
  SELECT id FROM categories WHERE slug = $1          -- e.g. 'cat-supplies-store'
  UNION ALL
  SELECT c.id
  FROM categories c
  JOIN descendants d ON c.parent_id = d.id
)
SELECT p.*
FROM products p
JOIN product_categories pc ON pc.product_id = p.id
WHERE pc.category_id IN (SELECT id FROM descendants)
GROUP BY p.id                -- dedupe if a product sits in 2 matched categories
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;
```

Run a matching `COUNT(DISTINCT p.id)` version for the "Showing 1–72 of 393 results" text and pagination.

---

## 4. API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/categories/tree` | Returns the **entire** category tree once (flat rows, nested client-side — see below). Table is small (~100 rows for this catalog size), so no need to re-fetch per click. Cache in memory / SWR / React Query with a long staleTime. |
| `GET /api/products?category=:slug&page=1&perPage=72&availability=` | Products for a category page, using the recursive query above. `availability` maps to the top-right "AVAILABILITY" dropdown in image 1 (in stock / out of stock filter — a simple `WHERE p.stock > 0` toggle). |

Fetch the tree as a **flat list** and build it in TypeScript rather than nesting it in SQL — simpler to cache, simpler to type, and trivial to build:

```ts
type CategoryRow = { id: number; parent_id: number | null; name: string; slug: string; sort_order: number };
type CategoryNode = CategoryRow & { children: CategoryNode[] };

function buildTree(rows: CategoryRow[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  rows.forEach(r => map.set(r.id, { ...r, children: [] }));
  const roots: CategoryNode[] = [];
  rows
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach(r => {
      const node = map.get(r.id)!;
      if (r.parent_id === null) roots.push(node);
      else map.get(r.parent_id)?.children.push(node);
    });
  return roots;
}
```

---

## 5. Frontend: recursive tree component (TSX)

```tsx
type Props = {
  node: CategoryNode;
  depth: number;
  activeSlug: string | null;
  expandedIds: Set<number>;
  onSelect: (node: CategoryNode) => void; // navigates AND expands
};

function CategoryTreeNode({ node, depth, activeSlug, expandedIds, onSelect }: Props) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = node.slug === activeSlug;

  return (
    <li>
      <div
        className={`category-row depth-${depth} ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: depth * 16 }}
      >
        <a href={`/product-category/${node.slug}/`}
           onClick={(e) => { e.preventDefault(); onSelect(node); }}>
          {node.name}
        </a>
        {hasChildren && (
          <span className={`chevron ${isExpanded ? 'open' : ''}`} aria-hidden />
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul>
          {node.children.map(child => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeSlug={activeSlug}
              expandedIds={expandedIds}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

Parent container:

```tsx
function CategoryFilterSidebar({ tree, activeSlug }: { tree: CategoryNode[]; activeSlug: string | null }) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // On load / route change: auto-expand the ancestor chain of the active category
  // (so /wet-cat-food/ arrives with "Cat" and "Cat Food & Treats" already open — image 3 behavior)
  useEffect(() => {
    if (!activeSlug) return;
    const path = findPathToSlug(tree, activeSlug); // returns array of ancestor ids incl. self
    setExpandedIds(new Set(path));
  }, [activeSlug, tree]);

  function handleSelect(node: CategoryNode) {
    navigate(`/product-category/${node.slug}/`);
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(node.id) ? next.delete(node.id) : next.add(node.id);
      return next;
    });
  }

  return (
    <ul className="category-tree">
      {tree.map(node => (
        <CategoryTreeNode key={node.id} node={node} depth={0}
          activeSlug={activeSlug} expandedIds={expandedIds} onSelect={handleSelect} />
      ))}
    </ul>
  );
}
```

`findPathToSlug` is a simple recursive DFS that returns the chain of ancestor ids for whichever slug is active in the URL — this is what keeps "Cat" open while you're browsing "Wet Cat Food" three levels down.

---

## 6. Interaction spec (exact match to your screenshots)

| Action | Result |
|---|---|
| Click a category **with no children** (e.g. "Cat Toys") | Navigate only. No chevron shown. |
| Click a category **with children** (e.g. "Cat") | Navigate to its filtered product page **and** toggle its own children open/closed. |
| A category's ancestor chain when landing via direct URL | Auto-expanded on load (so deep-linking to a subcategory doesn't hide its own place in the tree). |
| Sibling branches at the same level | Left independent (multiple can stay open at once) — matches image 2/3 where "Cat" stays open while you're also drilled into one of its children. If you'd rather match a stricter single-branch accordion, that's a one-line change (collapse siblings on `handleSelect`) — worth deciding before you build, not after. |

---

## 7. Category landing page (image 1)

- Breadcrumb: `Home / {category.name}`
- Heading: category name, underlined
- `Showing {start}–{end} of {total} results` — computed from the `COUNT` query + current page/perPage
- "Products per page" `<select>` — just a query param (`perPage`) that re-triggers the fetch
- "AVAILABILITY" `<select>` — filters `WHERE stock_status = 'instock' | 'outofstock'`, combined with the same category-descendant `WHERE` clause

---

## 8. URL convention

Match the source site's pattern so it's predictable and SEO-clean:

```
/product-category/:slug/
```

One dynamic route handles every depth — the slug alone identifies which category (and thus which subtree) to query; you don't need `/cat/cat-food-and-treats/wet-cat-food/` nesting in the URL itself (the source site doesn't do that either).

---

## 9. Seeding all four top-level categories

The schema and every layer above it (API, tree builder, recursive component) is generic — nothing is hardcoded to "Cat." `Cat`, `Dog`, `Bird`, and `Fish` are just four `parent_id IS NULL` rows in the same `categories` table, and each branch can go as deep or as shallow as it needs to independently.

On the reference site, depth isn't uniform across the four:

- **Cat / Dog** — 3 levels (e.g. `Cat → Cat Food & Treats → Wet Cat Food`)
- **Bird / Fish** — 2 levels only (`Bird → Bird Food & Treats`, `Fish → Fish Food & Treats`), no third tier

A category with no children just renders as a plain link with no chevron — same code path as "Cat Toys" under Cat, no special-casing needed.

```sql
INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (NULL, 'Cat',  'cat',  1),
  (NULL, 'Dog',  'dog',  2),
  (NULL, 'Bird', 'bird', 3),
  (NULL, 'Fish', 'fish', 4);

-- Cat and Dog can go 3 levels deep:
INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'cat'), 'Cat Food & Treats', 'cat-food-and-treats', 1);

INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'cat-food-and-treats'), 'Wet Cat Food', 'wet-cat-food', 1);

-- Bird and Fish can stop at 2 levels — no third insert needed:
INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'bird'), 'Bird Food & Treats', 'bird-food-treats', 1);

INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'fish'), 'Fish Food & Treats', 'fish-food-treats', 1);
```

Whether you actually keep Bird and Fish flat or build them out further depends entirely on how deep your real catalog for those pet types goes — it's a seeding decision, not a schema or code decision.

## 10. Build order

1. **Schema** — create `categories` + `product_categories`, seed with your actual category tree (start with Cat/Dog to validate, then fill out the rest).
2. **`GET /api/categories/tree`** — flat rows → confirm `buildTree()` output matches expected nesting.
3. **Static tree render** — no interactivity yet, just confirm indentation/structure renders correctly at all 3 depths.
4. **Expand/collapse + active state** — wire up `expandedIds`, `handleSelect`, and `findPathToSlug` for deep-link auto-expand.
5. **Category product query** — recursive CTE + count query, wire to `/product-category/:slug/` page with pagination and the per-page selector.
6. **Availability filter** — add the in-stock/out-of-stock dropdown.
7. **Styling pass** — indentation per depth, chevron rotation, active-category highlight, row hover/border to match the reference visually.
8. **QA against the reference site** — walk both side by side: Cat → Cat Food & Treats → Wet Cat Food, confirm expand behavior and result counts line up conceptually (your own product counts will differ, obviously).

---

## Open questions worth deciding before you start building
- Do you want **single-branch accordion** (only one top-level category's tree open at a time) or **independent multi-branch** (matches what the screenshots show)?
- Any category expected to go **deeper than 3 levels**? The schema supports it either way, just confirming scope.
- Should out-of-stock products still show (greyed out) or be excluded entirely from counts?
