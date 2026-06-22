import { data, redirect, Form, useActionData } from "react-router";
import type { Route } from "./+types/admin.login";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Admin Login — PetStore Kenya" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // If already logged in, redirect to dashboard
  const cookieHeader = request.headers.get("Cookie") || "";
  const pinCookie = cookieHeader.split("; ").find(row => row.startsWith("admin_pin="));
  const pin = pinCookie ? decodeURIComponent(pinCookie.split("=")[1]) : "";

  if (pin === process.env.ADMIN_PIN) {
    return redirect("/admin");
  }
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const pin = formData.get("pin")?.toString();

  if (!pin) {
    return data({ error: "PIN is required" }, { status: 400 });
  }

  if (pin !== process.env.ADMIN_PIN) {
    return data({ error: "Invalid Admin PIN" }, { status: 401 });
  }

  // Set cookie with admin_pin
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `admin_pin=${encodeURIComponent(pin)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );

  return redirect("/admin", { headers });
}

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      color: "var(--ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      padding: "1rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: "#ffffff",
        border: "1px solid var(--border-light)",
        borderRadius: "8px",
        padding: "2.5rem 2rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      }}>
        {/* Flag strip */}
        <div style={{ display: "flex", height: "6px", margin: "-2.5rem -2rem 2rem", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#000000" }} />
          <div style={{ flex: 1, background: "#C8102E" }} />
          <div style={{ flex: 1, background: "#006600" }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "2.5rem" }}>🔒</span>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.5rem", color: "var(--primary)", letterSpacing: "-0.03em" }}>
            PETSTORE KENYA
          </h1>
          <div style={{ fontSize: "0.65rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.25rem" }}>
            Staff Access Portal
          </div>
        </div>

        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="pin" style={{ display: "block", fontSize: "0.7rem", color: "var(--ink-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              Enter Admin PIN
            </label>
            <input
              type="password"
              id="pin"
              name="pin"
              placeholder="••••"
              maxLength={10}
              autoFocus
              required
              style={{
                width: "100%",
                padding: "0.85rem",
                background: "#ffffff",
                border: "1px solid var(--border-light)",
                color: "var(--ink)",
                fontSize: "1.25rem",
                textAlign: "center",
                letterSpacing: "0.5em",
                fontFamily: "monospace",
                outline: "none",
                borderRadius: "6px",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-light)"}
            />
          </div>

          {actionData?.error && (
            <div style={{
              background: "rgba(200, 16, 46, 0.05)",
              border: "1px solid #C8102E",
              color: "#C8102E",
              fontSize: "0.75rem",
              padding: "0.75rem",
              borderRadius: "6px",
              textAlign: "center"
            }}>
              ⚠️ {actionData.error}
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0.85rem",
              fontWeight: 700,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
          >
            Authenticate →
          </button>
        </Form>
      </div>
    </div>
  );
}
