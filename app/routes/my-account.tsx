import { data, redirect, Form, useLoaderData, useActionData, useNavigate, Link } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/my-account";
import { query } from "../db.server";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export function meta() {
  return [
    { title: "My Account — PetStore Kenya" },
    { name: "description", content: "Access your PetStore Kenya customer account dashboard, manage addresses, orders, and view loyalty points." }
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "logout") {
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      "customer_name=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
    );
    headers.append(
      "Set-Cookie",
      "customer_email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
    );
    return redirect("/my-account", { headers });
  }

  const cookieHeader = request.headers.get("Cookie") || "";
  const nameCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_name="));
  const emailCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_email="));

  const customerName = nameCookie ? decodeURIComponent(nameCookie.split("=")[1]) : "";
  const customerEmail = emailCookie ? decodeURIComponent(emailCookie.split("=")[1]) : "";

  let orders: any[] = [];
  if (customerEmail) {
    const res = await query(
      `SELECT * FROM orders WHERE customer_email = $1 ORDER BY id DESC`,
      [customerEmail]
    );
    orders = res.rows;
  }

  return { customerName, customerEmail, orders };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const formType = formData.get("form_type")?.toString();

  if (formType === "login") {
    const email = formData.get("email")?.toString().trim();

    if (!email) {
      return data({ error: "Email is required" }, { status: 400 });
    }

    // Lookup customer or create
    const res = await query("SELECT * FROM customers WHERE email = $1", [email]);
    let name = "Ben Ochieng";
    if (res.rows.length > 0) {
      name = res.rows[0].name || name;
    } else {
      await query("INSERT INTO customers (name, email) VALUES ($1, $2)", [name, email]);
    }

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `customer_name=${encodeURIComponent(name)}; Path=/; SameSite=Lax; Max-Age=86400`
    );
    headers.append(
      "Set-Cookie",
      `customer_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=86400`
    );

    return redirect("/my-account", { headers });
  } else if (formType === "register") {
    const firstName = formData.get("firstName")?.toString().trim();
    const lastName = formData.get("lastName")?.toString().trim();
    const email = formData.get("email")?.toString().trim();

    if (!firstName || !lastName || !email) {
      return data({ error: "First Name, Last Name and email are required" }, { status: 400 });
    }

    const name = `${firstName} ${lastName}`;

    await query(
      "INSERT INTO customers (name, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name",
      [name, email]
    );

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `customer_name=${encodeURIComponent(name)}; Path=/; SameSite=Lax; Max-Age=86400`
    );
    headers.append(
      "Set-Cookie",
      `customer_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=86400`
    );

    return redirect("/my-account", { headers });
  }

  return {};
}

