import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/product.$slug";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import { DogIcon, CatIcon } from "../components/CategoryIcon";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const productCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export async function loader({ params }: Route.LoaderArgs) {
  const cacheKey = params.slug;
  const now = Date.now();
  if (productCache[cacheKey] && (now - productCache[cacheKey].timestamp) < CACHE_TTL) {
    return productCache[cacheKey].data;
  }

  // Query by p.slug instead of p.id
  const { rows } = await query(`
    SELECT
      p.*,
      json_agg(
        json_build_object(
          'store', sp.store_name,
          'price', sp.price,
          'url', sp.product_url,
          'in_stock', sp.in_stock,
          'last_updated', sp.last_updated
        ) ORDER BY sp.store_name = 'PetStore Kenya' DESC, sp.price ASC
      ) AS prices
    FROM products p
    JOIN store_prices sp ON sp.product_id = p.id
    WHERE p.slug = $1 AND p.status = 'publish'
    GROUP BY p.id
  `, [params.slug]);

  if (!rows[0]) throw new Response("Not Found", { status: 404 });
  
  const result = { product: rows[0] };
  productCache[cacheKey] = { data: result, timestamp: now };
  return result;
}

export function meta({ data }: Route.MetaArgs) {
  const p = data?.product;
  return [
    { title: `${p?.name ?? "Product"} - PetStore Kenya` },
    { name: "description", content: `Buy ${p?.name} online. Always cheaper than Carrefour & Naivas. Fast Nairobi delivery.` },
  ];
}

