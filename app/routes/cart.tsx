import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Shopping Cart — PetStore Kenya" },
    { name: "description", content: "Review your shopping cart, adjust item quantities, and proceed to checkout at PetStore Kenya." },
  ];
}

export async function loader() {
  // Fetch a few items for "YOU MAY BE INTERESTED IN..." section
  const recommendedRes = await query(`
    SELECT
      p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url,
      bbp.price AS our_price,
      MIN(comp.price) AS competitor_min
    FROM products p
    JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    LEFT JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'PetStore Kenya'
    WHERE bbp.price IS NOT NULL
    GROUP BY p.id, p.name, p.brand, p.weight_kg, p.animal_type, p.food_type, p.image_url, bbp.price
    ORDER BY p.id DESC
    LIMIT 4
  `);

  return { recommended: recommendedRes.rows };
}

export default function CartPage() {
  const { recommended } = useLoaderData<typeof loader>();
  const { items, subtotal, removeItem, updateQty, setIsCheckoutOpen, addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const handleAddToCart = (p: any) => {
    addItem({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: Number(p.our_price),
      image_url: p.image_url,
      weight_kg: p.weight_kg,
    });
    setAddedIds(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [p.id]: false }));
    }, 1500);
  };

  return (
    <>
      <Navbar />
      
      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          
          {/* Header Banner */}
          <PageHeader title="Cart" />

          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#3b82f6", cursor: "pointer" }}>Edit This</span>
          </div>

          {items.length === 0 ? (
            /* Empty Cart View */
            <div style={{ marginBottom: "3rem" }}>
              <div style={{
                background: "#f4f8fa",
                borderTop: "3px solid #1053a0",
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
                  border: "2px solid #1053a0",
                  borderRadius: "2px",
                  fontSize: "11px",
                  color: "#1053a0",
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
                      background: "#1a5ca3",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "0.65rem 2.5rem",
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      textDecoration: "none",
                      display: "inline-block"
                    }}
                  >
                    Proceed to checkout
                  </Link>
                </div>
                <div style={{ flex: 1, textAlign: "right", fontSize: "1.05rem", fontWeight: "bold", color: "#1a5ca3" }}>
                  SUBTOTAL: <span style={{ color: "#777777", fontWeight: "normal", marginLeft: "1rem" }}>{subtotal.toLocaleString()}KSh</span>
                </div>
              </div>

              {/* Cart Table Container */}
              <div style={{ border: "1px solid #dcdcdc", borderRadius: "4px", overflow: "hidden", marginBottom: "1.5rem" }}>
                
                {/* Table Header */}
                <div style={{
                  background: "#1a5ca3",
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
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid #eaeaea",
                    background: "#ffffff"
                  }}>
                    {/* Product cell: Delete, Image, Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <button 
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          padding: 0
                        }}
                        title="Remove product"
                      >
                        ✕
                      </button>
                      <div style={{
                        width: "50px",
                        height: "50px",
                        border: "1px solid #eaeaea",
                        borderRadius: "4px",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#ffffff",
                        flexShrink: 0
                      }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "2px" }} />
                        ) : (
                          <span style={{ fontSize: "1.2rem" }}>🐾</span>
                        )}
                      </div>
                      <Link to={`/shop/${item.id}`} style={{
                        textDecoration: "none",
                        color: "#1a5ca3",
                        fontWeight: 500,
                        fontSize: "0.95rem",
                        lineHeight: 1.3
                      }}>
                        {item.name}
                      </Link>
                    </div>

                    {/* Price cell */}
                    <div style={{ textAlign: "right", fontSize: "0.95rem", fontWeight: 500, color: "#515151" }}>
                      {item.price.toLocaleString()}KSh
                    </div>

                    {/* Quantity cell */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ display: "inline-flex", border: "1px solid #777777", borderRadius: "0px", overflow: "hidden" }}>
                        <button 
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          style={{
                            padding: "0.25rem 0.6rem",
                            background: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "bold",
                          }}
                        >
                          -
                        </button>
                        <input 
                          type="text" 
                          readOnly 
                          value={item.quantity} 
                          style={{
                            width: "30px",
                            borderTop: "none",
                            borderBottom: "none",
                            borderLeft: "1px solid #777777",
                            borderRight: "1px solid #777777",
                            textAlign: "center",
                            fontSize: "0.9rem",
                            padding: 0,
                            outline: "none",
                            background: "#ffffff",
                          }}
                        />
                        <button 
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          style={{
                            padding: "0.25rem 0.6rem",
                            background: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "bold",
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
                      background: "#1a5ca3",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "0.65rem 2.5rem",
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      textDecoration: "none",
                      display: "inline-block"
                    }}
                  >
                    Proceed to checkout
                  </Link>
                </div>
                <div style={{ flex: 1, textAlign: "right", fontSize: "1.05rem", fontWeight: "bold", color: "#1a5ca3" }}>
                  SUBTOTAL: <span style={{ color: "#777777", fontWeight: "normal", marginLeft: "1rem" }}>{subtotal.toLocaleString()}KSh</span>
                </div>
              </div>

            </div>
          )}

          {/* Upsells Section */}
          <div style={{ marginTop: "4rem" }}>
            <h2 style={{
              fontFamily: '"Patrick Hand", cursive',
              fontSize: "1.8rem",
              color: "#1a5ca3",
              borderBottom: "1px solid #eaeaea",
              paddingBottom: "0.5rem",
              marginBottom: "2rem",
              fontWeight: "bold",
              letterSpacing: "0.02em"
            }}>
              YOU MAY BE INTERESTED IN...
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "2rem"
            }}>
              {recommended.map(p => {
                const isSale = p.competitor_min && Number(p.competitor_min) > Number(p.our_price);
                const originalPrice = isSale ? Number(p.competitor_min) : null;
                const salePrice = Number(p.our_price);

                return (
                  <div 
                    key={p.id} 
                    style={{
                      background: "#ffffff",
                      border: "1px solid #eaeaea",
                      borderRadius: "8px",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                    }}
                  >
                    {/* Sale Badge */}
                    {isSale && (
                      <span style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "#82a812",
                        color: "#ffffff",
                        borderRadius: "50%",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        width: "38px",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2
                      }}>
                        Sale!
                      </span>
                    )}

                    {/* Image */}
                    <Link to={`/shop/${p.id}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        height: "150px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1rem",
                        background: "#ffffff"
                      }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "2.5rem" }}>🐾</span>
                        )}
                      </div>

                      {/* Name */}
                      <h3 style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#333",
                        height: "40px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: "20px",
                        margin: "0 0 0.5rem 0",
                        textDecoration: "none"
                      }}>
                        {p.name}
                      </h3>
                    </Link>

                    {/* Price display */}
                    <div style={{ marginBottom: "1rem" }}>
                      {originalPrice && (
                        <span style={{ textDecoration: "line-through", color: "#888888", marginRight: "0.5rem", fontSize: "0.9rem" }}>
                          {originalPrice.toLocaleString()}KSh
                        </span>
                      )}
                      <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "0.95rem" }}>
                        {salePrice.toLocaleString()}KSh
                      </span>
                    </div>

                    {/* Add to Cart button */}
                    <button 
                      onClick={() => handleAddToCart(p)}
                      style={{
                        background: "#1a5ca3",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "20px",
                        padding: "0.5rem 1rem",
                        fontWeight: "600",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        transition: "background 0.2s"
                      }}
                    >
                      {addedIds[p.id] ? "✓ Added" : "Add To Cart"}
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
