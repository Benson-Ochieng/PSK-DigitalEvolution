import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Cart - PetStore Kenya" },
    { name: "description", content: "Review your shopping cart, adjust item quantities, and proceed to checkout at PetStore Kenya." },
  ];
}

export async function loader() {
  // Fetch a few items for "YOU MAY BE INTERESTED IN..." section
  const recommendedRes = await query(`
    SELECT
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug,
      bbp.price AS our_price,
      MIN(comp.price) AS competitor_min
    FROM products p
    JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    LEFT JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'PetStore Kenya'
    WHERE bbp.price IS NOT NULL
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, p.slug, bbp.price
    ORDER BY p.id DESC
    LIMIT 4
  `);

  return { recommended: recommendedRes.rows };
}

export default function CartPage() {
  const { recommended } = useLoaderData<typeof loader>();
  const { items, subtotal, removeItem, updateQty, setIsCheckoutOpen, addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});
  const [loadingRemoveId, setLoadingRemoveId] = useState<number | null>(null);

  const handleAddToCart = (p: any) => {
    addItem({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: Number(p.our_price),
      image_url: p.image_url,
      weight_kg: p.weight_kg,
      slug: p.slug,
    });
    setAddedIds(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [p.id]: false }));
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>

          {/* Header Banner */}
          <PageHeader title="Cart" />

          {items.length === 0 ? (
            /* Empty Cart View */
            <div style={{ marginBottom: "3rem" }}>
              <div style={{
                background: "#f4f8fa",
                borderTop: "3px solid #1E5DA7",
                padding: "1.2rem",
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
                color: "#515151",
                fontSize: "0.95rem",
                marginBottom: "2rem"
              }}>
                {/* Custom Checkbox/Info icon matching WooCommerce alert */}
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  border: "2px solid #1E5DA7",
                  borderRadius: "2px",
                  fontSize: "11px",
                  color: "#1E5DA7",
                  fontWeight: "bold"
                }}>
                  i
                </span>
                Your basket is currently empty.
              </div>

              <Link
                to="/shop"
                style={{
                  background: "#ece9e2",
                  color: "#1a1a1a",
                  border: "1px solid #dcdcdc",
                  borderRadius: "4px",
                  padding: "0.6rem 1.25rem",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block"
                }}
              >
                Return to shop
              </Link>
            </div>
          ) : (
            /* Populated Cart View */
            <div style={{ marginBottom: "3rem" }}>

              {/* Top Checkout Header Row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ flex: 1 }} />
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <Link
                    to="/checkout"
                    style={{
                      background: "#1E5DA7",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "30px",
                      padding: "0.9rem 4.5rem",
                      fontWeight: "700",
                      fontSize: "1.05rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      boxShadow: "0 3px 8px rgba(30, 93, 167, 0.2)",
                      textDecoration: "none",
                      display: "inline-block",
                      textAlign: "center"
                    }}
                  >
                    Proceed to checkout
                  </Link>
                </div>
                <div style={{ flex: 1, textAlign: "right", fontSize: "1.2rem", fontWeight: "bold", color: "#1E5DA7" }}>
                  SUBTOTAL: <span style={{ marginLeft: "0.75rem" }}>{subtotal.toLocaleString()}KSh</span>
                </div>
              </div>

              {/* Cart Table Container */}
              <div style={{ border: "1px solid #1E5DA7", borderRadius: "4px", overflow: "hidden", marginBottom: "1.5rem" }}>

                {/* Table Header */}
                <div style={{
                  background: "#1E5DA7",
                  color: "#ffffff",
                  padding: "0.75rem 1.5rem",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  display: "grid",
                  gridTemplateColumns: "1fr 150px 150px",
                  alignItems: "center"
                }}>
                  <div>Product</div>
                  <div style={{ textAlign: "right" }}>Price</div>
                  <div style={{ textAlign: "right" }}>Quantity</div>
                </div>

                {/* Table Body Rows */}
                {items.map(item => (
                  <div key={item.id} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 150px 150px",
                    alignItems: "center",
                    padding: "0.35rem 1.5rem",
                    borderBottom: "1px solid #1E5DA7",
                    background: "#ffffff"
                  }}>
                    {/* Product cell: Delete, Image, Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {loadingRemoveId === item.id ? (
                          <div className="cart-item-loader" style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid #ef4444",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.6s linear infinite"
                          }} />
                        ) : (
                          <button
                            onClick={() => {
                              setLoadingRemoveId(item.id);
                              setTimeout(() => {
                                removeItem(item.id);
                                setLoadingRemoveId(null);
                              }, 600);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#c02424",
                              fontSize: "0.8rem",
                              fontWeight: "900",
                              cursor: "pointer",
                              padding: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1
                            }}
                            title="Remove product"
                          >
                            ✖
                          </button>
                        )}
                      </div>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "1.2rem" }}>🐾</span>
                        )}
                      </div>
                      <Link to={item.slug ? `/product/${item.slug}/` : `/shop/${item.id}`} style={{
                        textDecoration: "none",
                        color: "#1E5DA7",
                        fontWeight: 400,
                        fontSize: "1.05rem",
                        lineHeight: 1.3
                      }}>
                        {item.name}
                      </Link>
                    </div>

                    {/* Price cell */}
                    <div style={{ textAlign: "right", fontSize: "0.95rem", fontWeight: 400, color: "#1E5DA7" }}>
                      {item.price.toLocaleString()}KSh
                    </div>

                    {/* Quantity cell */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ display: "inline-flex", border: "1px solid #cbd5e1", borderRadius: "4px", overflow: "hidden", height: "32px" }}>
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          style={{
                            width: "32px",
                            height: "100%",
                            background: "#1E5DA7",
                            color: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0
                          }}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={e => {
                            const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                            const val = cleanVal === "" ? 0 : parseInt(cleanVal, 10);
                            updateQty(item.id, val);
                          }}
                          onBlur={() => {
                            if (item.quantity <= 0) {
                              updateQty(item.id, 1);
                            }
                          }}
                          style={{
                            width: "40px",
                            height: "100%",
                            border: "none",
                            textAlign: "center",
                            fontSize: "0.9rem",
                            padding: 0,
                            outline: "none",
                            background: "#ffffff",
                            color: "#000000"
                          }}
                        />
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          style={{
                            width: "32px",
                            height: "100%",
                            background: "#1E5DA7",
                            color: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Checkout Footer Row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
                <div style={{ flex: 1 }} />
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <Link
                    to="/checkout"
                    style={{
                      background: "#1E5DA7",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "30px",
                      padding: "0.9rem 4.5rem",
                      fontWeight: "700",
                      fontSize: "1.05rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      boxShadow: "0 3px 8px rgba(30, 93, 167, 0.2)",
                      textDecoration: "none",
                      display: "inline-block",
                      textAlign: "center"
                    }}
                  >
                    Proceed to checkout
                  </Link>
                </div>
                <div style={{ flex: 1, textAlign: "right", fontSize: "1.2rem", fontWeight: "bold", color: "#1E5DA7" }}>
                  SUBTOTAL: <span style={{ marginLeft: "0.75rem" }}>{subtotal.toLocaleString()}KSh</span>
                </div>
              </div>

            </div>
          )}

          {/* Upsells Section */}
          <div style={{ marginTop: "4rem" }}>
            <div style={{ borderBottom: "2px solid #eaeaea", marginBottom: "2rem" }}>
              <h2 style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.45rem",
                fontWeight: 700,
                color: "#1E5DA7",
                paddingBottom: "0.5rem",
                margin: 0,
                marginBottom: "-2px",
                display: "inline-block",
                borderBottom: "2px solid #1E5DA7",
                letterSpacing: "0.05em"
              }}>
                YOU MAY BE INTERESTED IN...
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
              maxWidth: "560px",
              marginTop: "1.5rem"
            }}>
              {recommended.map(p => {
                const isSale = p.competitor_min && Number(p.competitor_min) > Number(p.our_price);
                const added = addedIds[p.id];

                return (
                  <div key={p.id} className="product-card">
                    {isSale && (
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

                    <Link to={p.slug ? `/product/${p.slug}/` : `/shop/${p.id}`} className="product-card-link">
                      <div className="product-card-img">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} loading="lazy" />
                        ) : (
                          <span className="placeholder-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "120px" }}>
                            🐾
                          </span>
                        )}
                      </div>
                      <div className="product-card-body">
                        <div className="product-name" title={p.name}>{p.name}</div>
                        <div className="product-price">
                          {isSale ? (
                            <>
                              <span style={{ textDecoration: "line-through", textDecorationColor: "#ef4444", color: "#a6a6a6", fontSize: "0.85rem", marginRight: "0.5rem", fontWeight: "bold" }}>
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
                    <button
                      className={`add-to-cart-btn ${added ? "added" : ""}`}
                      onClick={() => handleAddToCart(p)}
                    >
                      {added ? "✓ Added" : "Add To Cart"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
