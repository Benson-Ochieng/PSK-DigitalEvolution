import { data, redirect, Form, useLoaderData, useActionData, useNavigate, Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import fs from "fs";
import path from "path";
import type { Route } from "./+types/my-account";
import { query } from "../db.server";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { SHIPPING_ZONES, CITIES } from "./checkout";

export function meta() {
  return [
    { title: "My Account - PetStore Kenya" },
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

  let customerName = nameCookie ? decodeURIComponent(nameCookie.split("=")[1]) : "";
  const customerEmail = emailCookie ? decodeURIComponent(emailCookie.split("=")[1]) : "";

  let orders: any[] = [];
  let kraPin = "";
  if (customerEmail) {
    try {
      const { db } = await import("../lib/db.server");
      const appUser = await db.user.findUnique({ where: { email: customerEmail } });
      if (appUser && appUser.status === "suspended") {
        const headers = new Headers();
        headers.append("Set-Cookie", "customer_name=; Path=/; Max-Age=0");
        headers.append("Set-Cookie", "customer_email=; Path=/; Max-Age=0");
        return redirect("/my-account", { headers });
      }
    } catch (e) {}

    const res = await query(
      `SELECT * FROM orders WHERE customer_email = $1 ORDER BY id DESC`,
      [customerEmail]
    );
    orders = res.rows;

    try {
      const custRes = await query(`SELECT name, kra_pin FROM customers WHERE LOWER(email) = $1 LIMIT 1`, [customerEmail.toLowerCase()]);
      if (custRes.rows.length > 0) {
        if (custRes.rows[0].name) {
          customerName = custRes.rows[0].name;
        }
        kraPin = custRes.rows[0].kra_pin || "";
      }
    } catch (e) {}
  }

  const settingsPath = path.join(process.cwd(), "content", "general-settings.json");
  let recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || "";
  let googleClientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER";
  if (fs.existsSync(settingsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      recaptchaSiteKey = parsed.recaptchaSiteKey || recaptchaSiteKey;
      if (parsed.googleClientId) {
        googleClientId = parsed.googleClientId;
      }
    } catch (e) {}
  }

  return { customerName, customerEmail, orders, recaptchaSiteKey, googleClientId, kraPin };
}

export async function action({ request }: Route.ActionArgs) {
  const { db } = await import("../lib/db.server");
  const formData = await request.formData();
  const formType = formData.get("form_type")?.toString();

  if (formType === "login" || formType === "register") {
    const settingsPath = path.join(process.cwd(), "content", "general-settings.json");
    let recaptchaSecret = "";
    if (fs.existsSync(settingsPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        recaptchaSecret = parsed.recaptchaSecretKey || "";
      } catch (e) {}
    }

    if (recaptchaSecret) {
      const recaptchaResponse = formData.get("g-recaptcha-response")?.toString();
      if (!recaptchaResponse) {
        return data({ error: "Please complete the reCAPTCHA to verify that you are not a robot." }, { status: 400 });
      }

      try {
        const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(recaptchaResponse)}`,
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return data({ error: "reCAPTCHA verification failed. Please try again." }, { status: 400 });
        }
      } catch (e) {
        console.error("reCAPTCHA verification error:", e);
        return data({ error: "Failed to verify reCAPTCHA. Please try again." }, { status: 500 });
      }
    }
  }

  // Check if account has been deleted (only block login, allow re-registration)
  const targetEmail = formData.get("email")?.toString().trim().toLowerCase();
  if (targetEmail && formType === "login") {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS deleted_customers (
          email TEXT PRIMARY KEY,
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Verify if account exists in customers / db.user (e.g. recreated by admin)
      let isAccountRecreated = false;
      const activeCustomerCheck = await query(
        "SELECT 1 FROM customers WHERE LOWER(email) = $1 AND (status IS NULL OR status != 'deleted')",
        [targetEmail]
      );
      if (activeCustomerCheck.rows.length > 0) {
        isAccountRecreated = true;
      } else {
        try {
          const userObj = await db.user.findUnique({ where: { email: targetEmail } });
          if (userObj && (userObj.status as string) !== "deleted" && userObj.status !== "suspended") {
            isAccountRecreated = true;
          }
        } catch (e) {}
      }

      if (isAccountRecreated) {
        // Clear stale deleted_customers entry if account has been recreated/restored
        await query("DELETE FROM deleted_customers WHERE LOWER(email) = $1", [targetEmail]);
      } else {
        const deletedCheck = await query("SELECT 1 FROM deleted_customers WHERE LOWER(email) = $1", [targetEmail]);
        if (deletedCheck.rows.length > 0) {
          return data(
            { error: "This account has been deleted. If you believe this is an error or wish to restore your account, please contact customer support." },
            { status: 400 }
          );
        }
      }
    } catch (e) {}
  }

  if (formType === "update_account") {
    const firstName = formData.get("firstName")?.toString().trim();
    const lastName = formData.get("lastName")?.toString().trim();
    const displayName = formData.get("displayName")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const currentEmail = formData.get("currentEmail")?.toString().trim();
    const kraPin = formData.get("kraPin")?.toString().trim();

    const currentPassword = formData.get("currentPassword")?.toString();
    const newPassword = formData.get("newPassword")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!displayName || !email) {
      return data({ error: "Display Name and Email Address are required." }, { status: 400 });
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        return data({ error: "New password and Confirm new password do not match." }, { status: 400 });
      }
      if (newPassword && newPassword.length < 6) {
        return data({ error: "New password must be at least 6 characters long." }, { status: 400 });
      }
    }

    const nameToSave = displayName || `${firstName || ""} ${lastName || ""}`.trim();

    try {
      try {
        await query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS kra_pin TEXT");
        await query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS username TEXT");
      } catch (e) {}

      const targetLookupEmail = (currentEmail || email).toLowerCase();

      await query(
        "UPDATE customers SET name = $1, username = $2, email = $3, kra_pin = $4 WHERE LOWER(email) = $5",
        [nameToSave, displayName, email, kraPin || null, targetLookupEmail]
      );

      // Update db.user if present
      try {
        const { db } = await import("../lib/db.server");
        const user = await db.user.findUnique({ where: { email: targetLookupEmail } });
        if (user) {
          const updateData: any = { name: nameToSave, username: displayName, email: email };
          if (newPassword) {
            updateData.password = newPassword;
          }
          await db.user.update({
            where: { id: user.id },
            data: updateData
          });
        }
      } catch (e) {}

      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        `customer_name=${encodeURIComponent(nameToSave)}; Path=/; SameSite=Lax; Max-Age=86400`
      );
      headers.append(
        "Set-Cookie",
        `customer_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=86400`
      );

      return data({ success: true, message: "Account details saved successfully!" }, { headers });
    } catch (err) {
      console.error("Error updating account details:", err);
      return data({ error: "Failed to save account details. Please try again." }, { status: 500 });
    }
  }

  if (formType === "google_login") {
    const email = formData.get("email")?.toString().trim();
    const name = formData.get("name")?.toString().trim();

    if (!email || !name) {
      return data({ error: "Google authentication failed: Email and Name are required" }, { status: 400 });
    }

    const { db } = await import("../lib/db.server");
    const appUser = await db.user.findUnique({ where: { email } });
    if (appUser && appUser.status === "suspended") {
      return data(
        { error: "Your account has been suspended. Please contact customer support for assistance." },
        { status: 403 }
      );
    }

    // Lookup customer or create
    const res = await query("SELECT * FROM customers WHERE email = $1", [email]);
    if (res.rows.length === 0) {
      await query("INSERT INTO customers (name, email) VALUES ($1, $2)", [name, email]);
    } else {
      // Keep customer name updated
      await query("UPDATE customers SET name = $1 WHERE email = $2", [name, email]);
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
  }

  if (formType === "login") {
    const email = formData.get("email")?.toString().trim();

    if (!email) {
      return data({ error: "Email is required" }, { status: 400 });
    }

    const { db } = await import("../lib/db.server");
    const appUser = await db.user.findUnique({ where: { email } });
    if (appUser && appUser.status === "suspended") {
      return data(
        { error: "Your account has been suspended. Please contact customer support for assistance." },
        { status: 403 }
      );
    }

    // Lookup customer or create
    const res = await query("SELECT * FROM customers WHERE email = $1", [email]);
    let name = "";

    if (res.rows.length > 0) {
      name = res.rows[0].name;
      // If the customer name was defaulted to "Ben Ochieng", but they exist in db.user, update it
      if (name === "Ben Ochieng" && appUser && appUser.name) {
        name = appUser.name;
        await query("UPDATE customers SET name = $1 WHERE email = $2", [name, email]);
      }
    } else {
      // Check if user exists in db.user
      if (appUser && appUser.name) {
        name = appUser.name;
      } else {
        // Derive name from email prefix
        const prefix = email.split("@")[0];
        name = prefix
          .split(/[\._\-+]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }

      try {
        await query("SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 1))");
      } catch (e) {}

      await query(
        "INSERT INTO customers (name, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name",
        [name, email]
      );
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

    try {
      await query("DELETE FROM deleted_customers WHERE LOWER(email) = $1", [email.toLowerCase()]);
    } catch (e) {}

    await query(
      "INSERT INTO customers (name, email, status) VALUES ($1, $2, 'active') ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, status = 'active'",
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

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "Very Weak", color: "#fca5a5" };
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 2;
  } else if (password.length >= 6) {
    score += 1;
  }
  
  // Character type checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  if (hasLower) score += 1;
  if (hasUpper) score += 1;
  if (hasDigit) score += 1;
  if (hasSpecial) score += 1;
  
  // Map score to levels
  if (password.length < 6) {
    return { score: 1, label: "Very Weak", color: "#fca5a5" }; // Light Red
  }
  if (password.length < 8) {
    return { score: 2, label: "Weak", color: "#fbc4a3" }; // Peach
  }
  
  if (score <= 3) {
    return { score: 2, label: "Weak", color: "#fbc4a3" };
  } else if (score <= 5) {
    return { score: 3, label: "Medium", color: "#ffe87c" }; // Yellow
  } else {
    return { score: 4, label: "Strong", color: "#c2f0c2" }; // Green
  }
}



export default function MyAccount() {
  const { customerName, customerEmail, orders, recaptchaSiteKey, googleClientId, kraPin } = useLoaderData<typeof loader>();
  const actionData = useActionData<any>();
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname.replace(/\/$/, "");
  let activeTab = "dashboard";
  if (pathname.endsWith("/loyalty-points")) {
    activeTab = "loyalty";
  } else if (pathname.endsWith("/orders")) {
    activeTab = "orders";
  } else if (pathname.endsWith("/saved-addresses")) {
    activeTab = "addresses";
  } else if (pathname.endsWith("/edit-account")) {
    activeTab = "details";
  }
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerPassword, setRegisterPassword] = useState("");

  const [loginWidgetId, setLoginWidgetId] = useState<number | null>(null);
  const [registerWidgetId, setRegisterWidgetId] = useState<number | null>(null);
  const [showRecaptchaError, setShowRecaptchaError] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.error) {
      setShowRecaptchaError(true);
    }
  }, [actionData]);

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined" || !googleClientId) return;

    const scriptId = "google-gsi-client";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const handleGoogleLogin = () => {
    if (!googleClientId || googleClientId === "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER") {
      alert("Google Client ID is not configured. Please supply a valid Client ID.");
      return;
    }
    if (!(window as any).google || !(window as any).google.accounts) {
      alert("Google Sign-In is loading, please try again in a moment.");
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: "email profile openid",
        prompt: "select_account",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error("Google OAuth response error:", tokenResponse);
            return;
          }
          try {
            const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
            const profile = await res.json();
            
            if (profile.email) {
              const form = document.createElement("form");
              form.method = "post";
              
              const typeInput = document.createElement("input");
              typeInput.type = "hidden";
              typeInput.name = "form_type";
              typeInput.value = "google_login";
              form.appendChild(typeInput);
              
              const emailInput = document.createElement("input");
              emailInput.type = "hidden";
              emailInput.name = "email";
              emailInput.value = profile.email;
              form.appendChild(emailInput);
              
              const nameInput = document.createElement("input");
              nameInput.type = "hidden";
              nameInput.name = "name";
              nameInput.value = profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim();
              form.appendChild(nameInput);
              
              document.body.appendChild(form);
              form.submit();
            } else {
              alert("Could not retrieve email address from your Google Account.");
            }
          } catch (e) {
            console.error("Error fetching Google profile info:", e);
            alert("Error authenticating with Google.");
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error("Google authentication error:", err);
      alert("Failed to initialize Google Sign-in.");
    }
  };

  function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (recaptchaSiteKey) {
      const response = (window as any).grecaptcha?.getResponse(loginWidgetId ?? undefined);
      if (!response) {
        e.preventDefault();
        setClientError("Please complete the reCAPTCHA to verify that you are not a robot.");
        setShowRecaptchaError(true);
        return;
      }
    }
  }

  function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (recaptchaSiteKey) {
      const response = (window as any).grecaptcha?.getResponse(registerWidgetId ?? undefined);
      if (!response) {
        e.preventDefault();
        setClientError("Please complete the reCAPTCHA to verify that you are not a robot.");
        setShowRecaptchaError(true);
        return;
      }
    }
  }

  const errorMessage = clientError || actionData?.error;

  // Load and render Google reCAPTCHA v2 script and widgets
  useEffect(() => {
    if (typeof window === "undefined" || !recaptchaSiteKey) return;

    // Load reCAPTCHA script dynamically
    const scriptId = "recaptcha-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initRecaptchas = () => {
      if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
        const loginEl = document.getElementById("recaptcha-login");
        const registerEl = document.getElementById("recaptcha-register");

        if (loginEl && !loginEl.innerHTML) {
          try {
            const id = (window as any).grecaptcha.render("recaptcha-login", {
              sitekey: recaptchaSiteKey,
            });
            setLoginWidgetId(id);
          } catch (e) {
            console.error("Error rendering login recaptcha:", e);
          }
        }
        if (registerEl && !registerEl.innerHTML) {
          try {
            const id = (window as any).grecaptcha.render("recaptcha-register", {
              sitekey: recaptchaSiteKey,
            });
            setRegisterWidgetId(id);
          } catch (e) {
            console.error("Error rendering register recaptcha:", e);
          }
        }
      }
    };

    if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
      initRecaptchas();
    } else {
      const interval = setInterval(() => {
        if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
          initRecaptchas();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [recaptchaSiteKey]);



  // Address Picker state and logic
  interface CustomerAddress {
    id: number;
    customer_email: string;
    first_name: string;
    last_name: string;
    city: string;
    neighbourhood: string;
    street_address: string;
    apartment_info?: string;
    phone: string;
    is_default: boolean;
  }

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Modal form fields
  const [modalFirstName, setModalFirstName] = useState("");
  const [modalLastName, setModalLastName] = useState("");
  const [modalCity, setModalCity] = useState("Select a City");
  const [modalZone, setModalZone] = useState("Select your Neighbourhood");
  const [modalStreetAddress, setModalStreetAddress] = useState("");
  const [modalApartmentInfo, setModalApartmentInfo] = useState("");
  const [modalPhone, setModalPhone] = useState("");
  const [modalIsDefault, setModalIsDefault] = useState(false);

  // Custom Neighbourhood dropdown states
  const [showModalZoneDropdown, setShowModalZoneDropdown] = useState(false);
  const [modalZoneSearch, setModalZoneSearch] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".modal-zone-dropdown-container")) {
        setShowModalZoneDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const reloadAddresses = async () => {
    if (!customerEmail) return;
    try {
      const res = await fetch(`/api/addresses?email=${encodeURIComponent(customerEmail)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedAddresses(data);
      }
    } catch (err) {
      console.error("Error reloading addresses:", err);
    }
  };

  useEffect(() => {
    if (customerEmail) {
      reloadAddresses();
    }
  }, [customerEmail]);

  const handleSetDefaultAddress = async (id: number) => {
    if (!customerEmail) return;
    try {
      const res = await fetch("/api/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: customerEmail })
      });
      const data = await res.json();
      if (data.success) {
        reloadAddresses();
      }
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!customerEmail) return;
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch("/api/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: customerEmail })
      });
      const data = await res.json();
      if (data.success) {
        reloadAddresses();
      }
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setModalFirstName(addr.first_name);
    setModalLastName(addr.last_name);
    setModalCity(addr.city);
    setModalZone(addr.neighbourhood);
    setModalStreetAddress(addr.street_address);
    setModalApartmentInfo(addr.apartment_info || "");
    setModalPhone(addr.phone);
    setModalIsDefault(addr.is_default);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;

    if (!modalFirstName.trim() || !modalLastName.trim() || !modalStreetAddress.trim() || !modalPhone.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    if (modalCity === "Select a City") {
      alert("Please select a city.");
      return;
    }
    if (modalZone === "Select your Neighbourhood") {
      alert("Please select a neighbourhood.");
      return;
    }

    const payload = {
      id: editingAddress?.id,
      email: customerEmail,
      firstName: modalFirstName.trim(),
      lastName: modalLastName.trim(),
      city: modalCity,
      neighbourhood: modalZone,
      streetAddress: modalStreetAddress.trim(),
      apartmentInfo: modalApartmentInfo.trim(),
      phone: modalPhone.trim(),
      isDefault: modalIsDefault
    };

    try {
      const isEdit = !!editingAddress;
      const res = await fetch("/api/addresses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.address) {
        setShowAddressModal(false);
        reloadAddresses();
      } else {
        alert(data.error || "Failed to save address.");
      }
    } catch (err) {
      console.error("Error saving address:", err);
      alert("Failed to save address due to network error.");
    }
  };

  if (!customerName) {
    return (
      <>
        <Navbar />
        <div className="page" style={{ paddingTop: "4rem", paddingBottom: "4rem", background: "#ffffff" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>

            <PageHeader title="My Account" />

            <div className="auth-forms-grid">

              {/* Login Form */}
              <div>
                <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1.5rem", fontFamily: "var(--font-sans)" }}>Login</h2>
                <div className="auth-form-card">
                  <Form method="post" onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <input type="hidden" name="form_type" value="login" />

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                        Username or email address <span style={{ color: "#e2401c" }}>*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="username"
                        autoComplete="username"
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          border: "1px solid #ccc",
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
                          id="password"
                          autoComplete="current-password"
                          required
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            paddingRight: "2.5rem",
                            border: "1px solid #ccc",
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

                    <div id="recaptcha-login" style={{ marginTop: "0.5rem" }}></div>

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
                      onClick={handleGoogleLogin}
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

              {/* Register Form */}
              <div>
                <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1.5rem", fontFamily: "var(--font-sans)" }}>Register</h2>
                <div className="auth-form-card">
                  <Form method="post" onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <input type="hidden" name="form_type" value="register" />

                    <div className="register-names-grid">
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                          First Name <span style={{ color: "#e2401c" }}>*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          id="reg_firstName"
                          autoComplete="given-name"
                          required
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            border: "1px solid #ccc",
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
                          id="reg_lastName"
                          autoComplete="family-name"
                          required
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            border: "1px solid #ccc",
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
                        id="reg_email"
                        autoComplete="off"
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          border: "1px solid #ccc",
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
                          id="reg_password"
                          autoComplete="new-password"
                          value={registerPassword}
                          onChange={e => setRegisterPassword(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            paddingRight: "2.5rem",
                            border: "1px solid #ccc",
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
                      {registerPassword && (
                        <>
                          <div style={{
                            backgroundColor: getPasswordStrength(registerPassword).color,
                            color: "#000000",
                            padding: "8px 12px",
                            textAlign: "center",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                            marginTop: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid rgba(0,0,0,0.06)",
                            boxSizing: "border-box",
                            width: "100%"
                          }}>
                            Password Strength: {getPasswordStrength(registerPassword).label}
                          </div>
                          <p style={{
                            fontSize: "0.78rem",
                            color: "#666666",
                            lineHeight: "1.4",
                            marginTop: "0.5rem",
                            marginBottom: "0.5rem"
                          }}>
                            Hint: The password should be at least 8 characters long. To make it stronger, use upper and lower case letters, numbers, and symbols like ! " ? $ % ^ & ).
                          </p>
                        </>
                      )}
                    </div>

                    <div id="recaptcha-register" style={{ marginTop: "0.5rem" }}></div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                      <input
                        type="checkbox"
                        id="newsletter"
                        name="newsletter"
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
                      onClick={handleGoogleLogin}
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
        </div>
        {/* reCAPTCHA Error Modal Overlay */}
        {showRecaptchaError && errorMessage && (
          <div 
            onClick={() => { setShowRecaptchaError(false); setClientError(null); }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              fontFamily: "var(--font-sans)",
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                border: "2px solid #ef4444",
                borderRadius: "12px",
                padding: "2rem 3rem 2rem 2.5rem",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                position: "relative",
                maxWidth: "650px",
                width: "90%",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
              }}
            >
              {/* Warning Icon */}
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "1.2rem",
                flexShrink: 0
              }}>
                !
              </div>

              {/* Error Message */}
              <div style={{
                color: "#1e293b",
                fontSize: "1.05rem",
                fontWeight: "500",
                lineHeight: "1.5"
              }}>
                {errorMessage}
              </div>

              {/* Close Button overlapping top-right edge */}
              <button
                onClick={() => { setShowRecaptchaError(false); setClientError(null); }}
                style={{
                  position: "absolute",
                  top: "-14px",
                  right: "-14px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  outline: "none"
                }}
              >
                X
              </button>
            </div>
          </div>
        )}
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 1.5rem" }}>

          <PageHeader title="My Account" />

          {/* Account Dashboard Layout Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "2.5rem", alignItems: "start" }}>

            {/* Left WooCommerce Sidebar Menu */}
            <aside style={{ display: "flex", flexDirection: "column", width: "240px" }}>
              <button
                onClick={() => navigate("/my-account")}
                style={{
                  textAlign: "left",
                  background: "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #ffffff",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <i className="fa fa-tachometer" style={{ marginRight: "12px", width: "16px", textAlign: "center" }}></i> Dashboard
              </button>

              <button
                onClick={() => navigate("/my-account/loyalty-points")}
                style={{
                  textAlign: "left",
                  background: "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #ffffff",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <span style={{ marginRight: "12px", width: "16px", textAlign: "center", display: "inline-block" }}>🎁</span> Loyalty Points
              </button>

              <button
                onClick={() => navigate("/my-account/orders")}
                style={{
                  textAlign: "left",
                  background: "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #ffffff",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <span style={{ marginRight: "12px", width: "16px", textAlign: "center", display: "inline-block" }}>🧺</span> Orders
              </button>

              <button
                onClick={() => navigate("/my-account/saved-addresses")}
                style={{
                  textAlign: "left",
                  background: "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #ffffff",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <i className="fa fa-home" style={{ marginRight: "12px", width: "16px", textAlign: "center" }}></i> Addresses
              </button>

              <button
                onClick={() => navigate("/my-account/edit-account")}
                style={{
                  textAlign: "left",
                  background: "#1053a0",
                  color: "#ffffff",
                  border: "none",
                  borderBottom: "1px solid #ffffff",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <i className="fa fa-user" style={{ marginRight: "12px", width: "16px", textAlign: "center" }}></i> Account Details
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
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <i className="fa fa-sign-out" style={{ marginRight: "12px", width: "16px", textAlign: "center" }}></i> Log Out
              </button>
            </aside>

            {/* Right Dashboard Content */}
            <main style={{ fontFamily: "var(--font-sans)", color: "#000000", fontSize: "0.95rem", lineHeight: 1.6 }}>
              {activeTab === "dashboard" && (
                <div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    Hello <strong style={{ color: "#000000" }}>{customerName}</strong> (not <strong style={{ color: "#000000" }}>{customerName}</strong>? <Link to="/my-account?action=logout" style={{ color: "#3b82f6", textDecoration: "none" }}>Log out</Link>)
                  </div>
                  <p style={{ color: "#000000" }}>
                    From your account dashboard you can view your <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => navigate("/my-account/orders")}>recent orders</span>, manage your <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => navigate("/my-account/saved-addresses")}>shipping and billing addresses</span>, and <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => navigate("/my-account/edit-account")}>edit your password and account details</span>.
                  </p>
                  <p style={{ color: "#000000", marginTop: "1rem" }}>
                    Should you wish to close your account, you can request <Link to="/account-deletion" style={{ color: "#ef4444", textDecoration: "none", fontWeight: "bold" }}>account deletion</Link>.
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1053a0", margin: 0 }}>My Addresses</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(null);
                        setModalFirstName("");
                        setModalLastName("");
                        setModalCity("Select a City");
                        setModalZone("Select your Neighbourhood");
                        setModalStreetAddress("");
                        setModalApartmentInfo("");
                        setModalPhone("");
                        setModalIsDefault(savedAddresses.length === 0);
                        setShowAddressModal(true);
                      }}
                      style={{
                        background: "#1053a0",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "4px",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        outline: "none"
                      }}
                    >
                      + Add New Address
                    </button>
                  </div>
                  <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                    The following addresses are saved to your account and can be quickly selected during checkout.
                  </p>

                  {savedAddresses.length === 0 ? (
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "2rem", borderRadius: "6px", textAlign: "center", color: "#64748b" }}>
                      You haven't saved any addresses yet. Click "+ Add New Address" above to save your first address.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                      {savedAddresses.map(addr => (
                        <div
                          key={addr.id}
                          style={{
                            border: addr.is_default ? "2px solid #1053a0" : "1px solid #e2e8f0",
                            padding: "1.25rem",
                            borderRadius: "6px",
                            background: "#ffffff",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <span style={{ color: "#0f172a", fontWeight: 600, fontSize: "0.95rem" }}>
                                {addr.first_name} {addr.last_name}
                              </span>
                              {addr.is_default && (
                                <span style={{
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  padding: "2px 6px",
                                  borderRadius: "99px"
                                }}>
                                  Default
                                </span>
                              )}
                            </div>
                            <address style={{ fontStyle: "normal", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.85rem" }}>
                              <span>{addr.street_address}{addr.apartment_info ? `, ${addr.apartment_info}` : ""}</span>
                              <span>{addr.neighbourhood}, {addr.city}</span>
                              <span>Kenya</span>
                              <span style={{ marginTop: "0.4rem", color: "#334155" }}>Phone: {addr.phone}</span>
                            </address>
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                            {!addr.is_default && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#1053a0",
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                  padding: 0,
                                  fontWeight: 600
                                }}
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#475569",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                padding: 0,
                                fontWeight: 600,
                                marginLeft: addr.is_default ? "0" : "auto"
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                padding: 0,
                                fontWeight: 600,
                                marginLeft: addr.is_default ? "auto" : "0"
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div style={{ maxWidth: "700px" }}>
                  {/* Social accounts Section */}
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1rem", fontFamily: "var(--font-sans)" }}>
                    Social accounts
                  </h2>

                  <div style={{ marginBottom: "2rem" }}>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      style={{
                        background: "#000000",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "0.65rem 1.25rem",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px"
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Unlink account from <strong>Google</strong>
                    </button>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", marginBottom: "2rem" }} />

                  {actionData?.message && (
                    <div style={{ padding: "0.75rem 1rem", background: "#dcfce7", color: "#166534", borderRadius: "6px", marginBottom: "1.25rem", fontSize: "0.9rem", fontWeight: 500 }}>
                      {actionData.message}
                    </div>
                  )}
                  {actionData?.error && (
                    <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "1.25rem", fontSize: "0.9rem", fontWeight: 500 }}>
                      {actionData.error}
                    </div>
                  )}

                  <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <input type="hidden" name="form_type" value="update_account" />
                    <input type="hidden" name="currentEmail" value={customerEmail} />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                          First name <span style={{ color: "#e2401c" }}>*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          defaultValue={customerName.split(" ")[0] || ""}
                          required
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            border: "1px solid #7e9bbd",
                            borderRadius: "4px",
                            outline: "none",
                            fontSize: "0.95rem"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                          Last name <span style={{ color: "#e2401c" }}>*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          defaultValue={customerName.split(" ").slice(1).join(" ") || ""}
                          required
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            border: "1px solid #7e9bbd",
                            borderRadius: "4px",
                            outline: "none",
                            fontSize: "0.95rem"
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                        Display name <span style={{ color: "#e2401c" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        defaultValue={customerName}
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          border: "1px solid #7e9bbd",
                          borderRadius: "4px",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                      <span style={{ fontSize: "0.8rem", color: "#555555", fontStyle: "italic", display: "block", marginTop: "0.35rem" }}>
                        This will be how your name will be displayed in the account section and in reviews
                      </span>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                        Email address <span style={{ color: "#e2401c" }}>*</span>
                      </label>
                      <div style={{ fontSize: "0.95rem", color: "#1a1a1a", padding: "0.25rem 0", fontWeight: 500 }}>
                        {customerEmail}
                      </div>
                      <input type="hidden" name="email" value={customerEmail} />
                      <span style={{ fontSize: "0.8rem", color: "#555555", fontStyle: "italic", display: "block", marginTop: "0.25rem" }}>
                        Due to security concerns, email address changes have to be handled directly by our{" "}
                        <a href="/contact" style={{ color: "#3b82f6", textDecoration: "underline" }}>support team</a>
                      </span>
                    </div>

                    {/* Password change Section */}
                    <div style={{ marginTop: "1rem" }}>
                      <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "1rem", fontFamily: "var(--font-sans)" }}>
                        Password change
                      </h3>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                            Current password (leave blank to leave unchanged)
                          </label>
                          <div style={{ position: "relative", width: "100%" }}>
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              name="currentPassword"
                              style={{
                                width: "100%",
                                padding: "0.55rem 0.75rem",
                                paddingRight: "2.5rem",
                                border: "1px solid #7e9bbd",
                                borderRadius: "4px",
                                outline: "none",
                                fontSize: "0.95rem"
                              }}
                            />
                            <span
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#777777"
                              }}
                            >
                              <i className={showCurrentPassword ? "fa fa-eye-slash" : "fa fa-eye"} style={{ fontSize: "16px" }}></i>
                            </span>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                            New password (leave blank to leave unchanged)
                          </label>
                          <div style={{ position: "relative", width: "100%" }}>
                            <input
                              type={showNewPassword ? "text" : "password"}
                              name="newPassword"
                              style={{
                                width: "100%",
                                padding: "0.55rem 0.75rem",
                                paddingRight: "2.5rem",
                                border: "1px solid #7e9bbd",
                                borderRadius: "4px",
                                outline: "none",
                                fontSize: "0.95rem"
                              }}
                            />
                            <span
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#777777"
                              }}
                            >
                              <i className={showNewPassword ? "fa fa-eye-slash" : "fa fa-eye"} style={{ fontSize: "16px" }}></i>
                            </span>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem" }}>
                            Confirm new password
                          </label>
                          <div style={{ position: "relative", width: "100%" }}>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              style={{
                                width: "100%",
                                padding: "0.55rem 0.75rem",
                                paddingRight: "2.5rem",
                                border: "1px solid #7e9bbd",
                                borderRadius: "4px",
                                outline: "none",
                                fontSize: "0.95rem"
                              }}
                            />
                            <span
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#777777"
                              }}
                            >
                              <i className={showConfirmPassword ? "fa fa-eye-slash" : "fa fa-eye"} style={{ fontSize: "16px" }}></i>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KRA PIN Section */}
                    <div style={{ marginTop: "1rem" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#1a1a1a", marginBottom: "0.4rem", fontWeight: 700 }}>
                        KRA PIN
                      </label>
                      <input
                        type="text"
                        name="kraPin"
                        defaultValue={kraPin}
                        placeholder="E.G. A123456789B"
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          border: "1px solid #7e9bbd",
                          borderRadius: "4px",
                          outline: "none",
                          fontSize: "0.95rem"
                        }}
                      />
                      <span style={{ fontSize: "0.8rem", color: "#555555", fontStyle: "italic", display: "block", marginTop: "0.35rem" }}>
                        Optional. Save this for business expense records.
                      </span>
                    </div>

                    <button
                      type="submit"
                      style={{
                        background: "#ece9e2",
                        color: "#1a1a1a",
                        border: "1px solid #dcdcdc",
                        borderRadius: "4px",
                        padding: "0.6rem 1.25rem",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                        marginTop: "1rem"
                      }}
                    >
                      SAVE CHANGES
                    </button>
                  </Form>
                </div>
              )}
            </main>

          </div>

        </div>
      </div>
      {showAddressModal && (
        <div
          className="address-modal-overlay"
          onClick={() => setShowAddressModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            backdropFilter: "blur(4px)",
            fontFamily: "var(--font-sans)"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px"
            }}>
              <h3 style={{
                margin: 0,
                fontSize: "1.3rem",
                color: "#1053a0",
                fontWeight: "bold"
              }}>
                {editingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#6b7280",
                  cursor: "pointer",
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddress} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {/* Form fields: First / Last Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>FIRST NAME *</label>
                  <input
                    type="text"
                    required
                    value={modalFirstName}
                    onChange={e => setModalFirstName(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", marginTop: "0.25rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>LAST NAME *</label>
                  <input
                    type="text"
                    required
                    value={modalLastName}
                    onChange={e => setModalLastName(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", marginTop: "0.25rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* City and Neighbourhood */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>CITY/COUNTY *</label>
                  <select
                    required
                    value={modalCity}
                    onChange={e => {
                      setModalCity(e.target.value);
                      setModalZone("Select your Neighbourhood");
                      setModalZoneSearch("");
                    }}
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", marginTop: "0.25rem", boxSizing: "border-box" }}
                  >
                    <option value="Select a City">Select a City</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>NEIGHBOURHOOD *</label>
                  <div className="modal-zone-dropdown-container" style={{ position: "relative", marginTop: "0.25rem" }}>
                    <div
                      onClick={() => setShowModalZoneDropdown(!showModalZoneDropdown)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        boxSizing: "border-box",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        background: "#ffffff",
                        userSelect: "none"
                      }}
                    >
                      <span>{modalZone}</span>
                      <span style={{ fontSize: "0.7rem", color: "#1053a0" }}>{showModalZoneDropdown ? "▲" : "▼"}</span>
                    </div>

                    {showModalZoneDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "4px",
                          marginTop: "4px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          zIndex: 1000,
                          maxHeight: "200px",
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        {/* Search Input */}
                        {modalCity && SHIPPING_ZONES[modalCity] && Object.keys(SHIPPING_ZONES[modalCity]).length > 5 && (
                          <div style={{ padding: "6px", borderBottom: "1px solid #f0f0f0" }}>
                            <input
                              type="text"
                              placeholder="Search neighborhood..."
                              value={modalZoneSearch}
                              onChange={(e) => setModalZoneSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "100%",
                                padding: "6px 10px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "4px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box"
                              }}
                            />
                          </div>
                        )}

                        {/* Options List */}
                        <div style={{ overflowY: "auto", flex: 1 }}>
                          {(() => {
                            const zones = modalCity && SHIPPING_ZONES[modalCity]
                              ? Object.keys(SHIPPING_ZONES[modalCity])
                              : ["Select your Neighbourhood"];

                            const filtered = zones.filter(zone =>
                              zone.toLowerCase().includes(modalZoneSearch.toLowerCase())
                            );

                            if (filtered.length === 0) {
                              return (
                                <div style={{ padding: "10px", fontSize: "13px", color: "#888", textAlign: "center" }}>
                                  No match found
                                </div>
                              );
                            }

                            return filtered.map(zone => {
                              const isSelected = zone === modalZone;
                              return (
                                <div
                                  key={zone}
                                  onClick={() => {
                                    setModalZone(zone);
                                    setShowModalZoneDropdown(false);
                                    setModalZoneSearch("");
                                  }}
                                  style={{
                                    padding: "0.65rem 1rem",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    background: isSelected ? "#f4f8fa" : "#ffffff",
                                    color: isSelected ? "#1053a0" : "#444",
                                    fontWeight: isSelected ? "bold" : "normal",
                                    transition: "background 0.2s"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (zone !== modalZone) e.currentTarget.style.background = "#f7fafc";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (zone !== modalZone) e.currentTarget.style.background = "#ffffff";
                                  }}
                                >
                                  {zone}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>STREET ADDRESS *</label>
                <input
                  type="text"
                  required
                  placeholder="House number & street name"
                  value={modalStreetAddress}
                  onChange={e => setModalStreetAddress(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>

              {/* Apartment Details */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>APARTMENT, SUITE, UNIT ETC. (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, unit etc."
                  value={modalApartmentInfo}
                  onChange={e => setModalApartmentInfo(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>PHONE *</label>
                <input
                  type="tel"
                  required
                  placeholder="+254 000 000 000"
                  value={modalPhone}
                  onChange={e => setModalPhone(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "4px", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>

              {/* Default checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="modal_default"
                  checked={modalIsDefault}
                  onChange={e => setModalIsDefault(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor="modal_default" style={{ fontSize: "0.85rem", color: "#333", cursor: "pointer", userSelect: "none" }}>
                  Set as default address
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  style={{
                    padding: "0.6rem 1.5rem",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#374151"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.6rem 2rem",
                    borderRadius: "4px",
                    border: "none",
                    background: "#1053a0",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
