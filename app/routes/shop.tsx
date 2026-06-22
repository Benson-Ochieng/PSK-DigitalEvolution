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
  const limit  = Number(url.searchParams.get("limit")) || 0;
  const sort   = url.searchParams.get("sort") || "availability";

  let search = urlSearch;

  if (slug) {
    const normSlug = slug.toLowerCase().replace(/\/$/, "");
    if (normSlug === "cat-food" || normSlug === "cat") {
      animal = "cat";
    } else if (normSlug === "kitten-food" || normSlug === "kitten") {
      animal = "cat";
      search = "kitten";
    } else if (normSlug === "dog-food" || normSlug === "dog") {
      animal = "dog";
    } else if (normSlug === "puppy-food" || normSlug === "puppy") {
      animal = "dog";
      search = "puppy";
    } else if (normSlug === "bird-food" || normSlug === "bird") {
      animal = "bird";
    } else if (normSlug === "rabbit-food" || normSlug === "rabbit") {
      animal = "rabbit";
    }
  }

  let pageTitle = "All Pet Food";
  if (slug) {
    const normSlug = slug.toLowerCase().replace(/\/$/, "");
    if (normSlug === "cat-food" || normSlug === "cat") pageTitle = "Cat Food";
    else if (normSlug === "kitten-food" || normSlug === "kitten") pageTitle = "Kitten Food";
    else if (normSlug === "dog-food" || normSlug === "dog") pageTitle = "Dog Food";
    else if (normSlug === "puppy-food" || normSlug === "puppy") pageTitle = "Puppy Food";
    else if (normSlug === "bird-food" || normSlug === "bird") pageTitle = "Bird Food";
    else if (normSlug === "rabbit-food" || normSlug === "rabbit") pageTitle = "Rabbit Food";
  } else {
    if (animal === "dog") pageTitle = "Dog Food";
    else if (animal === "cat") pageTitle = "Cat Food";
    else if (type === "treat") pageTitle = "Treats";
    else if (type === "wet") pageTitle = "Wet Food";
  }

  const conditions: string[] = [];
  const sqlParams: any[] = [];

  if (animal) { sqlParams.push(animal); conditions.push(`p.animal_type = $${sqlParams.length}`); }
  if (type)   { sqlParams.push(type);   conditions.push(`p.food_type = $${sqlParams.length}`); }
  if (search) { sqlParams.push(`%${search.toLowerCase()}%`); conditions.push(`LOWER(p.name) LIKE $${sqlParams.length}`); }
  if (brand)  { sqlParams.push(brand);  conditions.push(`LOWER(p.brand) = LOWER($${sqlParams.length})`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "(COALESCE(MIN(comp.price), 0) - bbp.price) DESC, p.name";
  if (sort === "price-asc") {
    orderBy = "bbp.price ASC, p.name";
  } else if (sort === "price-desc") {
    orderBy = "bbp.price DESC, p.name";
  }

  const res = await query(`
    SELECT
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url,
      bbp.price AS our_price,
      MIN(comp.price) AS competitor_min
    FROM products p
    JOIN store_prices bbp  ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    LEFT JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'PetStore Kenya'
    ${where}
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, bbp.price
    ORDER BY ${orderBy}
  `, sqlParams);

  const allProducts = res.rows;
  const totalResults = allProducts.length;
  const productsToShow = limit > 0 ? allProducts.slice(0, limit) : allProducts;

  return { 
    products: productsToShow, 
    totalResults, 
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
    if (normSlug.includes("cat") || normSlug.includes("kitten")) {
      crumbs.push({ label: "Cat", path: "/product-category/cat-food/" });
      crumbs.push({ label: "Cat Food & Treats", path: "/product-category/cat-food/" });
      if (normSlug === "kitten-food" || normSlug === "kitten") {
        crumbs.push({ label: "Kitten Food", path: "/product-category/kitten-food/" });
      }
    } else if (normSlug.includes("dog") || normSlug.includes("puppy")) {
      crumbs.push({ label: "Dog", path: "/product-category/dog-food/" });
      crumbs.push({ label: "Dog Food & Treats", path: "/product-category/dog-food/" });
      if (normSlug === "puppy-food" || normSlug === "puppy") {
        crumbs.push({ label: "Puppy Food", path: "/product-category/puppy-food/" });
      }
    } else if (normSlug.includes("bird")) {
      crumbs.push({ label: "Bird", path: "/product-category/bird-food/" });
      crumbs.push({ label: "Bird Food & Feeds", path: "/product-category/bird-food/" });
    } else if (normSlug.includes("rabbit")) {
      crumbs.push({ label: "Rabbit", path: "/product-category/rabbit-food/" });
      crumbs.push({ label: "Rabbit Food", path: "/product-category/rabbit-food/" });
    } else {
      crumbs.push({ label: slug, path: `/product-category/${slug}/` });
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

      <Link to={`/shop/${p.id}`} className="product-card-link">
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
          </aside>

          {/* Main Content Area */}
          <main className="shop-main">
            
            {/* Breadcrumbs */}
            <div className="breadcrumb-container">
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

            {/* Page Title */}
            <h1 className="shop-page-title">{pageTitle}</h1>

            {/* Shop Toolbar */}
            <div className="shop-toolbar">
              <div className="toolbar-left">
                <span className="results-count">Showing all {totalResults} results</span>
                
                {/* Products per page select */}
                <div className="paging-control">
                  <span>Products per page:</span>
                  <select 
                    value={limit || ""} 
                    onChange={e => {
                      const val = Number(e.target.value) || 0;
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
              <div className="product-grid">
                {products.map((p: any) => <ProductCard key={p.id} p={p} animal={animal} />)}
              </div>
            )}

          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}

