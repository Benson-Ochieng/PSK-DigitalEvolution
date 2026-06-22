import { Link, useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/new-arrivals";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "New Arrivals — PetStore Kenya" },
    { name: "description", content: "Check out our newest pet food arrivals and treats at PetStore Kenya. Top brands and freshest stock!" }
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const limit  = Number(url.searchParams.get("limit")) || 0;
  const sort   = url.searchParams.get("sort") || "availability";

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
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, bbp.price
    ORDER BY p.id DESC, ${orderBy}
  `);

  const allProducts = res.rows;
  const totalResults = allProducts.length;
  const productsToShow = limit > 0 ? allProducts.slice(0, limit) : allProducts;

  return { 
    products: productsToShow, 
    totalResults,
    limit, 
    sort 
  };
}

function ProductCard({ p }: { p: any }) {
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
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} loading="lazy" />
          ) : (
            <span className="placeholder-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "150px" }}>
              🐾
            </span>
          )}
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

export default function NewArrivals() {
  const { products, totalResults, limit, sort } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  function buildHref(newLimit?: number, newSort?: string) {
    const p = new URLSearchParams();
    const activeLimit = newLimit !== undefined ? newLimit : limit;
    const activeSort = newSort !== undefined ? newSort : sort;

    if (activeLimit) p.set("limit", String(activeLimit));
    if (activeSort) p.set("sort", activeSort);

    const queryStr = p.toString() ? "?" + p.toString() : "";
    return `/product-tag/new-arrivals/${queryStr}`;
  }

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 1.5rem" }}>
          
          {/* Underlined Heading */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#1053a0",
              margin: 0,
              paddingBottom: "0.5rem",
              borderBottom: "2px solid #1053a0",
              display: "inline-block"
            }}>
              New Arrivals
            </h1>
          </div>

          {/* Shop Toolbar */}
          <div className="shop-toolbar" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
            <div className="toolbar-left">
              <span className="results-count">Showing 1-{products.length} of {totalResults} results</span>
              
              {/* Products per page select */}
              <div className="paging-control">
                <span>Products per page:</span>
                <select 
                  value={limit || ""} 
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    navigate(buildHref(val, sort));
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
              onChange={e => navigate(buildHref(limit, e.target.value))}
              className="sorting-select"
            >
              <option value="availability">AVAILABILITY</option>
              <option value="price-asc">SORT BY PRICE: LOW TO HIGH</option>
              <option value="price-desc">SORT BY PRICE: HIGH TO LOW</option>
            </select>
          </div>

          {/* Products Grid */}
          <div className="new-arrivals-grid">
            {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
