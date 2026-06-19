import { Link, useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/shop";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { DogIcon, CatIcon, BoneIcon, DropletIcon } from "../components/CategoryIcon";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Shop Pet Food — Pet Food Bag" },
    { name: "description", content: "Browse all pet food products. Dog food, cat food, treats and more — always cheaper than Naivas, Carrefour & Quickmart." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const animal = url.searchParams.get("animal") || "";
  const type   = url.searchParams.get("type")   || "";
  const search = url.searchParams.get("q")       || "";

  const conditions: string[] = [];
  const params: any[] = [];

  if (animal) { params.push(animal); conditions.push(`p.animal_type = $${params.length}`); }
  if (type)   { params.push(type);   conditions.push(`p.food_type = $${params.length}`); }
  if (search) { params.push(`%${search.toLowerCase()}%`); conditions.push(`LOWER(p.name) LIKE $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const res = await query(`
    SELECT
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url,
      bbp.price AS our_price,
      MIN(comp.price) AS competitor_min
    FROM products p
    JOIN store_prices bbp  ON bbp.product_id = p.id AND bbp.store_name = 'Pet Food Bag'
    LEFT JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'Pet Food Bag'
    ${where}
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, bbp.price
    ORDER BY (COALESCE(MIN(comp.price), 0) - bbp.price) DESC, p.name
  `, params);

  return { products: res.rows, animal, type, search };
}

const FILTERS = [
  { label: "All",       iconType: "all",    animal: "",    type: "" },
  { label: "Dogs",      iconType: "dog",    animal: "dog", type: "" },
  { label: "Cats",      iconType: "cat",    animal: "cat", type: "" },
  { label: "Treats",    iconType: "treat",  animal: "",    type: "treat" },
  { label: "Wet",       iconType: "wet",    animal: "",    type: "wet" },
];

// Navbar is imported from shared components directory

function ProductCard({ p, animal }: { p: any; animal: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const save = p.competitor_min ? Math.round(p.competitor_min - p.our_price) : 0;

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

  const waMsg = encodeURIComponent(`Hi Pet Food Bag, I'd like to order: ${p.name}`);

  return (
    <div className="product-card">
      <span className="animal-badge">{p.food_type}</span>
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
          <div className="product-brand">{p.brand}</div>
          <div className="product-name">{p.name}</div>
          <div className="product-price-row">
            <span className="product-price">KES {Number(p.our_price).toLocaleString()}</span>
            {p.weight_kg && <span className="product-price-unit">{p.weight_kg}kg</span>}
          </div>
          {save > 0 && (
            <span className="save-badge">▼ Save KES {save.toLocaleString()} vs competitors</span>
          )}
        </div>
      </Link>
      <button className={`add-to-cart-btn ${added ? "added" : ""}`} onClick={handleAdd}>
        {added ? "✓ Added!" : "🛒 Add to Cart"}
      </button>
      <a href={`https://wa.me/254700000000?text=${waMsg}`} className="product-card-footer" target="_blank" rel="noreferrer">
        📱 Order on WhatsApp
      </a>
    </div>
  );
}

export default function Shop() {
  const { products, animal, type, search } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState(search);

  function buildHref(a: string, t: string) {
    const p = new URLSearchParams();
    if (a) p.set("animal", a);
    if (t) p.set("type", t);
    return `/shop${p.toString() ? "?" + p.toString() : ""}`;
  }

  const isActive = (a: string, t: string) => a === animal && t === type;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (animal) p.set("animal", animal);
    if (type)   p.set("type", type);
    if (searchVal.trim()) p.set("q", searchVal.trim());
    // if q is empty it simply won't be added — clears the param
    navigate(`/shop${p.toString() ? "?" + p.toString() : ""}`);
  }

  function clearSearch() {
    setSearchVal("");
    const p = new URLSearchParams();
    if (animal) p.set("animal", animal);
    if (type)   p.set("type", type);
    navigate(`/shop${p.toString() ? "?" + p.toString() : ""}`);
  }

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem" }}>
        <div style={{ marginBottom: "2rem", borderBottom: "2px solid var(--primary)", paddingBottom: "1.5rem" }}>
          <div className="section-title">Browse</div>
          <h1 className="section-heading" style={{ marginBottom: "1rem" }}>
            {animal === "dog" ? "Dog Food" : animal === "cat" ? "Cat Food" : type === "treat" ? "Treats" : type === "wet" ? "Wet Food" : "All Pet Food"}
          </h1>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", maxWidth: "420px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search products…"
                style={{ width: "100%", padding: "0.6rem 2.2rem 0.6rem 0.75rem", border: "1px solid var(--border-light)", background: "var(--card-bg)", fontFamily: "var(--font-sans)", fontSize: "0.85rem", outline: "none", borderRadius: "4px" }}
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{ position: "absolute", right: "0.4rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--ink-light)", lineHeight: 1, padding: "0.2rem" }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ padding: "0.6rem 1.2rem" }}>Search</button>
          </form>
        </div>


        <div className="filter-bar">
          {FILTERS.map(f => {
            let icon = null;
            if (f.iconType === "dog") icon = <DogIcon size={14} strokeWidth={2.2} />;
            if (f.iconType === "cat") icon = <CatIcon size={14} strokeWidth={2.2} />;
            if (f.iconType === "treat") icon = <BoneIcon size={14} strokeWidth={2.2} />;
            if (f.iconType === "wet") icon = <DropletIcon size={14} strokeWidth={2.2} />;
            return (
              <Link key={f.label} to={buildHref(f.animal, f.type)} className={`filter-btn ${isActive(f.animal, f.type) ? "active" : ""}`}>
                {icon}
                <span>{f.label}</span>
              </Link>
            );
          })}
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-light)", alignSelf: "center" }}>
            {products.length} product{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: "4rem 0", textAlign: "center", color: "var(--ink-light)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🐾</div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
              No products found. <Link to="/shop">Clear filters</Link>
            </p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p: any) => <ProductCard key={p.id} p={p} animal={animal} />)}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
