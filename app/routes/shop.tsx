import { Link, useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/shop";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { DogIcon, CatIcon, BoneIcon, DropletIcon } from "../components/CategoryIcon";

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  const title = data?.pageTitle ? `${data.pageTitle} — PetStore Kenya` : "Shop Pet Food — PetStore Kenya";
  return [
    { title },
    { name: "description", content: `Browse all ${data?.pageTitle || "pet food"} products at PetStore Kenya — always cheaper than Naivas, Carrefour & Quickmart.` }
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const routeParams = params as any;
  const slug = routeParams.slug || "";

  let animal = url.searchParams.get("animal") || "";
  let type   = url.searchParams.get("type")   || "";
  const urlSearch = url.searchParams.get("q") || "";
  let brand  = url.searchParams.get("brand")   || "";
  const limit  = Number(url.searchParams.get("limit")) || 24;
  const sort   = url.searchParams.get("sort") || "availability";

  let search = urlSearch;
  let categorySlug = "";

  if (slug) {
    const normSlug = slug.toLowerCase().replace(/\/$/, "");
    if (normSlug === "cat-food" || normSlug === "cat" || normSlug === "cat-supplies-store" || normSlug === "cat-food-and-treats") {
      animal = "cat";
    } else if (normSlug === "kitten-food" || normSlug === "kitten" || normSlug === "kitten-treats") {
      animal = "cat";
      search = "kitten";
    } else if (normSlug === "dog-food" || normSlug === "dog" || normSlug === "dog-supplies-store" || normSlug === "dog-food-treats") {
      animal = "dog";
    } else if (normSlug === "puppy-food" || normSlug === "puppy") {
      animal = "dog";
      search = "puppy";
    } else if (normSlug === "bird-food" || normSlug === "bird" || normSlug === "bird-supplies-store" || normSlug === "bird-food-treats") {
      animal = "bird";
    } else if (normSlug === "rabbit-food" || normSlug === "rabbit") {
      animal = "rabbit";
    } else {
      // It's a specific subcategory
      categorySlug = normSlug;
      if (normSlug.includes("cat") || normSlug.includes("kitten") || normSlug === "litter-and-accessories" || normSlug === "cat-litter-and-accessories") {
        animal = "cat";
      } else if (normSlug.includes("dog") || normSlug.includes("puppy")) {
        animal = "dog";
      }
    }
  }

  let pageTitle = "All Pet Food";
  if (slug) {
    const normSlug = slug.toLowerCase().replace(/\/$/, "");
    const matchedCat = CAT_CATEGORIES.find(c => c.slug === normSlug) || DOG_CATEGORIES.find(c => c.slug === normSlug);
    if (matchedCat) {
      pageTitle = matchedCat.label;
    } else if (normSlug === "cat-food" || normSlug === "cat" || normSlug === "cat-supplies-store" || normSlug === "cat-food-and-treats") {
      pageTitle = "Cat";
    } else if (normSlug === "dog-food" || normSlug === "dog" || normSlug === "dog-supplies-store" || normSlug === "dog-food-treats") {
      pageTitle = "Dog";
    } else if (normSlug === "kitten-food" || normSlug === "kitten") {
      pageTitle = "Kitten";
    } else if (normSlug === "puppy-food" || normSlug === "puppy") {
      pageTitle = "Puppy";
    } else if (normSlug === "bird-food" || normSlug === "bird" || normSlug === "bird-supplies-store") {
      pageTitle = "Bird";
    } else if (normSlug === "rabbit-food" || normSlug === "rabbit") {
      pageTitle = "Rabbit";
    } else {
      pageTitle = normSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  } else {
    if (animal === "dog") pageTitle = "Dog";
    else if (animal === "cat") pageTitle = "Cat";
    else if (type === "treat") pageTitle = "Treats";
    else if (type === "wet") pageTitle = "Wet Food";
  }

  const conditions: string[] = [];
  const sqlParams: any[] = [];

  if (animal) { sqlParams.push(animal); conditions.push(`p.animal_type = $${sqlParams.length}`); }
  if (type)   { sqlParams.push(type);   conditions.push(`p.food_type = $${sqlParams.length}`); }
  if (search) { sqlParams.push(`%${search.toLowerCase()}%`); conditions.push(`LOWER(p.name) LIKE $${sqlParams.length}`); }
  if (brand)  { sqlParams.push(brand);  conditions.push(`LOWER(p.brand) = LOWER($${sqlParams.length})`); }
  if (categorySlug) {
    sqlParams.push(JSON.stringify([{ slug: categorySlug }]));
    conditions.push(`p.categories @> $${sqlParams.length}::jsonb`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "(COALESCE(MIN(comp.price), 0) - bbp.price) DESC, p.name";
  if (sort === "price-asc") {
    orderBy = "bbp.price ASC, p.name";
  } else if (sort === "price-desc") {
    orderBy = "bbp.price DESC, p.name";
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

  return { 
    products: productsToShow, 
    totalResults, 
    totalPages,
    currentPage,
    animal, 
    type, 
    urlSearch, 
    pageTitle, 
    slug, 
    brand, 
    limit, 
    sort 
  };
}

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

const FILTERS = [
  { label: "All",       iconType: "all",    animal: "",    type: "" },
  { label: "Dogs",      iconType: "dog",    animal: "dog", type: "" },
  { label: "Cats",      iconType: "cat",    animal: "cat", type: "" },
  { label: "Treats",    iconType: "treat",  animal: "",    type: "treat" },
  { label: "Wet",       iconType: "wet",    animal: "",    type: "wet" },
];

function getBreadcrumbs(slug: string, animal: string, brand?: string) {
  const crumbs = [
    { label: "Home", path: "/" }
  ];

  if (slug) {
    const normSlug = slug.toLowerCase().replace(/\/$/, "");
    const catSub = CAT_CATEGORIES.find(c => c.slug === normSlug);
    const dogSub = DOG_CATEGORIES.find(c => c.slug === normSlug);

    if (catSub) {
      crumbs.push({ label: "Cat", path: "/product-category/cat-food/" });
      crumbs.push({ label: catSub.label, path: `/product-category/${catSub.slug}/` });
    } else if (dogSub) {
      crumbs.push({ label: "Dog", path: "/product-category/dog-food/" });
      crumbs.push({ label: dogSub.label, path: `/product-category/${dogSub.slug}/` });
    } else if (normSlug === "cat-food" || normSlug === "cat" || normSlug === "cat-supplies-store" || normSlug === "cat-food-and-treats") {
      crumbs.push({ label: "Cat", path: "/product-category/cat-food/" });
    } else if (normSlug === "dog-food" || normSlug === "dog" || normSlug === "dog-supplies-store" || normSlug === "dog-food-treats") {
      crumbs.push({ label: "Dog", path: "/product-category/dog-food/" });
    } else if (normSlug === "kitten-food" || normSlug === "kitten") {
      crumbs.push({ label: "Cat", path: "/product-category/cat-food/" });
      crumbs.push({ label: "Kitten Food", path: "/product-category/kitten-food/" });
    } else if (normSlug === "puppy-food" || normSlug === "puppy") {
      crumbs.push({ label: "Dog", path: "/product-category/dog-food/" });
      crumbs.push({ label: "Puppy Food", path: "/product-category/puppy-food/" });
    } else if (normSlug === "bird-food" || normSlug === "bird" || normSlug === "bird-supplies-store" || normSlug === "bird-food-treats") {
      crumbs.push({ label: "Bird", path: "/product-category/bird-food/" });
    } else if (normSlug === "rabbit-food" || normSlug === "rabbit") {
      crumbs.push({ label: "Rabbit", path: "/product-category/rabbit-food/" });
    } else {
      crumbs.push({ label: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), path: `/product-category/${slug}/` });
    }
  } else if (animal) {
    const label = animal.charAt(0).toUpperCase() + animal.slice(1);
    crumbs.push({ label, path: `/product-category/${animal}-food/` });
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
          background: "#84cc16",
          color: "#ffffff",
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
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
                <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "0.85rem", marginRight: "0.5rem", fontWeight: "normal" }}>
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
    animal, 
    type, 
    urlSearch, 
    pageTitle, 
    slug, 
    brand, 
    limit, 
    sort 
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState(urlSearch);

  function buildPageHref(pageNumber: number) {
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (limit) p.set("limit", String(limit));
    if (sort) p.set("sort", sort);
    if (urlSearch) p.set("q", urlSearch);
    if (pageNumber > 1) p.set("page", String(pageNumber));

    const queryStr = p.toString() ? "?" + p.toString() : "";
    if (slug) {
      return `/product-category/${slug}/${queryStr}`;
    }
    if (animal) p.set("animal", animal);
    if (type) p.set("type", type);
    return `/shop${p.toString() ? "?" + p.toString() : ""}`;
  }

  function buildCategoryHref(newBrand: string, newLimit?: number, newSort?: string) {
    const p = new URLSearchParams();
    const activeBrand = newBrand !== undefined ? newBrand : brand;
    const activeLimit = newLimit !== undefined ? newLimit : limit;
    const activeSort = newSort !== undefined ? newSort : sort;

    if (activeBrand) p.set("brand", activeBrand);
    if (activeLimit) p.set("limit", String(activeLimit));
    if (activeSort) p.set("sort", activeSort);
    if (urlSearch) p.set("q", urlSearch);

    const queryStr = p.toString() ? "?" + p.toString() : "";
    if (slug) {
      return `/product-category/${slug}/${queryStr}`;
    }
    if (animal) p.set("animal", animal);
    if (type) p.set("type", type);
    return `/shop${p.toString() ? "?" + p.toString() : ""}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (limit) p.set("limit", String(limit));
    if (sort) p.set("sort", sort);
    if (searchVal.trim()) p.set("q", searchVal.trim());
    
    if (slug) {
      navigate(`/product-category/${slug}/${p.toString() ? "?" + p.toString() : ""}`);
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
    if (limit) p.set("limit", String(limit));
    if (sort) p.set("sort", sort);
    if (slug) {
      navigate(`/product-category/${slug}/${p.toString() ? "?" + p.toString() : ""}`);
    } else {
      if (animal) p.set("animal", animal);
      if (type)   p.set("type", type);
      navigate(`/shop${p.toString() ? "?" + p.toString() : ""}`);
    }
  }

  const breadcrumbs = getBreadcrumbs(slug, animal, brand);
  const SIDEBAR_BRANDS = ["Bonnie", "King", "Montego", "Proline", "Reflex", "Royal Canin", "Spectrum", "Trendline"];

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem" }}>
        
        {/* Main Grid Layout with sidebar */}
        <div className="shop-layout">
          
          {/* Sidebar */}
          <aside className="shop-sidebar">
            {animal === "cat" && (
              <>
                <h3 className="sidebar-title">CATEGORIES</h3>
                <ul className="sidebar-brands-list" style={{ marginBottom: "2.5rem" }}>
                  {CAT_CATEGORIES.map(c => {
                    const normSlug = slug.toLowerCase().replace(/\/$/, "");
                    const isActive = normSlug === c.slug;
                    return (
                      <li key={c.slug}>
                        <Link 
                          to={`/product-category/${c.slug}/`} 
                          className={isActive ? "active-brand" : ""}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {animal === "dog" && (
              <>
                <h3 className="sidebar-title">CATEGORIES</h3>
                <ul className="sidebar-brands-list" style={{ marginBottom: "2.5rem" }}>
                  {DOG_CATEGORIES.map(c => {
                    const normSlug = slug.toLowerCase().replace(/\/$/, "");
                    const isActive = normSlug === c.slug;
                    return (
                      <li key={c.slug}>
                        <Link 
                          to={`/product-category/${c.slug}/`} 
                          className={isActive ? "active-brand" : ""}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {!animal && (
              <>
                <h3 className="sidebar-title">FILTER BY BRAND</h3>
                <ul className="sidebar-brands-list">
                  <li>
                    <Link to={buildCategoryHref("")} className={!brand ? "active-brand" : ""}>
                      All Brands
                    </Link>
                  </li>
                  {SIDEBAR_BRANDS.map(b => (
                    <li key={b}>
                      <Link to={buildCategoryHref(b)} className={brand.toLowerCase() === b.toLowerCase() ? "active-brand" : ""}>
                        {b}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>

          {/* Main Content Area */}
          <main className="shop-main">
            
            {/* Page Title */}
            <h1 className="shop-page-title">{pageTitle}</h1>

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

            {/* Shop Toolbar */}
            <div className="shop-toolbar">
              <div className="toolbar-left">
                <span className="results-count">Showing all {totalResults} results</span>
                
                {/* Products per page select */}
                <div className="paging-control">
                  <span>Products per page:</span>
                  <select 
                    value={limit || 24} 
                    onChange={e => {
                      const val = Number(e.target.value) || 24;
                      navigate(buildCategoryHref(brand, val, sort));
                    }}
                    className="paging-select"
                  >
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
                onChange={e => navigate(buildCategoryHref(brand, limit, e.target.value))}
                className="sorting-select"
              >
                <option value="availability">AVAILABILITY</option>
                <option value="price-asc">SORT BY PRICE: LOW TO HIGH</option>
                <option value="price-desc">SORT BY PRICE: HIGH TO LOW</option>
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