export default function MyAccount() {
  const { customerName, customerEmail, orders } = useLoaderData<typeof loader>();
  const actionData = useActionData<any>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Address Mock state
  const [address, setAddress] = useState({
    billingName: customerName || "Ben Ochieng",
    street: "123 Karen Road",
    city: "Nairobi",
    phone: "254795350292",
  });

  if (!customerName) {
    return (
      <>
        <Navbar />
        <div className="page" style={{ paddingTop: "4rem", paddingBottom: "4rem", background: "#ffffff" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>

            {/* Header Banner */}
            <div style={{
              backgroundImage: "url('/images/my-account-bg.png')",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              height: "65px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.2rem",
              marginBottom: "3rem",
              borderBottom: "3px solid #f7c276"
            }}>
              <i className="fa fa-paw" style={{
                transform: "rotate(45deg)",
                fontSize: "18px",
                color: "#f7c276",
                display: "inline-block"
              }} />
              <h1 style={{
                fontFamily: '"Patrick Hand", cursive',
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#1053a0",
                margin: 0,
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}>
                MY ACCOUNT
              </h1>
              <i className="fa fa-paw" style={{
                transform: "rotate(-45deg)",
                fontSize: "18px",
                color: "#f7c276",
                display: "inline-block"
              }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>

              {/* Login Form */}
              <div style={{
                background: "#ffffff",
                padding: "2.5rem 3rem",
                borderRadius: "4px",
                border: "1px solid #dcdcdc",
                display: "flex",
                flexDirection: "column"
              }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 500, color: "#1a1a1a", marginBottom: "1.5rem", fontFamily: "var(--font-sans)" }}>Login</h2>
                <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <input type="hidden" name="form_type" value="login" />

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                      Username or email address <span style={{ color: "#e2401c" }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        border: "1px solid #c2c2c2",
                        borderRadius: "5px",
                        outline: "none",
                        fontSize: "0.95rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                      Password <span style={{ color: "#e2401c" }}>*</span>
                    </label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        name="password"
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          paddingRight: "2.5rem",
                          border: "1px solid #c2c2c2",
                          borderRadius: "5px",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                      <span
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          color: "#777777"
                        }}
                      >
                        <i className={showLoginPassword ? "fa fa-eye-slash" : "fa fa-eye"} style={{ fontSize: "16px" }}></i>
                      </span>
                    </div>
                  </div>

                  {actionData?.error && (
                    <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{actionData.error}</div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                    <input
                      type="checkbox"
                      id="rememberme"
                      name="rememberme"
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <label htmlFor="rememberme" style={{ fontSize: "0.85rem", color: "#1a1a1a", cursor: "pointer", userSelect: "none" }}>
                      Remember me
                    </label>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: "#ece9e2",
                      color: "#1a1a1a",
                      border: "1px solid #dcdcdc",
                      borderRadius: "4px",
                      padding: "0.55rem 1.25rem",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      alignSelf: "flex-start",
                      width: "fit-content",
                      outline: "none",
                      marginTop: "0.5rem"
                    }}
                  >
                    Log in
                  </button>

                  <a href="#" style={{ fontSize: "0.85rem", color: "#3b82f6", textDecoration: "none", marginTop: "0.5rem", alignSelf: "flex-start" }}>
                    Lost your password?
                  </a>

                  <button
                    type="button"
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.65rem 1.25rem",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "fit-content",
                      marginTop: "1.5rem"
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: "10px" }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </button>
                </Form>
              </div>

              {/* Register Form */}
              <div style={{
                background: "#ffffff",
                padding: "2.5rem 3rem",
                borderRadius: "4px",
                border: "1px solid #dcdcdc",
                display: "flex",
                flexDirection: "column"
              }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 500, color: "#1a1a1a", marginBottom: "1.5rem", fontFamily: "var(--font-sans)" }}>Register</h2>
                <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <input type="hidden" name="form_type" value="register" />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                        First Name <span style={{ color: "#e2401c" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          border: "1px solid #c2c2c2",
                          borderRadius: "5px",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                        Last Name <span style={{ color: "#e2401c" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          border: "1px solid #c2c2c2",
                          borderRadius: "5px",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                      Email address <span style={{ color: "#e2401c" }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        border: "1px solid #c2c2c2",
                        borderRadius: "5px",
                        outline: "none",
                        fontSize: "0.95rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                      Password <span style={{ color: "#e2401c" }}>*</span>
                    </label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        name="password"
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          paddingRight: "2.5rem",
                          border: "1px solid #c2c2c2",
                          borderRadius: "5px",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                      <span
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          color: "#777777"
                        }}
                      >
                        <i className={showRegisterPassword ? "fa fa-eye-slash" : "fa fa-eye"} style={{ fontSize: "16px" }}></i>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                    <input
                      type="checkbox"
                      id="newsletter"
                      name="newsletter"
                      defaultChecked
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <label htmlFor="newsletter" style={{ fontSize: "0.85rem", color: "#1a1a1a", cursor: "pointer", userSelect: "none" }}>
                      Subscribe to our newsletter
                    </label>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: "#ece9e2",
                      color: "#1a1a1a",
                      border: "1px solid #dcdcdc",
                      borderRadius: "4px",
                      padding: "0.55rem 1.25rem",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      alignSelf: "flex-start",
                      width: "fit-content",
                      outline: "none",
                      marginTop: "0.5rem"
                    }}
                  >
                    Register
                  </button>

                  <button
                    type="button"
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.65rem 1.25rem",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "fit-content",
                      marginTop: "1.5rem"
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: "10px" }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </button>
                </Form>
              </div>

            </div>

          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 1.5rem" }}>

          {/* Header Banner */}
          <div style={{
            backgroundImage: "url('/images/my-account-bg.png')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: "65px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.2rem",
            marginBottom: "1.5rem",
            borderBottom: "3px solid #f7c276"
          }}>
            <i className="fa fa-paw" style={{
              transform: "rotate(45deg)",
              fontSize: "18px",
              color: "#f7c276",
              display: "inline-block"
            }} />
            <h1 style={{
              fontFamily: '"Patrick Hand", cursive',
              fontSize: "1.8rem",
              fontWeight: "bold",
              color: "#1053a0",
              margin: 0,
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              MY ACCOUNT
            </h1>
            <i className="fa fa-paw" style={{
              transform: "rotate(-45deg)",
              fontSize: "18px",
              color: "#f7c276",
              display: "inline-block"
            }} />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#3b82f6", cursor: "pointer" }}>Edit This</span>
          </div>

          {/* Account Dashboard Layout Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2.5rem", alignItems: "start" }}>

            {/* Left WooCommerce Sidebar Menu */}
            <aside style={{ display: "flex", flexDirection: "column" }}>
              <button
                onClick={() => setActiveTab("dashboard")}
                style={{
                  textAlign: "left",
                  background: activeTab === "dashboard" ? "#1a5ca3" : "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #0f4a8f",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                <i className="fa fa-tachometer" style={{ marginRight: "10px" }}></i> Dashboard
              </button>

              <button
                onClick={() => setActiveTab("loyalty")}
                style={{
                  textAlign: "left",
                  background: activeTab === "loyalty" ? "#585447" : "#6a6659",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #524f44",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                <i className="fa fa-gift" style={{ marginRight: "10px" }}></i> Loyalty Points
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                style={{
                  textAlign: "left",
                  background: activeTab === "orders" ? "#1a5ca3" : "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #0f4a8f",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                <i className="fa fa-shopping-basket" style={{ marginRight: "10px" }}></i> Orders
              </button>

              <button
                onClick={() => setActiveTab("addresses")}
                style={{
                  textAlign: "left",
                  background: activeTab === "addresses" ? "#1a5ca3" : "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #0f4a8f",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                <i className="fa fa-home" style={{ marginRight: "10px" }}></i> Addresses
              </button>

              <button
                onClick={() => setActiveTab("details")}
                style={{
                  textAlign: "left",
                  background: activeTab === "details" ? "#1a5ca3" : "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #0f4a8f",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                <i className="fa fa-user" style={{ marginRight: "10px" }}></i> Account Details
              </button>

              <button
                onClick={() => navigate("/my-account?action=logout")}
                style={{
                  textAlign: "left",
                  background: "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                <i className="fa fa-sign-out" style={{ marginRight: "10px" }}></i> Log Out
              </button>
            </aside>

            {/* Right Dashboard Content */}
            <main style={{ fontFamily: "var(--font-sans)", color: "#1e293b", fontSize: "0.95rem", lineHeight: 1.6 }}>
              {activeTab === "dashboard" && (
                <div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    Hello <strong style={{ color: "#000000" }}>{customerName}</strong> (not <strong style={{ color: "#000000" }}>{customerName}</strong>? <Link to="/my-account?action=logout" style={{ color: "#3b82f6", textDecoration: "none" }}>Log out</Link>)
                  </div>
                  <p style={{ color: "#475569" }}>
                    From your account dashboard you can view your <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => setActiveTab("orders")}>recent orders</span>, manage your <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => setActiveTab("addresses")}>shipping and billing addresses</span>, and <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => setActiveTab("details")}>edit your password and account details</span>.
                  </p>
                </div>
              )}

              {activeTab === "loyalty" && (
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1053a0", marginBottom: "1rem" }}>Your Loyalty Points</h3>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "6px" }}>
                    <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                      Active Balance: <strong style={{ color: "#d97706", fontSize: "1.3rem" }}>150 Points</strong>
                    </div>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem" }}>
                      150 points translates to KES 150 discount available on your next checkout. Collect more points with every food order you complete!
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1053a0", marginBottom: "1rem" }}>Recent Orders</h3>
                  {orders.length === 0 ? (
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "6px", color: "#64748b" }}>
                      No orders placed yet. <Link to="/shop" style={{ color: "#3b82f6", textDecoration: "none" }}>Browse products</Link> to place your first order.
                    </div>
                  ) : (
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b" }}>Order</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b" }}>Date</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b" }}>Status</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o: any) => (
                            <tr key={o.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>#{o.id}</td>
                              <td style={{ padding: "0.75rem 1rem" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <span style={{
                                  background: o.status === "completed" ? "#dcfce7" : "#fef9c3",
                                  color: o.status === "completed" ? "#166534" : "#854d0e",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "4px",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  textTransform: "capitalize"
                                }}>
                                  {o.status}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>KES {Number(o.total_kes).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "addresses" && (
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1053a0", marginBottom: "1rem" }}>My Addresses</h3>
                  <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                    The following addresses will be used on the checkout page by default.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    <div style={{ border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "6px" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Billing Address</h4>
                      <address style={{ fontStyle: "normal", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{address.billingName}</span>
                        <span>{address.street}</span>
                        <span>{address.city}</span>
                        <span>Kenya</span>
                        <span style={{ marginTop: "0.5rem" }}>Phone: {address.phone}</span>
                      </address>
                    </div>

                    <div style={{ border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "6px" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Shipping Address</h4>
                      <address style={{ fontStyle: "normal", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{address.billingName}</span>
                        <span>{address.street}</span>
                        <span>{address.city}</span>
                        <span>Kenya</span>
                        <span style={{ marginTop: "0.5rem" }}>Phone: {address.phone}</span>
                      </address>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1053a0", marginBottom: "1.5rem" }}>Account Details</h3>
                  <form style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "600px" }} onSubmit={e => e.preventDefault()}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>FIRST NAME *</label>
                        <input type="text" defaultValue={customerName.split(" ")[0] || "Ben"} style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>LAST NAME *</label>
                        <input type="text" defaultValue={customerName.split(" ")[1] || "Ochieng"} style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>DISPLAY NAME *</label>
                      <input type="text" defaultValue={customerName} style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "0.25rem" }}>
                        This will be how your name will be displayed in the account section and in reviews.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>EMAIL ADDRESS *</label>
                      <input type="email" defaultValue={customerEmail} style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.5rem", alignSelf: "flex-start", fontWeight: 700 }}>
                      SAVE CHANGES
                    </button>
                  </form>
                </div>
              )}
            </main>

          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
