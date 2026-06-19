import { data, redirect, Form, useActionData } from "react-router";
import type { Route } from "./+types/admin.login";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Admin Login — Pet Food Bag" }];
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
      background: "#0a0a0a",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-mono)",
      padding: "1rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: "#121212",
        border: "3px solid #C8102E", // Kenya flag red accent
        padding: "2.5rem 2rem",
        boxShadow: "10px 10px 0px #1A1A1A"
      }}>
        {/* Flag strip */}
        <div style={{ display: "flex", height: "6px", margin: "-2.5rem -2rem 2rem", borderBottom: "2px solid #000" }}>
          <div style={{ flex: 1, background: "#1A1A1A" }} />
          <div style={{ flex: 1, background: "#C8102E" }} />
          <div style={{ flex: 1, background: "#006600" }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "2.5rem" }}>🔒</span>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.5rem", letterSpacing: "-0.03em" }}>
            PET FOOD BAG
          </h1>
          <div style={{ fontSize: "0.65rem", color: "#666", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.25rem" }}>
            Staff Access Portal
          </div>
        </div>

        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="pin" style={{ display: "block", fontSize: "0.7rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
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
                background: "#1a1a1a",
                border: "2px solid #333",
                color: "#fff",
                fontSize: "1.25rem",
                textAlign: "center",
                letterSpacing: "0.5em",
                fontFamily: "monospace",
                outline: "none",
                borderRadius: 0,
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#C8102E"}
              onBlur={(e) => e.target.style.borderColor = "#333"}
            />
          </div>

          {actionData?.error && (
            <div style={{
              background: "rgba(200, 16, 46, 0.1)",
              border: "1px solid #C8102E",
              color: "#f87171",
              fontSize: "0.75rem",
              padding: "0.75rem",
              textAlign: "center"
            }}>
              ⚠️ {actionData.error}
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "#C8102E",
              color: "#fff",
              border: "2px solid #000",
              padding: "0.85rem",
              fontWeight: 700,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "transform 0.1s, box-shadow 0.1s"
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translate(2px, 2px)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "none";
            }}
          >
            Authenticate →
          </button>
        </Form>
      </div>
    </div>
  );
}
