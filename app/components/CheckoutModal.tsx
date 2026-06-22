import { useState, useEffect, useCallback } from "react";
import { useCart, MIN_ORDER } from "../context/cart";

// ── Delivery zones ──────────────────────────────────────────
export const DELIVERY_ZONES: Record<string, { fee: number; label: string }> = {
  "Nairobi CBD / City Centre":     { fee: 200, label: "Inner Nairobi" },
  "Westlands / Parklands":         { fee: 200, label: "Inner Nairobi" },
  "Kilimani / Kileleshwa":         { fee: 200, label: "Inner Nairobi" },
  "Upper Hill / Upperhill":        { fee: 200, label: "Inner Nairobi" },
  "Hurlingham / Ngara":            { fee: 200, label: "Inner Nairobi" },
  "Karen / Langata":               { fee: 300, label: "Mid Nairobi" },
  "Lavington / Loresho":           { fee: 300, label: "Mid Nairobi" },
  "South B / South C":             { fee: 300, label: "Mid Nairobi" },
  "Spring Valley / Runda":         { fee: 300, label: "Mid Nairobi" },
  "Buruburu / Donholm":            { fee: 400, label: "Outer Nairobi" },
  "Umoja / Kayole":                { fee: 400, label: "Outer Nairobi" },
  "Embakasi / Pipeline":           { fee: 400, label: "Outer Nairobi" },
  "Kasarani / Roysambu":           { fee: 400, label: "Outer Nairobi" },
  "Ruaka / Banana / Limuru Rd":    { fee: 400, label: "Outer Nairobi" },
  "Thika Road / Githurai":         { fee: 450, label: "Outer Nairobi" },
  "Rongai / Ngong":                { fee: 450, label: "Outer Nairobi" },
  "Outside Nairobi (Thika, Kiambu, etc.)": { fee: 600, label: "Outside Nairobi" },
};

const FREE_DELIVERY_THRESHOLD = 5000;

type Step = "auth" | "details" | "review" | "payment" | "success";

interface FormState {
  contactType: "phone" | "email";
  contact: string;
  name: string;
  phone: string;
  deliveryArea: string;
  notes: string;
  paymentMethod: "paystack" | "cod" | "whatsapp";
}

const STEPS: Step[] = ["auth", "details", "review", "payment"];
const STEP_LABELS = ["Contact", "Delivery", "Review", "Payment"];

