import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/shop.$id";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import { DogIcon, CatIcon } from "../components/CategoryIcon";
import Footer from "../components/Footer";

export async function loader({ params }: Route.LoaderArgs) {
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
    WHERE p.id = $1
    GROUP BY p.id
  `, [params.id]);

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

  const prices: any[] = p.prices || [];
  const ourPrice    = prices.find((x: any) => x.store === "PetStore Kenya");
  const competitors = prices.filter((x: any) => x.store !== "PetStore Kenya");
  const cheapestComp = competitors.reduce((min: any, c: any) => (!min || c.price < min.price ? c : min), null);
  const saving = cheapestComp ? Math.round(cheapestComp.price - (ourPrice?.price ?? 0)) : 0;
  const waMsg = encodeURIComponent(`Hi PetStore Kenya, I'd like to order: ${p.name} (KES ${ourPrice?.price ?? ""})`);

  function handleAdd() {
    if (!ourPrice) return;
    addItem({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: Number(ourPrice.price),
      image_url: p.image_url,
      weight_kg: p.weight_kg,
    });
    setAdded(true);
    setTimeout(() => { setAdded(false); setIsCartOpen(true); }, 1200);
  }

  const hasNutrition = p.nutrition_protein || p.nutrition_fat || p.nutrition_fibre || p.nutrition_moisture;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">PETSTORE <span>KENYA.</span></Link>
          <ul className="navbar-links">
            <li><Link to="/shop" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-light)", textDecoration: "none", letterSpacing: "0.06em" }}>← Back to Shop</Link></li>
          </ul>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className={`add-to-cart-btn ${added ? "added" : ""}`} style={{ width: "auto", borderTop: "2px solid var(--ink)", padding: "0.5rem 1.1rem" }} onClick={handleAdd}>
              {added ? "✓ Added!" : "🛒 Add to Cart"}
            </button>
            <a href={`https://wa.me/254795350292?text=${waMsg}`} className="btn-primary" target="_blank" rel="noreferrer">
              📱 Order Now
            </a>
          </div>
        </div>
      </nav>

      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-light)", marginBottom: "2rem", letterSpacing: "0.06em" }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>HOME</Link>
          {" / "}
          <Link to="/shop" style={{ color: "inherit", textDecoration: "none" }}>SHOP</Link>
          {" / "}
          <span style={{ color: "var(--ink)" }}>{p.name.toUpperCase()}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>
          {/* Image — white background */}
          <div style={{
            background: "#fff",
            border: "2px solid var(--ink)",
            aspectRatio: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}>
            {p.image_url
              ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "2rem" }} />
              : (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", opacity: 0.15 }}>
                  {p.animal_type === "cat" ? <CatIcon size={128} strokeWidth={1} /> : <DogIcon size={128} strokeWidth={1} />}
                </span>
              )
            }
          </div>

          {/* Info */}
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--ink)", color: "#fff", padding: "0.2rem 0.5rem" }}>
                {p.animal_type}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--tan-light)", color: "var(--ink)", padding: "0.2rem 0.5rem", border: "1.5px solid var(--tan)" }}>
                {p.food_type}
              </span>
            </div>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: "0.4rem" }}>{p.brand}</div>
            <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>{p.name}</h1>
            {p.weight_kg && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--ink-light)", marginBottom: "1rem" }}>Net weight: {p.weight_kg}kg</div>
            )}

            {p.description && (
              <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--ink-light)", marginBottom: "1.25rem", borderLeft: "3px solid var(--ke-red)", paddingLeft: "0.85rem" }}>
                {p.description}
              </p>
            )}

            {/* Price */}
            {ourPrice && (
              <div style={{ borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", padding: "1.25rem 0", marginBottom: "1rem" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: "0.35rem" }}>
                  PetStore Kenya Price
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.75rem", fontWeight: 700, color: "var(--ke-red)", lineHeight: 1 }}>
                  KES {Number(ourPrice.price).toLocaleString()}
                </div>
                {saving > 0 && (
                  <div className="save-badge" style={{ marginTop: "0.75rem" }}>
                    ▼ You save KES {saving.toLocaleString()} vs {cheapestComp?.store}
                  </div>
                )}
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button
                className={`add-to-cart-btn ${added ? "added" : ""}`}
                style={{ flex: 1, borderTop: "2px solid var(--ke-green)", padding: "0.85rem", fontSize: "0.82rem" }}
                onClick={handleAdd}
              >
                {added ? "✓ Added to Cart!" : "🛒 Add to Cart"}
              </button>
            </div>
            <a
              href={`https://wa.me/254795350292?text=${waMsg}`}
              className="checkout-whatsapp-btn"
              target="_blank" rel="noreferrer"
              style={{ display: "flex", textDecoration: "none" }}
            >
              📱 Order via WhatsApp
            </a>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", textAlign: "center", color: "var(--ink-light)", letterSpacing: "0.06em", marginTop: "0.6rem" }}>
              🚚 FAST NAIROBI DELIVERY · COD AVAILABLE
            </p>

            {/* Competitor prices */}
            {competitors.length > 0 && (
              <div style={{ marginTop: "1.5rem", border: "2px solid var(--ink)", padding: "1rem" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: "0.75rem" }}>
                  Supermarket Prices
                </div>
                {competitors.map((c: any) => {
                  const diff = ourPrice ? Math.round(c.price - ourPrice.price) : 0;
                  return (
                    <div key={c.store} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", marginBottom: "0.6rem", borderBottom: "1px dashed #ccc" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 600 }}>{c.store}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 700 }}>KES {Number(c.price).toLocaleString()}</span>
                        {diff > 0 && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, color: "var(--ke-green)" }}>
                            +{diff.toLocaleString()} MORE
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

        {/* Nutrition + Details below */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginTop: "3rem" }}>
          {/* Nutrition */}
          {hasNutrition && (
            <div style={{ border: "2px solid var(--ink)", padding: "1.5rem" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "1.25rem", color: "var(--ink-light)" }}>
                Guaranteed Analysis
              </div>
              {p.nutrition_protein  && <NutritionBar label="Crude Protein"  value={Number(p.nutrition_protein)}  max={50}  color="var(--ke-red)"   />}
              {p.nutrition_fat      && <NutritionBar label="Crude Fat"       value={Number(p.nutrition_fat)}      max={25}  color="var(--ke-green)" />}
              {p.nutrition_fibre    && <NutritionBar label="Crude Fibre"     value={Number(p.nutrition_fibre)}    max={10}  color="#C4935A"         />}
              {p.nutrition_moisture && <NutritionBar label="Moisture Max"    value={Number(p.nutrition_moisture)} max={100} color="#60a5fa"         />}
            </div>
          )}

          {/* Key Ingredients */}
          {p.key_ingredients && (
            <div style={{ border: "2px solid var(--ink)", padding: "1.5rem" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.85rem", color: "var(--ink-light)" }}>
                Key Ingredients
              </div>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--ink)" }}>{p.key_ingredients}</p>
            </div>
          )}

          {/* Feeding Guide */}
          {p.feeding_guide && (
            <div style={{ border: "2px solid var(--ink)", padding: "1.5rem" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.85rem", color: "var(--ink-light)" }}>
                Feeding Guide
              </div>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--ink)" }}>{p.feeding_guide}</p>
            </div>
          )}

          {/* Vs Foreign Brand */}
          {p.replaces_brand && (
            <div style={{ border: "2px solid var(--ke-green)", padding: "1.5rem", background: "#f0fdf4" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.85rem", color: "var(--ke-green)" }}>
                🇰🇪 Why Choose This Over {p.replaces_brand}?
              </div>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--ink)" }}>{p.replaces_reason}</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "2px solid var(--ink)", textAlign: "center" }}>
          <Link to={`/product-category/${p.animal_type}-food/`} className="btn-primary">
            See more {p.animal_type} food →
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
