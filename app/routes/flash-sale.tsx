import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "Flash Sale — PetStore Kenya" },
    { name: "description", content: "Don't miss our lightning-fast pet food flash sales at PetStore Kenya. Up to 50% off select brands!" }
  ];
}

export async function loader() {
  const res = await query(`
    SELECT
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug,
      bbp.price AS our_price,
      MIN(comp.price) AS competitor_min
    FROM products p
    JOIN store_prices bbp  ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    LEFT JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'PetStore Kenya'
    WHERE p.food_type = 'flash-sale'
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug, bbp.price
    ORDER BY p.name ASC
  `);
  return { products: res.rows };
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

export default function FlashSale() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem" }}>
        <div className="shop-layout" style={{ flexDirection: "column" }}>
          
          {/* Header Banner */}
          <div style={{
            background: "#fdf8e2",
            borderTop: "1px solid #fbeed5",
            borderBottom: "1px solid #fbeed5",
            padding: "1rem",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            borderRadius: "4px",
            marginBottom: "2rem"
          }}>
            <span style={{ color: "#f59e0b", fontSize: "1.2rem" }}>🐾</span>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#1053a0",
              margin: 0,
              letterSpacing: "0.05em"
            }}>
              FLASH SALE
            </h1>
            <span style={{ color: "#f59e0b", fontSize: "1.2rem" }}>🐾</span>
          </div>

          {products.length === 0 ? (
            /* Empty UI State matching screenshot */
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "4rem 1rem",
              fontFamily: "var(--font-sans)"
            }}>
              <div style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span style={{ color: "#ea580c" }}>⚡</span> No flash sale at the moment
              </div>
              <p style={{
                fontSize: "0.95rem",
                color: "#64748b",
                maxWidth: "750px",
                lineHeight: 1.6,
                margin: 0
              }}>
                There's no flash sale on right now, but when it returns, you won't want to miss it! Our flash sales offer up to a 50% discount and they go fast.
              </p>
            </div>
          ) : (
            /* Product List UI State */
            <div className="product-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
