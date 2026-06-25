import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/product.$slug";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import { DogIcon, CatIcon } from "../components/CategoryIcon";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export async function loader({ params }: Route.LoaderArgs) {
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
    WHERE p.slug = $1
    GROUP BY p.id
  `, [params.slug]);

  if (!rows[0]) throw new Response("Not Found", { status: 404 });
  return { product: rows[0] };
}

export function meta({ data }: Route.MetaArgs) {
  const p = data?.product;
  return [
    { title: `${p?.name ?? "Product"} — PetStore Kenya` },
    { name: "description", content: `Buy ${p?.name} online. Always cheaper than Carrefour & Naivas. Fast Nairobi delivery.` },
  ];
}

// ── Nutrition bar ─────────────────────────────────────────────
function NutritionBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.68rem", fontWeight: 700, marginBottom: "0.3rem" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-light)" }}>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "#eee", borderRadius: 0 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
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

  const hasNutrition = p.nutrition_protein || p.nutrition_fat || p.nutrition_fibre || p.nutrition_moisture;

  let backCategoryLink = "/shop";
  let backCategoryName = "products";
  if (Array.isArray(p.categories) && p.categories.length > 0) {
    backCategoryLink = `/product-category/${p.categories[0].slug}/`;
    backCategoryName = p.categories[0].name;
  } else if (p.animal_type) {
    backCategoryLink = `/product-category/${p.animal_type}-food/`;
    backCategoryName = `${p.animal_type} food`;
  }

  return (
    <>
      <Navbar />

      <div className="product-detail-container">
        {/* Breadcrumb */}
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "#64748b", marginBottom: "2rem" }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>HOME</Link>
          <span style={{ margin: "0 0.5rem", color: "#cbd5e1" }}>/</span>
          <Link to="/shop" style={{ color: "inherit", textDecoration: "none" }}>SHOP</Link>
          {Array.isArray(p.categories) && p.categories.length > 0 && (
            <>
              <span style={{ margin: "0 0.5rem", color: "#cbd5e1" }}>/</span>
              <Link to={`/product-category/${p.categories[0].slug}/`} style={{ color: "inherit", textDecoration: "none", textTransform: "uppercase" }}>
                {p.categories[0].name}
              </Link>
            </>
          )}
          <span style={{ margin: "0 0.5rem", color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: 600 }}>{p.name.toUpperCase()}</span>
        </div>

        {/* Main layout grid */}
        <div className="product-detail-layout">
          {/* Left Column: Image */}
          <div className="product-image-panel" style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}>
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
            {p.brand && (
              <div style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.25rem"
              }}>
                {p.brand}
              </div>
            )}

            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.9rem",
              fontWeight: 700,
              color: "#1e5da7",
              lineHeight: 1.25,
              marginBottom: "0.5rem",
              marginTop: 0
            }}>
              {p.name}
            </h1>

            {ourPrice && (
              <div style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "#e11d48",
                marginBottom: "1.25rem"
              }}>
                {Number(ourPrice.price).toLocaleString()}KSh
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
                    borderRadius: "4px",
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

              {saving > 0 && (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "0.85rem 1rem",
                  borderRadius: "4px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  color: "#16a34a",
                  fontWeight: 600
                }}>
                  ▼ You save KSh {saving.toLocaleString()} compared to {cheapestComp?.store}!
                </div>
              )}

              {competitors.length > 0 && (
                <div style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "1rem",
                  background: "#f8fafc",
                  marginTop: "0.5rem"
                }}>
                  <div style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.75rem"
                  }}>
                    Supermarket Price Comparison
                  </div>
                  {competitors.map((c: any) => {
                    const diff = ourPrice ? Math.round(c.price - ourPrice.price) : 0;
                    return (
                      <div key={c.store} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: "0.5rem",
                        marginBottom: "0.5rem",
                        borderBottom: "1px dashed #cbd5e1"
                      }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>{c.store}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>{Number(c.price).toLocaleString()}KSh</span>
                          {diff > 0 && (
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#16a34a" }}>
                              (+{diff}KSh)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Info View */}
        <div style={{
          display: "flex",
          borderBottom: "2px solid #e2e8f0",
          marginTop: "4.5rem",
          marginBottom: "2rem",
          gap: "1.5rem"
        }}>
          <button
            onClick={() => setActiveTab("description")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "description" ? "3px solid #1e5da7" : "3px solid transparent",
              color: activeTab === "description" ? "#1e5da7" : "#64748b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("info")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "info" ? "3px solid #1e5da7" : "3px solid transparent",
              color: activeTab === "info" ? "#1e5da7" : "#64748b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Additional information
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "reviews" ? "3px solid #1e5da7" : "3px solid transparent",
              color: activeTab === "reviews" ? "#1e5da7" : "#64748b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Reviews (0)
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: "220px", marginBottom: "3rem" }}>
          {activeTab === "description" && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "#334155", lineHeight: "1.7" }}>
              {p.description && (
                <div style={{ marginBottom: "2rem", whiteSpace: "pre-line" }}>
                  {p.description}
                </div>
              )}

              {/* Bulleted Attributes list */}
              <ul style={{ paddingLeft: "1.25rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {p.brand && <li><strong>Brand:</strong> {p.brand}</li>}
                {p.weight_kg && <li><strong>Weight:</strong> {p.weight_kg}kg</li>}
                {p.animal_type && <li><strong>Animal Type:</strong> <span style={{ textTransform: "capitalize" }}>{p.animal_type}</span></li>}
                {p.food_type && <li><strong>Food Type:</strong> <span style={{ textTransform: "capitalize" }}>{p.food_type}</span></li>}
              </ul>

              {/* Guaranteed Analysis */}
              {hasNutrition && (
                <div style={{ marginTop: "2rem", maxWidth: "500px" }}>
                  <p style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", color: "#1e293b", marginBottom: "1rem" }}>
                    Guaranteed Analysis
                  </p>
                  {p.nutrition_protein && <NutritionBar label="Crude Protein" value={Number(p.nutrition_protein)} max={50} color="#1e5da7" />}
                  {p.nutrition_fat && <NutritionBar label="Crude Fat" value={Number(p.nutrition_fat)} max={25} color="#10b981" />}
                  {p.nutrition_fibre && <NutritionBar label="Crude Fibre" value={Number(p.nutrition_fibre)} max={10} color="#f59e0b" />}
                  {p.nutrition_moisture && <NutritionBar label="Moisture Max" value={Number(p.nutrition_moisture)} max={100} color="#3b82f6" />}
                </div>
              )}

              {/* Key Ingredients */}
              {p.key_ingredients && (
                <div style={{ marginTop: "2rem" }}>
                  <p style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", color: "#1e293b", marginBottom: "0.5rem" }}>
                    Ingredients
                  </p>
                  <p style={{ color: "#475569" }}>{p.key_ingredients}</p>
                </div>
              )}

              {/* Feeding Guide */}
              {p.feeding_guide && (
                <div style={{ marginTop: "2rem" }}>
                  <p style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", color: "#1e293b", marginBottom: "0.5rem" }}>
                    Feeding Guide
                  </p>
                  <p style={{ color: "#475569", marginBottom: "1.5rem" }}>{p.feeding_guide}</p>
                </div>
              )}

              {/* Daily Feeding Guide row */}
              {p.animal_type === "cat" && (
                <div style={{
                  marginTop: "2rem",
                  border: "1px solid #fed7aa",
                  borderRadius: "6px",
                  overflow: "hidden",
                  maxWidth: "600px"
                }}>
                  <div style={{ background: "#f97316", color: "#fff", padding: "0.5rem", textAlign: "center", fontWeight: "bold", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Günlük Besleme Rehberi / Daily Feeding Guide
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "#ffedd5", padding: "1rem", gap: "0.5rem", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: "1.5rem" }}>🐱</div>
                      <div style={{ fontSize: "0.75rem", color: "#7c2d12", fontWeight: "bold", marginTop: "0.25rem" }}>1-2 kg</div>
                      <div style={{ fontSize: "0.8rem", color: "#ea580c", fontWeight: "bold" }}>30-45 gr</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.7rem" }}>🐱</div>
                      <div style={{ fontSize: "0.75rem", color: "#7c2d12", fontWeight: "bold", marginTop: "0.25rem" }}>3-4 kg</div>
                      <div style={{ fontSize: "0.8rem", color: "#ea580c", fontWeight: "bold" }}>60-80 gr</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.9rem" }}>🐱</div>
                      <div style={{ fontSize: "0.75rem", color: "#7c2d12", fontWeight: "bold", marginTop: "0.25rem" }}>5-6 kg</div>
                      <div style={{ fontSize: "0.8rem", color: "#ea580c", fontWeight: "bold" }}>100-120 gr</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "2.1rem" }}>🐱</div>
                      <div style={{ fontSize: "0.75rem", color: "#7c2d12", fontWeight: "bold", marginTop: "0.25rem" }}>7-8 kg</div>
                      <div style={{ fontSize: "0.8rem", color: "#ea580c", fontWeight: "bold" }}>140-160 gr</div>
                    </div>
                  </div>
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

        {/* Back Link CTA */}
        <div style={{ marginTop: "3rem", paddingBottom: "2rem", textAlign: "center" }}>
          <Link to={backCategoryLink} className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
            See more {backCategoryName} →
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