export default function ProductDetail() {
  const { product: p } = useLoaderData<typeof loader>();
  const { addItem, setIsCartOpen } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const prices: any[] = p.prices || [];
  const ourPrice = prices.find((x: any) => x.store === "PetStore Kenya");
  const competitors = prices.filter((x: any) => x.store !== "PetStore Kenya");
  const cheapestComp = competitors.reduce((min: any, c: any) => (!min || c.price < min.price ? c : min), null);
  const saving = cheapestComp ? Math.round(cheapestComp.price - (ourPrice?.price ?? 0)) : 0;
  const waMsg = encodeURIComponent(`Hi PetStore Kenya, I'd like to order: ${p.name} (KES ${ourPrice?.price ?? ""})`);

  function handleAdd() {
    if (!ourPrice) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: Number(ourPrice.price),
        image_url: p.image_url,
        weight_kg: p.weight_kg,
        slug: p.slug,
      });
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsCartOpen(true);
    }, 1000);
  }

  return (
    <>
      <Navbar />

      <div className="product-detail-container">
        {/* Main layout grid */}
        <div className="product-detail-layout">
          {/* Left Column: Image */}
          <div className="product-image-panel">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} />
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: "300px", opacity: 0.15 }}>
                {p.animal_type === "cat" ? <CatIcon size={128} strokeWidth={1} /> : <DogIcon size={128} strokeWidth={1} />}
              </span>
            )}
          </div>

          {/* Right Column: Details */}
          <div>
            <div style={{ position: "relative", marginBottom: "1.25rem", paddingBottom: "0.75rem" }}>
              <h1 style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.5rem",
                fontWeight: 500,
                color: "#1e5da7",
                lineHeight: 1.3,
                margin: 0,
                padding: 0
              }}>
                {p.name}
              </h1>
              {/* Decorative two-toned underline */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "#e2e8f0"
              }}>
                <div style={{
                  width: "60px",
                  height: "100%",
                  background: "#1e5da7"
                }} />
              </div>
            </div>

            {ourPrice && (
              <div style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.45rem",
                marginBottom: "1.25rem"
              }}>
                {cheapestComp && Number(cheapestComp.price) > Number(ourPrice.price) ? (
                  <>
                    <span style={{ textDecoration: "line-through", textDecorationColor: "#807e7e", color: "#807e7e", fontSize: "1.1rem", marginRight: "0.75rem", fontWeight: "normal" }}>
                      {Number(cheapestComp.price).toLocaleString()}KSh
                    </span>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>
                      {Number(ourPrice.price).toLocaleString()}KSh
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>
                    {Number(ourPrice.price).toLocaleString()}KSh
                  </span>
                )}
              </div>
            )}

            {p.description && (
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#475569",
                marginBottom: "2rem"
              }}>
                {p.description.length > 250 ? p.description.slice(0, 250) + "..." : p.description}
              </p>
            )}

            {/* Quantity Selector + Add To Cart Button */}
            {ourPrice && (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{
                      background: "#f8fafc",
                      border: "none",
                      width: "36px",
                      height: "36px",
                      fontSize: "1.1rem",
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "#475569"
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{
                      width: "48px",
                      height: "36px",
                      textAlign: "center",
                      border: "none",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      outline: "none",
                      color: "#1e293b"
                    }}
                  />
                  <button
                    onClick={() => setQty(q => q + 1)}
                    style={{
                      background: "#f8fafc",
                      border: "none",
                      width: "36px",
                      height: "36px",
                      fontSize: "1.1rem",
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "#475569"
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  style={{
                    background: "#1e5da7",
                    color: "#ffffff",
                    border: "none",
                    padding: "0 2rem",
                    height: "38px",
                    borderRadius: "25px",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "background 0.2s ease"
                  }}
                >
                  {added ? "✓ Added!" : "ADD TO CART"}
                </button>
              </div>
            )}

            {/* CTAs & Competitors */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              {/*
              <a
                href={`https://wa.me/254795350292?text=${waMsg}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "#25D366",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  textAlign: "center"
                }}
              >
                📱 Order via WhatsApp
              </a>
              */}


            </div>
          </div>
        </div>

        {/* Tabbed Info View */}
        <div style={{
          display: "flex",
          borderBottom: "4px solid #1053a0",
          marginTop: "4.5rem",
          marginBottom: "2rem",
          gap: "4px"
        }}>
          <button
            onClick={() => setActiveTab("description")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "description" ? "#ffffff" : "#1053a0",
              color: activeTab === "description" ? "#1053a0" : "#ffffff",
              border: "1px solid #1053a0",
              borderBottom: activeTab === "description" ? "4px solid #ffffff" : "none",
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "6px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              position: "relative",
              bottom: "-4px",
              zIndex: activeTab === "description" ? 2 : 1,
              transition: "all 0.15s ease"
            }}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("info")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "info" ? "#ffffff" : "#1053a0",
              color: activeTab === "info" ? "#1053a0" : "#ffffff",
              border: "1px solid #1053a0",
              borderBottom: activeTab === "info" ? "4px solid #ffffff" : "none",
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "6px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              position: "relative",
              bottom: "-4px",
              zIndex: activeTab === "info" ? 2 : 1,
              transition: "all 0.15s ease"
            }}
          >
            Additional information
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "reviews" ? "#ffffff" : "#1053a0",
              color: activeTab === "reviews" ? "#1053a0" : "#ffffff",
              border: "1px solid #1053a0",
              borderBottom: activeTab === "reviews" ? "4px solid #ffffff" : "none",
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "6px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              position: "relative",
              bottom: "-4px",
              zIndex: activeTab === "reviews" ? 2 : 1,
              transition: "all 0.15s ease"
            }}
          >
            Reviews (0)
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: "220px", marginBottom: "3rem" }}>
          {activeTab === "description" && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.95rem", color: "#334155", lineHeight: "1.75" }}>
              {p.description && (
                <div style={{ whiteSpace: "pre-line" }}>
                  {p.description}
                </div>
              )}
            </div>
          )}

          {activeTab === "info" && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "#334155" }}>
              <table style={{ width: "100%", maxWidth: "500px", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: "bold", color: "#475569", width: "180px" }}>Weight</td>
                    <td style={{ padding: "0.75rem 0", color: "#334155" }}>{p.weight_kg ? `${p.weight_kg} kg` : "N/A"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: "bold", color: "#475569" }}>Brand</td>
                    <td style={{ padding: "0.75rem 0", color: "#334155" }}>{p.brand || "Generic"}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: "bold", color: "#475569" }}>Animal Type</td>
                    <td style={{ padding: "0.75rem 0", color: "#334155", textTransform: "capitalize" }}>{p.animal_type}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: "bold", color: "#475569" }}>Food Type</td>
                    <td style={{ padding: "0.75rem 0", color: "#334155", textTransform: "capitalize" }}>{p.food_type}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "reviews" && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "#64748b" }}>
              <p style={{ fontWeight: 600, fontSize: "1rem", color: "#334155", marginBottom: "0.5rem" }}>Reviews</p>
              <p>There are no reviews yet.</p>
              <p style={{ marginTop: "1rem" }}>Only logged in customers who have purchased this product may leave a review.</p>
            </div>
          )}
        </div>

        {/* Vs Foreign Brand Promotion */}
        {p.replaces_brand && (
          <div style={{ border: "2px solid #22c55e", borderRadius: "8px", padding: "1.5rem", background: "#f0fdf4", marginBottom: "3rem" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem", color: "#16a34a" }}>
              🇸🇿 Why Choose This Over {p.replaces_brand}?
            </div>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#1f2937", margin: 0 }}>{p.replaces_reason}</p>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
