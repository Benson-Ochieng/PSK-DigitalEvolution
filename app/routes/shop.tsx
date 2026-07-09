import { Link, useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/shop";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { DogIcon, CatIcon, BoneIcon, DropletIcon } from "../components/CategoryIcon";
import ShopSidebarFilters from "../components/ShopSidebarFilters";

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  const title = data?.pageTitle ? `${data.pageTitle} - PetStore Kenya` : "Products - PetStore Kenya";
  return [
    { title },
    { name: "description", content: `Browse all ${data?.pageTitle || "pet food"} products at PetStore Kenya - always cheaper than Naivas, Carrefour & Quickmart.` }
  ];
}

export const SLUG_ALIASES: Record<string, string> = {
  "cat-food": "cat-food-and-treats",
  "dog-food": "dog-food-treats",
  "bird-food": "bird-food-treats",
  "bird-food-treats": "bird-food-treats",
};

export const ANIMAL_STORE_SLUGS: Record<string, string> = {
  "cat": "cat",
  "cat-supplies-store": "cat",
  "dog": "dog",
  "dog-supplies-store": "dog",
  "bird": "bird",
  "bird-supplies-store": "bird",
  "rabbit": "rabbit",
  "rabbit-supplies-store": "rabbit",
};

export const CAT_CATEGORIES = [
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

export const DOG_CATEGORIES = [
  { label: "Dog Beds & Furniture", slug: "dog-beds-furniture" },
  { label: "Dog Bowls & Feeders", slug: "dog-bowls-feeders" },
  { label: "Dog Collars, Leashes & Harnesses", slug: "dog-collars-leashes-and-harnesses" },
  { label: "Dog Food & Treats", slug: "dog-food-treats" },
  { label: "Dog Grooming & Cleaning", slug: "dog-grooming-cleaning-supplies" },
  { label: "Dog Healthcare Supplies", slug: "dog-healthcare-supplies" },
  { label: "Dog Hygiene & Potty Solutions", slug: "dog-hygiene-potty-solutions" },
  { label: "Dog Toys", slug: "dog-toys" }
];

export const BIRD_CATEGORIES = [
  { label: "Bird Food & Treats", slug: "bird-food-treats" }
];

export const RABBIT_CATEGORIES = [
  { label: "Rabbit Food & Supplies", slug: "rabbit-supplies-store" }
];

export const FISH_CATEGORIES: { label: string; slug: string }[] = [];

export const ANIMAL_CATEGORIES: Record<string, { label: string; slug: string }[]> = {
  cat: CAT_CATEGORIES,
  dog: DOG_CATEGORIES,
  bird: BIRD_CATEGORIES,
  rabbit: RABBIT_CATEGORIES,
  fish: FISH_CATEGORIES
};

let cachedCategories: any[] | null = null;

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const routeParams = params as any;
  const slug = routeParams.slug || "";
  const isTagPage = url.pathname.includes("/product-tag/");
  const hideFilter = url.searchParams.get("hideFilter") === "true" || isTagPage;

  let animal = url.searchParams.get("animal") || "";
  let type   = url.searchParams.get("type")   || "";
  const urlSearch = url.searchParams.get("q") || "";
  let brand  = url.searchParams.get("brand")   || "";
  const fromCat = url.searchParams.get("from_cat") || "";
  const fromBrand = url.searchParams.get("from_brand") || "";
  const crossSlug = fromCat || fromBrand;
  const lifeStage = url.searchParams.get("life_stage") || "";
  const offerSort = url.searchParams.get("offer_sort") || "";
  const urlLimit = url.searchParams.get("limit") || "";
  const limit  = urlLimit ? Number(urlLimit) : 72;
  const sort   = url.searchParams.get("sort") || offerSort || "availability";

  let search = urlSearch;
  let categorySlug = "";
  let tagSlug = "";

  if (!cachedCategories) {
    const fs = await import("fs");
    const path = await import("path");
    const categoriesPath = path.join(process.cwd(), "content", "categories", "_index.json");
    if (fs.existsSync(categoriesPath)) {
      try {
        cachedCategories = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
      } catch (e) {
        console.error("Error reading categories index", e);
      }
    }
  }
  const categories = cachedCategories || [];

  const getDescendants = (slugStr: string): string[] => {
    const target = categories.find(c => c.slug === slugStr);
    if (!target) return [slugStr];
    const list = [slugStr];
    const traverse = (parentId: number) => {
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

  const getActiveSidebarSlug = (slugStr: string): string => {
    const sidebarSlugs = new Set(
      Object.values(ANIMAL_CATEGORIES).flatMap(arr => arr.map(c => c.slug))
    );
    
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

  let canonicalSlug = slug ? slug.toLowerCase().replace(/\/$/, "") : "";
  if (SLUG_ALIASES[canonicalSlug]) {
    canonicalSlug = SLUG_ALIASES[canonicalSlug];
  }

  if (canonicalSlug) {
    if (isTagPage) {
      tagSlug = canonicalSlug;
    } else if (ANIMAL_STORE_SLUGS[canonicalSlug]) {
      animal = ANIMAL_STORE_SLUGS[canonicalSlug];
    } else {
      categorySlug = canonicalSlug;
      
      const activeSidebar = getActiveSidebarSlug(canonicalSlug);
      let resolvedAnimal = "";
      for (const [key, list] of Object.entries(ANIMAL_CATEGORIES)) {
        if (list.some(c => c.slug === activeSidebar)) {
          resolvedAnimal = key;
          break;
        }
      }
      
      if (resolvedAnimal) {
        animal = resolvedAnimal;
      } else if (canonicalSlug.includes("cat") || canonicalSlug.includes("kitten") || canonicalSlug === "litter-and-accessories" || canonicalSlug === "cat-litter-and-accessories") {
        animal = "cat";
      } else if (canonicalSlug.includes("dog") || canonicalSlug.includes("puppy")) {
        animal = "dog";
      } else if (canonicalSlug.includes("bird")) {
        animal = "bird";
      } else if (canonicalSlug.includes("rabbit")) {
        animal = "rabbit";
      }
    }
  }

  let pageTitle = "All Pet Food";
  if (urlSearch) {
    pageTitle = `Search Results for "${urlSearch}"`;
  } else if (slug) {
    if (isTagPage) {
      pageTitle = canonicalSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    } else {
      const matchedCat = CAT_CATEGORIES.find(c => c.slug === canonicalSlug) || DOG_CATEGORIES.find(c => c.slug === canonicalSlug);
      const dbCat = categories.find(c => c.slug === canonicalSlug);
      if (matchedCat) {
        pageTitle = matchedCat.label;
      } else if (dbCat) {
        pageTitle = dbCat.name;
      } else if (canonicalSlug === "cat-food" || canonicalSlug === "cat" || canonicalSlug === "cat-supplies-store" || canonicalSlug === "cat-food-and-treats") {
        pageTitle = "Cat";
      } else if (canonicalSlug === "dog-food" || canonicalSlug === "dog" || canonicalSlug === "dog-supplies-store" || canonicalSlug === "dog-food-treats") {
        pageTitle = "Dog";
      } else if (canonicalSlug === "kitten-food" || canonicalSlug === "kitten") {
        pageTitle = "Kitten";
      } else if (canonicalSlug === "puppy-food" || canonicalSlug === "puppy") {
        pageTitle = "Puppy";
      } else if (canonicalSlug === "bird-food" || canonicalSlug === "bird" || canonicalSlug === "bird-supplies-store") {
        pageTitle = "Bird";
      } else if (canonicalSlug === "rabbit-food" || canonicalSlug === "rabbit") {
        pageTitle = "Rabbit";
      } else {
        pageTitle = canonicalSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
    }
  } else {
    if (animal === "dog") pageTitle = "Dog";
    else if (animal === "cat") pageTitle = "Cat";
    else if (type === "treat") pageTitle = "Treats";
    else if (type === "wet") pageTitle = "Wet Food";
  }

  if (crossSlug) {
    let crossTitle = "";
    const matchedCross = CAT_CATEGORIES.find(c => c.slug === crossSlug) || DOG_CATEGORIES.find(c => c.slug === crossSlug);
    const dbCross = categories.find(c => c.slug === crossSlug);
    if (matchedCross) {
      crossTitle = matchedCross.label;
    } else if (dbCross) {
      crossTitle = dbCross.name;
    } else {
      crossTitle = crossSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    if (crossTitle) {
      pageTitle = `${pageTitle} & ${crossTitle}`;
    }
  }

  // Handle special promo/offer types
  const originalType = type;
  let isBulkFilter = false;
  let isOffersFilter = false;

  if (type === "on-sale") {
    categorySlug = "sale";
    type = "";
    pageTitle = "On Sale Now";
  } else if (type === "clearance") {
    categorySlug = "clearance";
    type = "";
    pageTitle = "Clearance";
  } else if (type === "bundles") {
    categorySlug = "bundles";
    type = "";
    pageTitle = "Bundles";
  } else if (type === "bulk") {
    isBulkFilter = true;
    type = "";
    pageTitle = "Bulk Items";
  } else if (type === "offer" || type === "offers") {
    isOffersFilter = true;
    type = "";
    pageTitle = "Offers";
  }

  const conditions: string[] = [];
  const sqlParams: any[] = [];

  const explicitAnimal = url.searchParams.get("animal") || "";
  let queryAnimal = categorySlug ? explicitAnimal : animal;
  if (sort === "psk_pet_dog") {
    queryAnimal = "dog";
  } else if (sort === "psk_pet_cat") {
    queryAnimal = "cat";
  }

  if (queryAnimal) { 
    sqlParams.push(queryAnimal); 
    conditions.push(`p.animal_type = $${sqlParams.length}`); 
  }
  if (type) { 
    sqlParams.push(type);   
    conditions.push(`p.food_type = $${sqlParams.length}`); 
  }
  if (isBulkFilter) {
    conditions.push(`(p.weight_kg >= 10 OR LOWER(p.name) LIKE '%bundle%' OR LOWER(p.name) LIKE '%pack%')`);
  } else if (isOffersFilter) {
    conditions.push(`(
      EXISTS (
        SELECT 1 
        FROM jsonb_to_recordset(p.categories) AS x(slug text)
        WHERE x.slug IN ('sale', 'clearance', 'bundles')
      )
    )`);
  }
  if (search) { 
    sqlParams.push(`%${search.toLowerCase()}%`); 
    conditions.push(`LOWER(p.name) LIKE $${sqlParams.length}`); 
  }
  if (brand) { 
    sqlParams.push(brand);  
    conditions.push(`LOWER(p.brand) = LOWER($${sqlParams.length})`); 
  }
  
  if (lifeStage) {
    const paramIdx = sqlParams.push(JSON.stringify([{ slug: lifeStage }]));
    conditions.push(`p.tags @> $${paramIdx}::jsonb`);
  }

  if (isTagPage && tagSlug) {
    sqlParams.push(JSON.stringify([{ slug: tagSlug }]));
    conditions.push(`p.tags @> $${sqlParams.length}::jsonb`);
  } else if (categorySlug) {
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

    if (crossSlug) {
      const crossDescendantSlugs = getDescendants(crossSlug);
      const paramIdx1 = sqlParams.push(crossDescendantSlugs);
      const paramIdx2 = sqlParams.push(crossSlug);
      conditions.push(`
        (
          (
            p.categories IS NOT NULL 
            AND jsonb_typeof(p.categories) = 'array' 
            AND EXISTS (
              SELECT 1 
              FROM jsonb_to_recordset(p.categories) AS x(slug text)
              WHERE x.slug = ANY($${paramIdx1}::text[])
            )
          )
          OR LOWER(p.brand) = LOWER($${paramIdx2})
        )
      `);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "(COALESCE(MIN(comp.price), 0) - bbp.price) DESC, p.name";
  if (sort === "price-asc" || sort === "price_asc") {
    orderBy = "bbp.price ASC, p.name";
  } else if (sort === "price-desc" || sort === "price_desc") {
    orderBy = "bbp.price DESC, p.name";
  } else if (sort === "expiry-desc" || sort === "expiry_desc") {
    orderBy = "p.created_at DESC, p.name";
  } else if (sort === "expiry-asc" || sort === "expiry_asc") {
    orderBy = "p.created_at ASC, p.name";
  }

  const res = await query(`
    SELECT
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug,
      bbp.price AS our_price,
      MIN(comp.price) AS competitor_min
    FROM products p
    JOIN store_prices bbp  ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    LEFT JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'PetStore Kenya'
    ${where}
    -- category_slug: ${categorySlug}
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug, bbp.price
    ORDER BY ${orderBy}
  `, sqlParams);

  const allProducts = res.rows;
  const totalResults = allProducts.length;
  const page = Number(url.searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalResults / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (currentPage - 1) * limit;
  const productsToShow = allProducts.slice(startIndex, startIndex + limit);

  // Dynamically resolve sidebar categories for the active animal
  let sidebarCategories: { label: string; slug: string }[] = [];
  if (animal) {
    const animalRootSlug = animal === "cat" ? "cat-supplies-store" : (animal === "dog" ? "dog-supplies-store" : `${animal}-supplies-store`);
    const animalParentCat = categories.find(c => c.slug === animalRootSlug);
    if (animalParentCat) {
      const childCats = categories.filter(c => c.parent === animalParentCat.id);
      // Case-insensitive sorting by name
      childCats.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      sidebarCategories = childCats.map(c => ({
        label: c.name,
        slug: c.slug
      }));
    } else {
      sidebarCategories = ANIMAL_CATEGORIES[animal] || [];
    }
  }

  // Detect and dynamically query categories + counts for brand pages
  let isBrandPage = false;
  let brandCategories: { name: string; slug: string; count: number }[] = [];
  if (canonicalSlug) {
    const brandCheck = await query(
      `SELECT EXISTS (SELECT 1 FROM products WHERE LOWER(brand) = LOWER($1))`,
      [canonicalSlug]
    );
    isBrandPage = brandCheck.rows[0]?.exists || false;
  }

  if (isBrandPage) {
    // Set pageTitle to dynamic brand name
    const dbCat = categories.find(c => c.slug === canonicalSlug);
    pageTitle = dbCat ? dbCat.name : canonicalSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const brandRes = await query(`
      SELECT 
        c.slug, 
        c.name,
        COUNT(p.id) as count
      FROM products p
      JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya',
      LATERAL jsonb_to_recordset(p.categories) AS c(id int, name text, slug text)
      WHERE LOWER(p.brand) = LOWER($1)
      AND c.slug != LOWER($1)
      AND c.slug NOT IN ('dog-supplies-store', 'cat-supplies-store', 'dog', 'cat', 'dog-food', 'cat-food', 'dog-food-treats', 'cat-food-and-treats', 'sale', 'clearance', 'bundles')
      GROUP BY c.slug, c.name
      ORDER BY c.name ASC
    `, [canonicalSlug]);

    brandCategories = brandRes.rows.map((row: any) => ({
      name: row.name,
      slug: row.slug,
      count: Number(row.count)
    }));
  }

  return { 
    products: productsToShow, 
    totalResults, 
    totalPages,
    currentPage,
    startIndex,
    animal, 
    type: originalType, 
    urlSearch, 
    pageTitle, 
    slug, 
    brand, 
    limit, 
    urlLimit,
    sort,
    hideFilter,
    isTag: isTagPage,
    isSearch: !!urlSearch,
    activeSidebarSlug: categorySlug ? getActiveSidebarSlug(categorySlug) : "",
    sidebarCategories,
    isBrandPage,
    brandCategories,
    fromCat,
    fromBrand,
    lifeStage,
    offerSort
  };
}

const FILTERS = [
  { label: "All",       iconType: "all",    animal: "",    type: "" },
  { label: "Dogs",      iconType: "dog",    animal: "dog", type: "" },
  { label: "Cats",      iconType: "cat",    animal: "cat", type: "" },
  { label: "Treats",    iconType: "treat",  animal: "",    type: "treat" },
  { label: "Wet",       iconType: "wet",    animal: "",    type: "wet" },
];

function getBreadcrumbs(slug: string, animal: string, brand?: string, isTag?: boolean) {
  const crumbs = [
    { label: "Home", path: "/" }
  ];

  if (slug) {
    const normSlug = slug.toLowerCase().replace(/\/$/, "");
    if (isTag) {
      crumbs.push({ label: "Tags", path: "/shop" });
      crumbs.push({ label: normSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), path: `/product-tag/${slug}/` });
    } else {
      let foundCat: { label: string; slug: string } | undefined;
      let foundAnimalKey: string | undefined;

      for (const [animalKey, arr] of Object.entries(ANIMAL_CATEGORIES)) {
        const matched = arr.find(c => c.slug === normSlug);
        if (matched) {
          foundCat = matched;
          foundAnimalKey = animalKey;
          break;
        }
      }

      if (foundCat && foundAnimalKey) {
        const rootSlug = foundAnimalKey === "cat" ? "cat-supplies-store" : (foundAnimalKey === "dog" ? "dog-supplies-store" : `${foundAnimalKey}-supplies-store`);
        crumbs.push({ label: foundAnimalKey.charAt(0).toUpperCase() + foundAnimalKey.slice(1), path: `/product-category/${rootSlug}/` });
        crumbs.push({ label: foundCat.label, path: `/product-category/${foundCat.slug}/` });
      } else if (normSlug === "cat-food" || normSlug === "cat" || normSlug === "cat-supplies-store" || normSlug === "cat-food-and-treats") {
        crumbs.push({ label: "Cat", path: "/product-category/cat-supplies-store/" });
      } else if (normSlug === "dog-food" || normSlug === "dog" || normSlug === "dog-supplies-store" || normSlug === "dog-food-treats") {
        crumbs.push({ label: "Dog", path: "/product-category/dog-supplies-store/" });
      } else if (normSlug === "kitten-food" || normSlug === "kitten") {
        crumbs.push({ label: "Cat", path: "/product-category/cat-supplies-store/" });
        crumbs.push({ label: "Kitten Food", path: "/product-category/kitten-food/" });
      } else if (normSlug === "puppy-food" || normSlug === "puppy") {
        crumbs.push({ label: "Dog", path: "/product-category/dog-supplies-store/" });
        crumbs.push({ label: "Puppy Food", path: "/product-category/puppy-food/" });
      } else if (normSlug === "bird-food" || normSlug === "bird" || normSlug === "bird-supplies-store" || normSlug === "bird-food-treats") {
        crumbs.push({ label: "Bird", path: "/product-category/bird-supplies-store/" });
      } else if (normSlug === "rabbit-food" || normSlug === "rabbit" || normSlug === "rabbit-supplies-store") {
        crumbs.push({ label: "Rabbit", path: "/product-category/rabbit-supplies-store/" });
      } else {
        crumbs.push({ label: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), path: `/product-category/${slug}/` });
      }
    }
  } else if (animal) {
    const label = animal.charAt(0).toUpperCase() + animal.slice(1);
    const rootSlug = animal === "cat" ? "cat-supplies-store" : (animal === "dog" ? "dog-supplies-store" : `${animal}-supplies-store`);
    crumbs.push({ label, path: `/product-category/${rootSlug}/` });
  } else {
    crumbs.push({ label: "Shop", path: "/shop" });
  }

  if (brand) {
    crumbs.push({ label: brand, path: "" });
  }

  return crumbs;
}

function ProductCard({ p, animal }: { p: any; animal: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: Number(p.our_price),
      image_url: p.image_url,
      weight_kg: p.weight_kg,
      slug: p.slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const isOnSale = p.competitor_min && Number(p.competitor_min) > Number(p.our_price);
  const isDonation = p.name.toLowerCase().includes("donate");

  return (
    <div className="product-card">
      {isOnSale && (
        <span className="sale-badge" style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          background: "#958e09",
          color: "#ffffff",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.85rem",
          fontWeight: "600",
          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          zIndex: 2
        }}>
          Sale!
        </span>
      )}

      <Link to={`/product/${p.slug}/`} className="product-card-link">
        <div className="product-card-img">
          {p.image_url
            ? <img src={p.image_url} alt={p.name} loading="lazy" />
            : (
              <span className="placeholder-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {p.animal_type === "cat" ? <CatIcon size={64} strokeWidth={1.5} /> : <DogIcon size={64} strokeWidth={1.5} />}
              </span>
            )
          }
        </div>
        <div className="product-card-body">
          <div className="product-name" title={p.name}>{p.name}</div>
          <div className="product-price">
            {isOnSale ? (
              <>
                <span style={{ textDecoration: "line-through", textDecorationColor: "#807e7e", color: "#807e7e", fontSize: "0.85rem", marginRight: "0.5rem", fontWeight: "bold" }}>
                  {Number(p.competitor_min).toLocaleString()}KSh
                </span>
                <span style={{ color: "#ef4444" }}>
                  {Number(p.our_price).toLocaleString()}KSh
                </span>
              </>
            ) : (
              <span style={{ color: "#ef4444" }}>
                {Number(p.our_price).toLocaleString()}KSh
              </span>
            )}
          </div>
        </div>
      </Link>
      <button className={`add-to-cart-btn ${added ? "added" : ""}`} onClick={handleAdd}>
        {added ? "✓ Added" : (isDonation ? "🐾 Donate" : "Add To Cart")}
      </button>
    </div>
  );
}

export default function Shop() {
  const { 
    products, 
    totalResults, 
    totalPages,
    currentPage,
    startIndex,
    animal, 
    type, 
    urlSearch, 
    pageTitle, 
    slug, 
    brand, 
    limit, 
    urlLimit,
    sort,
    hideFilter,
    isTag,
    isSearch,
    activeSidebarSlug,
    sidebarCategories,
    isBrandPage,
    brandCategories,
    fromCat,
    fromBrand,
    lifeStage,
    offerSort
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState(urlSearch);
  const [notified, setNotified] = useState(false);

  const isClearancePage = pageTitle.toLowerCase() === "clearance" || slug.toLowerCase() === "clearance";
  const isOfferPage = isClearancePage || slug === "sale" || slug === "bundles" || type === "offer" || type === "offers" || slug === "flash-sale";

  function buildPageHref(pageNumber: number) {
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (urlLimit) p.set("limit", urlLimit);
    if (sort) p.set("sort", sort);
    if (urlSearch) p.set("q", urlSearch);
    if (hideFilter) p.set("hideFilter", "true");
    if (fromCat) p.set("from_cat", fromCat);
    if (fromBrand) p.set("from_brand", fromBrand);
    if (lifeStage) p.set("life_stage", lifeStage);
    if (offerSort) p.set("offer_sort", offerSort);
    if (pageNumber > 1) p.set("page", String(pageNumber));

    const queryStr = p.toString() ? "?" + p.toString() : "";
    if (slug) {
      return isTag ? `/product-tag/${slug}/${queryStr}` : `/product-category/${slug}/${queryStr}`;
    }
    if (animal) p.set("animal", animal);
    if (type) p.set("type", type);
    return `/shop${p.toString() ? "?" + p.toString() : ""}`;
  }

  function buildCategoryHref(newBrand: string, newLimit?: string, newSort?: string) {
    const p = new URLSearchParams();
    const activeBrand = newBrand !== undefined ? newBrand : brand;
    const activeLimit = newLimit !== undefined ? newLimit : urlLimit;
    const activeSort = newSort !== undefined ? newSort : sort;

    if (activeBrand) p.set("brand", activeBrand);
    if (activeLimit) p.set("limit", activeLimit);
    if (activeSort) p.set("sort", activeSort);
    if (urlSearch) p.set("q", urlSearch);
    if (hideFilter) p.set("hideFilter", "true");
    if (fromCat) p.set("from_cat", fromCat);
    if (fromBrand) p.set("from_brand", fromBrand);
    if (lifeStage) p.set("life_stage", lifeStage);
    if (offerSort) p.set("offer_sort", offerSort);

    const queryStr = p.toString() ? "?" + p.toString() : "";
    if (slug) {
      return isTag ? `/product-tag/${slug}/${queryStr}` : `/product-category/${slug}/${queryStr}`;
    }
    if (animal) p.set("animal", animal);
    if (type) p.set("type", type);
    return `/shop${p.toString() ? "?" + p.toString() : ""}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (urlLimit) p.set("limit", urlLimit);
    if (sort) p.set("sort", sort);
    if (searchVal.trim()) p.set("q", searchVal.trim());
    if (hideFilter) p.set("hideFilter", "true");
    if (fromCat) p.set("from_cat", fromCat);
    if (fromBrand) p.set("from_brand", fromBrand);
    if (lifeStage) p.set("life_stage", lifeStage);
    if (offerSort) p.set("offer_sort", offerSort);
    
    if (slug) {
      navigate(isTag ? `/product-tag/${slug}/${p.toString() ? "?" + p.toString() : ""}` : `/product-category/${slug}/${p.toString() ? "?" + p.toString() : ""}`);
    } else {
      if (animal) p.set("animal", animal);
      if (type)   p.set("type", type);
      navigate(`/shop${p.toString() ? "?" + p.toString() : ""}`);
    }
  }

  function clearSearch() {
    setSearchVal("");
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (urlLimit) p.set("limit", urlLimit);
    if (sort) p.set("sort", sort);
    if (hideFilter) p.set("hideFilter", "true");
    if (fromCat) p.set("from_cat", fromCat);
    if (fromBrand) p.set("from_brand", fromBrand);
    if (lifeStage) p.set("life_stage", lifeStage);
    if (offerSort) p.set("offer_sort", offerSort);
    if (slug) {
      navigate(isTag ? `/product-tag/${slug}/${p.toString() ? "?" + p.toString() : ""}` : `/product-category/${slug}/${p.toString() ? "?" + p.toString() : ""}`);
    } else {
      if (animal) p.set("animal", animal);
      if (type)   p.set("type", type);
      navigate(`/shop${p.toString() ? "?" + p.toString() : ""}`);
    }
  }

  const breadcrumbs = getBreadcrumbs(slug, animal, brand, isTag);
  const SIDEBAR_BRANDS = ["Bonnie", "King", "Montego", "Proline", "Reflex", "Royal Canin", "Spectrum", "Trendline"];

  return (
    <>
      <Navbar />
      {hideFilter && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media (min-width: 1025px) {
            .shop-layout .product-grid {
              grid-template-columns: repeat(5, 1fr) !important;
            }
          }
          @media (max-width: 1024px) and (min-width: 769px) {
            .shop-layout .product-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
        `}} />
      )}
      <div className="page" style={{ paddingTop: "2.5rem" }}>
        
        {/* Main Grid Layout with sidebar */}
        <div className="shop-layout">
          
          {/* Sidebar */}
          {!hideFilter && (
            <aside className="shop-sidebar">
              <ShopSidebarFilters
                slug={slug}
                animal={animal}
                brand={brand}
                lifeStage={lifeStage}
                type={type}
                isTag={isTag}
                isSearch={isSearch}
                activeSidebarSlug={activeSidebarSlug}
                sidebarCategories={sidebarCategories}
                isBrandPage={isBrandPage}
                brandCategories={brandCategories}
                fromCat={fromCat}
                buildCategoryHref={buildCategoryHref}
                navigate={navigate}
              />
            </aside>
          )}

          {/* Main Content Area */}
          <main className="shop-main">
            
            {/* Page Title */}
            <h1 className={`shop-page-title ${isSearch ? "search-results-title" : ""}`}>{pageTitle}</h1>

            {/* Breadcrumbs */}
            <div className="breadcrumb-container" style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx}>
                  {idx > 0 && <span className="breadcrumb-separator">/</span>}
                  {crumb.path ? (
                    <Link to={crumb.path}>{crumb.label}</Link>
                  ) : (
                    <span className="breadcrumb-active">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>

            {/* Clearance Disclaimer & Sign up Form */}
            {isClearancePage && (
              <div className="clearance-container" style={{ marginBottom: "2rem" }}>
                {/* Red Bold Disclaimer */}
                <div style={{
                  color: "#ef4444",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                  marginBottom: "1rem"
                }}>
                  CLEARANCE OFFERS ARE EXCLUSIVE TO OUR ONLINE STORE. NO COUPONS OR ADDITIONAL DISCOUNTS MAY BE APPLIED. NO EXCHANGES. WHILE SUPPLIES LAST.
                </div>
                
                {/* Description */}
                <div style={{
                  color: "#334155",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  marginBottom: "1.5rem"
                }}>
                  <strong>DEFECT / DAMAGED PACKAGE:</strong> [CAT LITTER ONLY] product intact with slight defect on packaging (e.g. slightly ripped bag) that does not affect the quality of the enclosed product. <strong>SHORT EXPIRY:</strong> expiration of product is within THREE months.
                </div>

                {/* Newsletter / Sign up Card */}
                <div style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  background: "#f8fafc",
                  marginBottom: "1.5rem"
                }}>
                  <h3 style={{
                    color: "#1053a0",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    margin: "0 0 1rem 0"
                  }}>
                    Sign up to receive our weekly clearance products
                  </h3>
                  {notified ? (
                    <div style={{ color: "#16a34a", fontWeight: "600", fontSize: "0.95rem" }}>
                      ✓ Thank you! You will be notified of weekly clearance products.
                    </div>
                  ) : (
                    <form style={{ display: "flex", gap: "0.75rem" }} onSubmit={e => { e.preventDefault(); setNotified(true); }}>
                      <input 
                        type="email" 
                        placeholder="Enter your email" 
                        required
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.95rem",
                          outline: "none"
                        }}
                      />
                      <button 
                        type="submit" 
                        style={{
                          background: "#1053a0",
                          color: "#ffffff",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "6px",
                          border: "none",
                          fontWeight: "600",
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "#0c3f7a"}
                        onMouseOut={e => e.currentTarget.style.background = "#1053a0"}
                      >
                        Notify Me
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Shop Toolbar */}
            <div className="shop-toolbar">
              <div className="toolbar-left">
                <span className="results-count">
                  {totalResults > limit ? (
                    `Showing ${startIndex + 1}–${Math.min(startIndex + limit, totalResults)} of ${totalResults} results`
                  ) : (
                    `Showing all ${totalResults} results`
                  )}
                </span>
                
                {/* Products per page select */}
                <div className="paging-control">
                  <span>Products per page:</span>
                  <select 
                    value={urlLimit} 
                    onChange={e => {
                      const val = e.target.value;
                      navigate(buildCategoryHref(brand, val, sort));
                    }}
                    className="paging-select"
                  >
                    <option value="">-- Select --</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                    <option value="72">72</option>
                  </select>
                </div>
              </div>

              {/* Sorting dropdown */}
              <select
                value={sort}
                onChange={e => navigate(buildCategoryHref(brand, urlLimit, e.target.value))}
                className="sorting-select"
              >
                <option value="availability">AVAILABILITY</option>
                <option value="price-asc">SORT BY PRICE: LOW TO HIGH</option>
                <option value="price-desc">SORT BY PRICE: HIGH TO LOW</option>
                {isOfferPage && (
                  <>
                    <option value="expiry-asc">SORT BY EXPIRY: OLD TO NEW</option>
                    <option value="expiry-desc">SORT BY EXPIRY: NEW TO OLD</option>
                  </>
                )}
                {(!animal || isSearch) && (
                  <>
                    <option value="psk_pet_dog">FILTER BY PET: DOG</option>
                    <option value="psk_pet_cat">FILTER BY PET: CAT</option>
                  </>
                )}
              </select>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div style={{ padding: "4rem 0", textAlign: "center", color: "var(--ink-light)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🐾</div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem" }}>
                  No products found matching the criteria. <Link to={buildCategoryHref("")}>Clear brand filter</Link>
                </p>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map((p: any) => <ProductCard key={p.id} p={p} animal={animal} />)}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    {currentPage > 1 && (
                      <Link to={buildPageHref(currentPage - 1)} className="pagination-btn">
                        ←
                      </Link>
                    )}

                    {getVisiblePages(currentPage, totalPages).map((p, idx) => {
                      if (p === "...") {
                        return (
                          <span key={`dots-${idx}`} style={{ padding: "0.5rem 0.75rem", color: "#94a3b8" }}>
                            ...
                          </span>
                        );
                      }
                      
                      const isCurrent = p === currentPage;
                      return (
                        <Link
                          key={`page-${p}`}
                          to={buildPageHref(Number(p))}
                          className={`pagination-btn ${isCurrent ? "active" : ""}`}
                        >
                          {p}
                        </Link>
                      );
                    })}

                    {currentPage < totalPages && (
                      <Link to={buildPageHref(currentPage + 1)} className="pagination-btn">
                        →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}

          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}

function getVisiblePages(current: number, total: number) {
  const pages: (number | string)[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(total);
    }
  }
  return pages;
}

