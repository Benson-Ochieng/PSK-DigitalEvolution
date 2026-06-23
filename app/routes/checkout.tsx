import { Link, useLoaderData, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import { DELIVERY_ZONES } from "../components/CheckoutModal";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Checkout — PetStore Kenya" },
    { name: "description", content: "Complete your order with secure payment options or via WhatsApp." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const nameCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_name="));
  const emailCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_email="));

  const customerName = nameCookie ? decodeURIComponent(nameCookie.split("=")[1]) : "";
  const customerEmail = emailCookie ? decodeURIComponent(emailCookie.split("=")[1]) : "";

  let customerPhone = "";
  if (customerEmail) {
    try {
      const res = await query(
        `SELECT phone FROM customers WHERE email = $1 LIMIT 1`,
        [customerEmail]
      );
      if (res.rows.length > 0) {
        customerPhone = res.rows[0].phone || "";
      }
    } catch (err) {
      console.error("Error prefetching customer phone:", err);
    }
  }

  return { customerName, customerEmail, customerPhone };
}

export default function CheckoutPage() {
  const { customerName, customerEmail, customerPhone } = useLoaderData<typeof loader>();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Split name for prefilling First/Last Name
  const nameParts = customerName ? customerName.split(" ") : ["", ""];
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  // Form states
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [selectedCity, setSelectedCity] = useState("Nairobi");
  const [selectedZone, setSelectedZone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [apartmentInfo, setApartmentInfo] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(customerEmail || "");
  const [recipientPhone, setRecipientPhone] = useState(customerPhone || "");

  // Optional Accordion states
  const [additionalAddress, setAdditionalAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  
  // UI toggles and selections
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ipay" | "peach" | "lipampesa">("ipay");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Order submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successOrderNumber, setSuccessOrderNumber] = useState<number | null>(null);

  // Delivery calculations
  const FREE_DELIVERY_THRESHOLD = 5000;
  const zoneFee = selectedZone && DELIVERY_ZONES[selectedZone] 
    ? DELIVERY_ZONES[selectedZone].fee 
    : 0;
  
  const deliveryFee = selectedZone 
    ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : zoneFee) 
    : 0;

  const discountAmount = Math.round(subtotal * appliedDiscount);
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Apply a sample coupon code
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "PETSTORE10") {
      setAppliedDiscount(0.1);
      setCouponMessage("10% discount applied successfully!");
    } else if (couponCode.trim()) {
      setCouponMessage("Invalid coupon code.");
      setAppliedDiscount(0);
    }
  };

  // Submit Order via API
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!firstName.trim()) {
      setErrorMessage("Please enter a first name.");
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage("Please enter a last name.");
      return;
    }
    if (!selectedZone) {
      setErrorMessage("Please select a delivery zone/neighbourhood.");
      return;
    }
    if (!streetAddress.trim()) {
      setErrorMessage("Please enter your street address.");
      return;
    }
    if (!recipientEmail.trim()) {
      setErrorMessage("Please enter an email address.");
      return;
    }
    if (!recipientPhone.trim()) {
      setErrorMessage("Please enter a phone number.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage("You must agree to the terms and conditions to proceed.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const orderItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        qty: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const fullCustomerName = `${firstName.trim()} ${lastName.trim()}`;
      const addressNotes = `Street: ${streetAddress}, Apt/Suite: ${apartmentInfo || "N/A"}. Additional: ${additionalAddress || "N/A"}. Contact: ${contactPerson || "N/A"} (${contactPersonPhone || "N/A"}). Instructions: ${deliveryInstructions || "N/A"}. General: ${orderNotes || "N/A"}`;

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: fullCustomerName,
          customer_phone: recipientPhone,
          customer_email: recipientEmail,
          delivery_area: selectedZone,
          subtotal_kes: subtotal,
          delivery_fee_kes: deliveryFee,
          total_kes: totalAmount,
          payment_method: paymentMethod,
          notes: addressNotes,
          items: orderItems
        })
      });

      const data = await res.json();
      if (data.success && data.orderId) {
        setSuccessOrderNumber(data.orderId);
        clearCart();
      } else {
        setErrorMessage(data.error || "Failed to place order.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit/Complete via WhatsApp
  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;
    
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter first and last name.");
      return;
    }
    if (!selectedZone) {
      setErrorMessage("Please select a delivery zone/neighbourhood.");
      return;
    }
    if (!streetAddress.trim()) {
      setErrorMessage("Please enter street address.");
      return;
    }
    if (!recipientPhone.trim()) {
      setErrorMessage("Please enter a phone number.");
      return;
    }

    const lines = items.map(i => `• ${i.name} x${i.quantity} — KES ${(i.price * i.quantity).toLocaleString()}`).join("\n");
    const msg = encodeURIComponent(
      `Hi PetStore Kenya! I'd like to place an order via WhatsApp:\n\n${lines}\n\nSubtotal: KES ${subtotal.toLocaleString()}\nDelivery Fee: KES ${deliveryFee.toLocaleString()}\nDiscount: KES ${discountAmount.toLocaleString()}\nTOTAL: KES ${totalAmount.toLocaleString()}\n\nName: ${firstName} ${lastName}\nPhone: ${recipientPhone}\nNeighbourhood: ${selectedZone}\nAddress: ${streetAddress}, ${apartmentInfo || ""}\nNotes: ${orderNotes || "None"}`
    );
    window.open(`https://wa.me/254795350292?text=${msg}`, "_blank");
    clearCart();
    navigate("/");
  };

  // Input styling
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.85rem",
    border: "1px solid #bbd2e8",
    borderRadius: "4px",
    outline: "none",
    boxSizing: "border-box",
    fontSize: "0.95rem",
    color: "#444"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#333",
    marginBottom: "0.4rem"
  };

  return (
    <>
      <Navbar />
      
      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          
          {/* Header Banner */}
          <PageHeader title="Checkout" />

          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#3b82f6", cursor: "pointer" }}>Edit This</span>
          </div>

          {/* Returning Customer Alert Banner */}
          {!customerEmail && (
            <div style={{
              border: "1px solid #dcdcdc",
              padding: "0.85rem 1rem",
              background: "#fdfdfd",
              fontSize: "0.9rem",
              color: "#515151",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "2rem"
            }}>
              <i className="fa fa-info-circle" style={{ color: "#1053a0" }} />
              <span>
                Returning customer? <Link to="/my-account" style={{ color: "#1053a0", textDecoration: "none", fontWeight: 500 }}>Click here to login</Link>
              </span>
            </div>
          )}

          {successOrderNumber ? (
            /* Success View */
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              border: "1px solid #dcdcdc",
              borderRadius: "8px",
              background: "#ffffff",
              marginBottom: "3rem"
            }}>
              <span style={{ fontSize: "4rem" }}>🎉</span>
              <h2 style={{ fontSize: "2rem", color: "#1053a0", margin: "1rem 0", fontFamily: '"Patrick Hand", cursive' }}>
                Thank you! Your order has been placed.
              </h2>
              <p style={{ color: "#515151", fontSize: "1.1rem", marginBottom: "2rem" }}>
                Your Order ID is <strong>#{successOrderNumber}</strong>. We are processing it and will contact you shortly.
              </p>
              <Link to="/shop" className="btn-primary" style={{
                background: "#1053a0",
                color: "#ffffff",
                padding: "0.6rem 2rem",
                borderRadius: "20px",
                textDecoration: "none",
                fontWeight: "bold"
              }}>
                Continue Shopping
              </Link>
            </div>
          ) : items.length === 0 ? (
            /* Empty state check */
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              border: "1px solid #dcdcdc",
              borderRadius: "8px",
              background: "#ffffff",
              marginBottom: "3rem"
            }}>
              <span style={{ fontSize: "4rem" }}>🛒</span>
              <h2 style={{ fontSize: "1.8rem", color: "#1053a0", margin: "1rem 0" }}>Your cart is empty</h2>
              <p style={{ color: "#777777", marginBottom: "2rem" }}>Please add some products to your cart before checking out.</p>
              <Link to="/shop" style={{
                background: "#1053a0",
                color: "#ffffff",
                padding: "0.6rem 2rem",
                borderRadius: "20px",
                textDecoration: "none",
                fontWeight: "bold"
              }}>
                Go to Shop
              </Link>
            </div>
          ) : (
            /* Checkout Form Grid */
            <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "1fr 450px", gap: "3.5rem", alignItems: "start" }}>
              
              {/* Left Column: Delivery Address Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                <div>
                  <h3 style={{
                    fontFamily: '"Patrick Hand", cursive',
                    fontSize: "1.6rem",
                    color: "#1a5ca3",
                    textAlign: "center",
                    margin: "0 0 1.5rem 0",
                    fontWeight: "bold",
                    borderBottom: "2px solid #eaeaea",
                    paddingBottom: "0.5rem"
                  }}>
                    DELIVERY ADDRESS
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    
                    {/* First & Last name rows */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <label style={labelStyle}>
                          First name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>
                          Last name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Static Country */}
                    <div>
                      <label style={labelStyle}>
                        Country <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ fontSize: "1.05rem", fontWeight: "bold", color: "#333", padding: "0.2rem 0" }}>
                        Kenya
                      </div>
                    </div>

                    {/* City / County selection */}
                    <div>
                      <label style={labelStyle}>
                        City/County <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select 
                        required
                        value={selectedCity}
                        onChange={e => setSelectedCity(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="Nairobi">Nairobi</option>
                        <option value="Kiambu">Kiambu</option>
                        <option value="Mombasa">Mombasa</option>
                        <option value="Kisumu">Kisumu</option>
                        <option value="Nakuru">Nakuru</option>
                      </select>
                    </div>

                    {/* Neighbourhood selection */}
                    <div>
                      <label style={labelStyle}>
                        Neighbourhood <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select 
                        required
                        value={selectedZone}
                        onChange={e => setSelectedZone(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Select a neighbourhood...</option>
                        {Object.keys(DELIVERY_ZONES).map(zone => (
                          <option key={zone} value={zone}>
                            {zone} (Fee: {DELIVERY_ZONES[zone].fee}KSh)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Street Address */}
                    <div>
                      <label style={labelStyle}>
                        Street Address <span style={{ color: "#ef4444" }}>**</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="House number, & street name"
                        value={streetAddress}
                        onChange={e => setStreetAddress(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    {/* Apartment details */}
                    <div>
                      <label style={{ ...labelStyle, fontWeight: "normal" }}>
                        Apartment, suite, unit etc. <span style={{ color: "#888", fontSize: "0.8rem" }}>(optional)</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="Apartment, suite, unit etc."
                        value={apartmentInfo}
                        onChange={e => setApartmentInfo(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    {/* Email and Phone side by side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <label style={labelStyle}>
                          Email <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input 
                          type="email" 
                          required
                          placeholder="me@mail.com"
                          value={recipientEmail}
                          onChange={e => setRecipientEmail(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>
                          Phone <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input 
                          type="tel" 
                          required
                          placeholder="+254 000 000 000"
                          value={recipientPhone}
                          onChange={e => setRecipientPhone(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Additional Delivery Information Accordion */}
                <div style={{
                  border: "1px solid #dcdcdc",
                  borderRadius: "8px",
                  background: "#ffffff",
                  overflow: "hidden"
                }}>
                  {/* Accordion Header */}
                  <div 
                    onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                    style={{
                      padding: "1rem 1.5rem",
                      background: "#fdfdfd",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: showAdditionalInfo ? "1px solid #eaeaea" : "none",
                      userSelect: "none"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", color: "#1a5ca3" }}>
                      📋 ADDITIONAL DELIVERY INFORMATION (OPTIONAL)
                    </span>
                    <span style={{ color: "#1a5ca3" }}>{showAdditionalInfo ? "▲" : "▼"}</span>
                  </div>

                  {/* Accordion Body */}
                  {showAdditionalInfo && (
                    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                          Additional Address Information <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="Building name, floor, apartment number, etc."
                          value={additionalAddress}
                          onChange={e => setAdditionalAddress(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                            Recipient Contact <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
                          </label>
                          <input 
                            type="text" 
                            placeholder="Name of the person receiving"
                            value={contactPerson}
                            onChange={e => setContactPerson(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                            Recipient Phone <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
                          </label>
                          <input 
                            type="tel" 
                            placeholder="Phone number of the recipient"
                            value={contactPersonPhone}
                            onChange={e => setContactPersonPhone(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                          Delivery Instructions <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
                        </label>
                        <textarea 
                          placeholder="Special delivery instructions, gate codes, etc."
                          rows={3}
                          value={deliveryInstructions}
                          onChange={e => setDeliveryInstructions(e.target.value)}
                          style={{
                            ...inputStyle,
                            resize: "vertical"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* General Order Notes */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#333", fontWeight: "bold", marginBottom: "0.5rem" }}>
                    Order notes (optional)
                  </label>
                  <textarea 
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    rows={4}
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    style={{
                      ...inputStyle,
                      resize: "vertical"
                    }}
                  />
                </div>

              </div>

              {/* Right Column: Order Summary & Checkout CTA */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <h3 style={{
                  fontFamily: '"Patrick Hand", cursive',
                  fontSize: "1.6rem",
                  color: "#1a5ca3",
                  textAlign: "center",
                  margin: 0,
                  fontWeight: "bold",
                  borderBottom: "2px solid #eaeaea",
                  paddingBottom: "0.5rem"
                }}>
                  YOUR ORDERS
                </h3>

                {/* Order Summary Box */}
                <div style={{
                  border: "1px solid #1a5ca3",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "#ffffff"
                }}>
                  {/* Header Row */}
                  <div style={{
                    background: "#1a5ca3",
                    color: "#ffffff",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: "0.95rem"
                  }}>
                    <span>Order Summary Total</span>
                    <span>{totalAmount.toLocaleString()}KSh</span>
                  </div>

                  {/* Products label */}
                  <div style={{
                    background: "#f4f8fa",
                    padding: "0.5rem 1rem",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    color: "#333"
                  }}>
                    Product
                  </div>

                  {/* List of items */}
                  <div style={{ borderBottom: "1px solid #eaeaea" }}>
                    {items.map(item => (
                      <div key={item.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.65rem 1rem",
                        fontSize: "0.85rem",
                        borderBottom: "1px solid #f9f9f9"
                      }}>
                        <span style={{ color: "#515151" }}>{item.name} <strong>× {item.quantity}</strong></span>
                        <span style={{ color: "#333", fontWeight: 500 }}>{(item.price * item.quantity).toLocaleString()}KSh</span>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal Row */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    borderBottom: "1px solid #eaeaea"
                  }}>
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString()}KSh</span>
                  </div>

                  {/* Coupon Box */}
                  <div style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #eaeaea",
                    background: "#ffffff"
                  }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input 
                        type="text" 
                        placeholder="Enter Coupon code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "0.4rem 0.75rem",
                          border: "1px solid #c2c2c2",
                          borderRadius: "4px",
                          outline: "none",
                          fontSize: "0.85rem"
                        }}
                      />
                      <button 
                        type="button"
                        onClick={handleApplyCoupon}
                        style={{
                          background: "#1053a0",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "20px",
                          padding: "0.4rem 1.2rem",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Apply coupon
                      </button>
                    </div>
                    {couponMessage && (
                      <div style={{ fontSize: "0.8rem", color: appliedDiscount > 0 ? "green" : "red", marginTop: "0.4rem" }}>
                        {couponMessage}
                      </div>
                    )}
                  </div>

                  {/* Delivery Fee Notice Row */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #eaeaea",
                    fontSize: "0.8rem",
                    color: "#515151",
                    alignItems: "center"
                  }}>
                    <span style={{ maxWidth: "80%", lineHeight: 1.3 }}>
                      {selectedZone 
                        ? `Delivery Fee - ${selectedZone}` 
                        : "Delivery Fee - Shipping will be calculated once a Neighbourhood is provided"}
                    </span>
                    <span style={{ fontWeight: "bold" }}>
                      {selectedZone ? `${deliveryFee.toLocaleString()}KSh` : "0KSh"}
                    </span>
                  </div>

                  {/* Applied Discount Row */}
                  {appliedDiscount > 0 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid #eaeaea",
                      fontSize: "0.9rem",
                      color: "green",
                      fontWeight: 500
                    }}>
                      <span>Discount (10%)</span>
                      <span>-{discountAmount.toLocaleString()}KSh</span>
                    </div>
                  )}

                  {/* Total Row */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.85rem 1rem",
                    fontWeight: "bold",
                    fontSize: "1.05rem",
                    color: "#333"
                  }}>
                    <span>Total</span>
                    <span>{totalAmount.toLocaleString()}KSh</span>
                  </div>
                </div>

                {/* Loyalty Points & PSK Cash Box */}
                <div style={{
                  border: "1px solid #dcdcdc",
                  borderRadius: "4px",
                  padding: "1rem",
                  background: "#ffffff"
                }}>
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    🎁 Loyalty Points & PSK Cash
                  </div>
                  <div style={{
                    color: "#515151",
                    fontSize: "0.8rem",
                    lineHeight: 1.4,
                    marginTop: "0.6rem",
                    marginBottom: "1rem"
                  }}>
                    Earn points with every purchase and redeem them for discounts. Login to your PetStore Kenya account to view and use your loyalty points.
                  </div>
                  <button 
                    type="button"
                    onClick={() => navigate("/my-account")}
                    style={{
                      background: "#ffffff",
                      color: "#1a5ca3",
                      border: "1px solid #bbd2e8",
                      borderRadius: "4px",
                      padding: "0.5rem 1rem",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    Login to view your points
                  </button>
                </div>

                {/* Payment Option radios */}
                <div style={{
                  border: "1px solid #dcdcdc",
                  borderRadius: "4px",
                  padding: "1.5rem",
                  background: "#ffffff"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    
                    {/* iPay Option */}
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
                        <input 
                          type="radio" 
                          name="payment_method" 
                          checked={paymentMethod === "ipay"}
                          onChange={() => setPaymentMethod("ipay")}
                          style={{ cursor: "pointer" }}
                        />
                        iPay
                      </label>
                      
                      {/* Merchant Logos */}
                      <div style={{ display: "flex", gap: "0.4rem", margin: "0.4rem 0 0.4rem 1.5rem", flexWrap: "wrap" }}>
                        <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>M-Pesa</span>
                        <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>Airtel</span>
                        <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>Kenswitch</span>
                        <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>Visa</span>
                        <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>MasterCard</span>
                      </div>

                      {paymentMethod === "ipay" && (
                        <div style={{
                          background: "#eae8f3",
                          color: "#333333",
                          padding: "0.85rem",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          lineHeight: 1.4,
                          marginLeft: "1.5rem",
                          borderLeft: "4px solid #1a5ca3"
                        }}>
                          Place order and pay using (M-PESA, Airtel Money, Kenswitch, VISA, MasterCard) Powered by www.ipayafrica.com
                        </div>
                      )}
                    </div>

                    {/* Peach Payments Option */}
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
                        <input 
                          type="radio" 
                          name="payment_method"
                          checked={paymentMethod === "peach"}
                          onChange={() => setPaymentMethod("peach")}
                          style={{ cursor: "pointer" }}
                        />
                        Peach Payments
                      </label>
                    </div>

                    {/* Lipa na M-PESA Option */}
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
                        <input 
                          type="radio" 
                          name="payment_method"
                          checked={paymentMethod === "lipampesa"}
                          onChange={() => setPaymentMethod("lipampesa")}
                          style={{ cursor: "pointer" }}
                        />
                        Lipa na M-PESA <span style={{ color: "#25d366", fontSize: "0.85rem", fontWeight: "900", marginLeft: "0.5rem" }}>LIPA NA m-pesa</span>
                      </label>
                    </div>

                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <input 
                      type="checkbox" 
                      id="terms"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      style={{ marginTop: "0.2rem", cursor: "pointer" }}
                    />
                    <label htmlFor="terms" style={{ fontSize: "0.85rem", color: "#333", cursor: "pointer", userSelect: "none" }}>
                      I have read and agree to the website <span style={{ color: "#ef4444", textDecoration: "underline", cursor: "pointer" }}>terms and conditions</span> *
                    </label>
                  </div>

                  {errorMessage && (
                    <div style={{ background: "#fdf2f2", border: "1px solid #f5c2c2", padding: "0.75rem", borderRadius: "4px", color: "#ef4444", fontSize: "0.85rem", marginTop: "1rem" }}>
                      {errorMessage}
                    </div>
                  )}

                  {/* Place Order CTA Button */}
                  <button 
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: "#00c853",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.75rem",
                      width: "100%",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      cursor: submitting ? "not-allowed" : "pointer",
                      marginTop: "1.2rem",
                      textTransform: "uppercase",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      outline: "none"
                    }}
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>

                  {/* Complete Order via WhatsApp */}
                  <button 
                    type="button"
                    onClick={handleWhatsAppCheckout}
                    style={{
                      background: "#4caf50",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "0.7rem",
                      width: "100%",
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      marginTop: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      outline: "none"
                    }}
                  >
                    <i className="fa fa-whatsapp" style={{ fontSize: "18px" }}></i> Complete Order via WhatsApp
                  </button>

                </div>

              </div>

            </form>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}