// ── Main CheckoutModal ───────────────────────────────────────
export function CheckoutModal() {
  const { items, subtotal, clearCart, isCheckoutOpen, setIsCheckoutOpen } = useCart();
  const [step, setStep] = useState<Step>("auth");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    contactType: "phone",
    contact: "",
    name: "",
    phone: "",
    deliveryArea: "",
    notes: "",
    paymentMethod: "paystack",
  });

  const deliveryFee = form.deliveryArea
    ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : (DELIVERY_ZONES[form.deliveryArea]?.fee ?? 300))
    : 0;
  const total = subtotal + deliveryFee;

  // Reset when opened
  useEffect(() => {
    if (isCheckoutOpen) {
      setStep("auth");
      setError("");
      setForm(f => ({ ...f, contact: "", name: "", phone: "", deliveryArea: "", notes: "" }));
    }
  }, [isCheckoutOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsCheckoutOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setIsCheckoutOpen]);

  const setField = useCallback((k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setError("");
  }, []);

  function goNext() {
    setError("");
    if (step === "auth") {
      if (!form.contact.trim()) { setError("Please enter your phone or email."); return; }
      if (form.contactType === "phone" && !/^(\+?254|0)\d{9}$/.test(form.contact.replace(/\s/g, ""))) {
        setError("Please enter a valid Kenyan phone number."); return;
      }
      if (form.contactType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact)) {
        setError("Please enter a valid email address."); return;
      }
      if (form.contactType === "phone") setForm(f => ({ ...f, phone: f.contact }));
      setStep("details");
    } else if (step === "details") {
      if (!form.name.trim()) { setError("Please enter your name."); return; }
      if (!form.deliveryArea) { setError("Please select your delivery area."); return; }
      if (form.contactType === "email" && !form.phone.trim()) { setError("We need your phone number for delivery."); return; }
      setStep("review");
    } else if (step === "review") {
      setStep("payment");
    }
  }

  function goBack() {
    if (step === "details") setStep("auth");
    else if (step === "review") setStep("details");
    else if (step === "payment") setStep("review");
  }

  async function placeOrder(method: "paystack" | "cod" | "whatsapp") {
    setLoading(true);
    setError("");
    const phone = form.contactType === "phone" ? form.contact : form.phone;
    const email = form.contactType === "email" ? form.contact : "";

    if (method === "whatsapp") {
      const lines = items.map(i => `• ${i.name} x${i.quantity} — KES ${(i.price * i.quantity).toLocaleString()}`).join("\n");
      const msg = encodeURIComponent(
        `Hi PetStore Kenya! I'd like to place an order:\n\n${lines}\n\nSubtotal: KES ${subtotal.toLocaleString()}\nDelivery (${form.deliveryArea}): KES ${deliveryFee.toLocaleString()}\nTOTAL: KES ${total.toLocaleString()}\n\nName: ${form.name}\nPhone: ${phone}\nArea: ${form.deliveryArea}\n${form.notes ? "Notes: " + form.notes : ""}`
      );
      window.open(`https://wa.me/254795350292?text=${msg}`, "_blank");
      setLoading(false);
      setStep("success");
      clearCart();
      return;
    }

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: phone,
          customer_email: email,
          delivery_area: form.deliveryArea,
          subtotal_kes: subtotal,
          delivery_fee_kes: deliveryFee,
          total_kes: total,
          payment_method: method,
          notes: form.notes,
          items: items.map(i => ({
            product_id: i.id,
            product_name: i.name,
            qty: i.quantity,
            unit_price: i.price,
            total_price: i.price * i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      if (method === "paystack") {
        // Paystack popup
        const handler = (window as any).PaystackPop?.setup({
          key: "pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY",
          email: email || `${phone.replace(/\D/g, "")}@petstore.co.ke`,
          amount: Math.round(total * 100), // kobo
          currency: "KES",
          ref: `BBP-${data.orderId}-${Date.now()}`,
          metadata: { order_id: data.orderId, custom_fields: [{ display_name: "Order ID", variable_name: "order_id", value: data.orderId }] },
          callback: () => { setOrderId(data.orderId); clearCart(); setStep("success"); },
          onClose: () => { setError("Payment cancelled. Your order is saved — complete payment later."); setLoading(false); },
        });
        handler?.openIframe();
      } else {
        // Cash on delivery
        setOrderId(data.orderId);
        clearCart();
        setStep("success");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isCheckoutOpen) return null;

  const stepIndex = STEPS.indexOf(step as any);
  const progress = step === "success" ? 100 : ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="checkout-overlay" onClick={e => e.target === e.currentTarget && setIsCheckoutOpen(false)}>
      {/* Load Paystack script */}
      <script src="https://js.paystack.co/v1/inline.js" async />

      <div className="checkout-modal">
        {/* Left panel — cart summary */}
        <div className="checkout-left">
          <div className="checkout-brand">
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.35rem" }}>
              Your Order
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em", color: "#fff" }}>
              PETSTORE <span style={{ color: "var(--ke-red)" }}>KENYA.</span>
            </div>
          </div>

          <div className="checkout-items">
            {items.map(item => (
              <div key={item.id} className="checkout-item-row">
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, background: "#f7f0e8", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                      : <span style={{ fontSize: "1.4rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>🐾</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>×{item.quantity}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  KES {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Subtotal</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="checkout-total-row">
              <span>Delivery</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {form.deliveryArea
                  ? (subtotal >= FREE_DELIVERY_THRESHOLD ? "FREE 🎉" : `KES ${deliveryFee.toLocaleString()}`)
                  : "Select area"
                }
              </span>
            </div>
            {subtotal >= FREE_DELIVERY_THRESHOLD && (
              <div style={{ fontSize: "0.65rem", color: "var(--ke-green)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
                ✓ Free delivery on orders KES 5,000+
              </div>
            )}
            <div className="checkout-total-row checkout-grand-total">
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ke-red)" }}>KES {total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {["#000","#C8102E","#006600"].map(c => <div key={c} style={{ flex: 1, height: 3, background: c }} />)}
            </div>
          </div>
        </div>

        {/* Right panel — steps */}
        <div className="checkout-right">
          {/* Progress bar */}
          {step !== "success" && (
            <div className="checkout-progress">
              <div className="checkout-progress-bar" style={{ width: `${progress}%` }} />
              <div className="checkout-steps-label">
                {STEPS.map((s, i) => (
                  <span key={s} className={`checkout-step-dot ${i <= stepIndex ? "active" : ""}`}>
                    <span>{i < stepIndex ? "✓" : i + 1}</span>
                    <span className="dot-label">{STEP_LABELS[i]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close */}
          <button className="checkout-close" onClick={() => setIsCheckoutOpen(false)} aria-label="Close checkout">✕</button>

          {/* ── STEP: AUTH ── */}
          {step === "auth" && (
            <div className="checkout-step-content">
              <h2 className="checkout-step-title">Let's get started</h2>
              <p className="checkout-step-sub">Sign in or create an account to continue.</p>

              <div className="checkout-tabs">
                <button className={`checkout-tab ${form.contactType === "phone" ? "active" : ""}`} onClick={() => setField("contactType", "phone")}>
                  📱 Phone
                </button>
                <button className={`checkout-tab ${form.contactType === "email" ? "active" : ""}`} onClick={() => setField("contactType", "email")}>
                  ✉️ Email
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {form.contactType === "phone" ? "Kenyan phone number" : "Email address"}
                </label>
                <input
                  className="form-input"
                  type={form.contactType === "phone" ? "tel" : "email"}
                  placeholder={form.contactType === "phone" ? "0712 345 678" : "you@example.com"}
                  value={form.contact}
                  onChange={e => setField("contact", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && goNext()}
                  autoFocus
                />
              </div>

              {error && <div className="checkout-error">{error}</div>}

              <button className="checkout-cta" onClick={goNext}>
                Continue →
              </button>

              <div className="checkout-also">
                <div className="checkout-divider">or</div>
                <button className="checkout-whatsapp-btn" onClick={() => placeOrder("whatsapp")}>
                  <span>📱</span> Order via WhatsApp instead
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: DETAILS ── */}
          {step === "details" && (
            <div className="checkout-step-content">
              <h2 className="checkout-step-title">Delivery details</h2>
              <p className="checkout-step-sub">Where should we bring your pet food?</p>

              <div className="form-group">
                <label className="form-label">Full name</label>
                <input className="form-input" type="text" placeholder="e.g. Amina Wanjiru" value={form.name} onChange={e => setField("name", e.target.value)} autoFocus />
              </div>

              {form.contactType === "email" && (
                <div className="form-group">
                  <label className="form-label">Phone number (for delivery)</label>
                  <input className="form-input" type="tel" placeholder="0712 345 678" value={form.phone} onChange={e => setField("phone", e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Delivery area</label>
                <select className="form-input form-select" value={form.deliveryArea} onChange={e => setField("deliveryArea", e.target.value)}>
                  <option value="">Select your area…</option>
                  <optgroup label="Inner Nairobi — KES 200">
                    {Object.entries(DELIVERY_ZONES).filter(([,v]) => v.fee === 200).map(([k]) => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                  <optgroup label="Mid Nairobi — KES 300">
                    {Object.entries(DELIVERY_ZONES).filter(([,v]) => v.fee === 300).map(([k]) => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                  <optgroup label="Outer Nairobi — KES 400–450">
                    {Object.entries(DELIVERY_ZONES).filter(([,v]) => v.fee >= 400 && v.fee <= 450).map(([k]) => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                  <optgroup label="Outside Nairobi — KES 600">
                    {Object.entries(DELIVERY_ZONES).filter(([,v]) => v.fee >= 600).map(([k]) => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                </select>
                {form.deliveryArea && (
                  <div className="form-hint">
                    Delivery fee: {subtotal >= FREE_DELIVERY_THRESHOLD
                      ? "🎉 FREE (order over KES 5,000)"
                      : `KES ${DELIVERY_ZONES[form.deliveryArea]?.fee.toLocaleString()}`}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Delivery instructions <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                <textarea className="form-input form-textarea" placeholder="Estate name, nearest landmark, gate code…" value={form.notes} onChange={e => setField("notes", e.target.value)} rows={2} />
              </div>

              {error && <div className="checkout-error">{error}</div>}

              <div className="checkout-nav">
                <button className="checkout-back" onClick={goBack}>← Back</button>
                <button className="checkout-cta" onClick={goNext}>Review Order →</button>
              </div>
            </div>
          )}

          {/* ── STEP: REVIEW ── */}
          {step === "review" && (
            <div className="checkout-step-content">
              <h2 className="checkout-step-title">Review your order</h2>
              <p className="checkout-step-sub">Everything look right?</p>

              <div className="review-block">
                <div className="review-label">Delivering to</div>
                <div className="review-value">{form.name}</div>
                <div className="review-value" style={{ opacity: 0.7 }}>{form.contactType === "phone" ? form.contact : form.phone}</div>
                <div className="review-value" style={{ opacity: 0.7 }}>{form.deliveryArea}</div>
                {form.notes && <div className="review-value" style={{ opacity: 0.5, fontSize: "0.8rem" }}>"{form.notes}"</div>}
              </div>

              <div className="review-block">
                <div className="review-label">Items</div>
                {items.map(item => (
                  <div key={item.id} className="review-item">
                    <span>{item.name} <span style={{ opacity: 0.5 }}>×{item.quantity}</span></span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>KES {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="review-block">
                <div className="review-item"><span>Subtotal</span><span style={{ fontFamily: "var(--font-mono)" }}>KES {subtotal.toLocaleString()}</span></div>
                <div className="review-item">
                  <span>Delivery — {form.deliveryArea}</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{subtotal >= FREE_DELIVERY_THRESHOLD ? "FREE 🎉" : `KES ${deliveryFee.toLocaleString()}`}</span>
                </div>
                <div className="review-item review-total">
                  <span>Total</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--ke-red)", fontSize: "1.25rem" }}>KES {total.toLocaleString()}</span>
                </div>
              </div>

              {error && <div className="checkout-error">{error}</div>}

              <div className="checkout-nav">
                <button className="checkout-back" onClick={goBack}>← Back</button>
                <button className="checkout-cta" onClick={goNext}>Choose Payment →</button>
              </div>
            </div>
          )}

          {/* ── STEP: PAYMENT ── */}
          {step === "payment" && (
            <div className="checkout-step-content">
              <h2 className="checkout-step-title">How would you like to pay?</h2>
              <p className="checkout-step-sub">Total: <strong style={{ fontFamily: "var(--font-mono)", color: "var(--ke-red)" }}>KES {total.toLocaleString()}</strong></p>

              <div className="payment-options">
                <button
                  className={`payment-option ${form.paymentMethod === "paystack" ? "active" : ""}`}
                  onClick={() => setField("paymentMethod", "paystack")}
                >
                  <div className="payment-option-icon">💳</div>
                  <div>
                    <div className="payment-option-title">Pay Online</div>
                    <div className="payment-option-sub">Card, M-PESA, USSD via Paystack</div>
                  </div>
                  <div className="payment-option-check">{form.paymentMethod === "paystack" ? "✓" : ""}</div>
                </button>

                <button
                  className={`payment-option ${form.paymentMethod === "cod" ? "active" : ""}`}
                  onClick={() => setField("paymentMethod", "cod")}
                >
                  <div className="payment-option-icon">💵</div>
                  <div>
                    <div className="payment-option-title">Cash on Delivery</div>
                    <div className="payment-option-sub">Pay when your order arrives</div>
                  </div>
                  <div className="payment-option-check">{form.paymentMethod === "cod" ? "✓" : ""}</div>
                </button>
              </div>

              {error && <div className="checkout-error">{error}</div>}

              <button
                className="checkout-cta"
                onClick={() => placeOrder(form.paymentMethod)}
                disabled={loading}
                style={{ marginTop: "1.5rem" }}
              >
                {loading ? "Processing…" : form.paymentMethod === "paystack" ? "Pay KES " + total.toLocaleString() + " →" : "Place Order →"}
              </button>

              <div className="checkout-divider" style={{ marginTop: "1.25rem" }}>or</div>
              <button className="checkout-whatsapp-btn" onClick={() => placeOrder("whatsapp")} disabled={loading}>
                <span>📱</span> Complete order via WhatsApp
              </button>

              <div className="checkout-nav" style={{ marginTop: "1rem" }}>
                <button className="checkout-back" onClick={goBack}>← Back</button>
              </div>
            </div>
          )}

          {/* ── STEP: SUCCESS ── */}
          {step === "success" && (
            <div className="checkout-step-content checkout-success">
              <div className="success-icon">🐾</div>
              <h2 className="checkout-step-title">Order placed!</h2>
              <p className="checkout-step-sub">
                Thank you {form.name.split(" ")[0]}! Your pet food is on its way to <strong>{form.deliveryArea}</strong>.
              </p>
              {orderId && (
                <div className="success-order-id">
                  Order #{orderId}
                </div>
              )}
              <p style={{ fontSize: "0.85rem", color: "var(--ink-light)", marginTop: "1rem", lineHeight: 1.6 }}>
                We'll call or WhatsApp you on <strong>{form.contactType === "phone" ? form.contact : form.phone}</strong> to confirm delivery time.
              </p>
              <button className="checkout-cta" style={{ marginTop: "2rem" }} onClick={() => { setIsCheckoutOpen(false); }}>
                Continue Shopping →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────
export function CartDrawer() {
  const { items, removeItem, updateQty, isCartOpen, setIsCartOpen, setIsCheckoutOpen, lastAddedItem } = useCart();

  if (!isCartOpen) return null;

  const activeItem = items.find(i => i.id === lastAddedItem?.id) || lastAddedItem;

  if (!activeItem) return null;

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCartOpen(false);
      }}
    >
      <div 
        style={{
          background: "#ffffff",
          borderRadius: "15px",
          padding: "2rem",
          width: "90%",
          maxWidth: "600px",
          position: "relative",
          boxShadow: "0px 10px 40px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Close Button on Top Right */}
        <button 
          onClick={() => setIsCartOpen(false)}
          style={{
            position: "absolute",
            top: "-15px",
            right: "-15px",
            background: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.3)",
            outline: "none",
          }}
        >
          ✕
        </button>

        {/* Green Notification Banner */}
        <div 
          style={{
            background: "#e6f4ea",
            color: "#137333",
            padding: "0.85rem 1rem",
            borderRadius: "6px",
            textAlign: "center",
            fontSize: "0.95rem",
            fontWeight: 500,
            marginBottom: "2rem",
          }}
        >
          Product successfully added to your cart
        </div>

        {/* Product Details Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          
          {/* Delete Icon */}
          <button 
            onClick={() => {
              removeItem(activeItem.id);
              setIsCartOpen(false);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <i className="fa fa-times-circle" style={{ color: "#ef4444", fontSize: "24px" }} />
          </button>

          {/* Product Image */}
          <div 
            style={{
              width: "70px",
              height: "70px",
              border: "1px solid #eaeaea",
              borderRadius: "4px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "#ffffff",
            }}
          >
            {activeItem.image_url ? (
              <img 
                src={activeItem.image_url} 
                alt={activeItem.name} 
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} 
              />
            ) : (
              <span style={{ fontSize: "1.5rem" }}>🐾</span>
            )}
          </div>

          {/* Product Name */}
          <div style={{ flex: 1, fontSize: "0.95rem", fontWeight: 500, color: "#1a1a1a", lineHeight: 1.3 }}>
            {activeItem.name}
          </div>

          {/* Price */}
          <div style={{ fontSize: "1rem", fontWeight: 500, color: "#1a1a1a", minWidth: "70px", textAlign: "right" }}>
            {activeItem.price}KSh
          </div>

          {/* Quantity Selector */}
          <div style={{ display: "inline-flex", border: "1px solid #777777", borderRadius: "0px", overflow: "hidden" }}>
            <button 
              onClick={() => updateQty(activeItem.id, activeItem.quantity - 1)}
              style={{
                padding: "0.2rem 0.55rem",
                background: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              -
            </button>
            <input 
              type="text" 
              readOnly 
              value={activeItem.quantity} 
              style={{
                width: "28px",
                borderTop: "none",
                borderBottom: "none",
                borderLeft: "1px solid #777777",
                borderRight: "1px solid #777777",
                textAlign: "center",
                fontSize: "0.85rem",
                padding: 0,
                outline: "none",
                background: "#ffffff",
              }}
            />
            <button 
              onClick={() => updateQty(activeItem.id, activeItem.quantity + 1)}
              style={{
                padding: "0.2rem 0.55rem",
                background: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              +
            </button>
          </div>

        </div>

        {/* Divider */}
        <hr style={{ border: "none", borderTop: "1px solid #eaeaea", margin: "1.5rem 0 1rem 0" }} />

        {/* Total */}
        <div style={{ textAlign: "right", fontSize: "1.15rem", fontWeight: "bold", color: "#1a1a1a", marginBottom: "2rem" }}>
          Total : {(activeItem.price * activeItem.quantity)}KSh
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
          <a 
            href="/cart"
            style={{
              flex: 1,
              background: "#1a5ca3",
              color: "#ffffff",
              border: "none",
              borderRadius: "25px",
              padding: "0.7rem 0",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
              display: "block",
            }}
          >
            VIEW CART
          </a>
          <button 
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
            style={{
              flex: 1,
              background: "#1a5ca3",
              color: "#ffffff",
              border: "none",
              borderRadius: "25px",
              padding: "0.7rem 0",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            CHECKOUT
          </button>
          <button 
            onClick={() => setIsCartOpen(false)}
            style={{
              flex: 1,
              background: "#1a5ca3",
              color: "#ffffff",
              border: "none",
              borderRadius: "25px",
              padding: "0.7rem 0",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            CONTINUE SHOPPING
          </button>
        </div>

      </div>
    </div>
  );
}
