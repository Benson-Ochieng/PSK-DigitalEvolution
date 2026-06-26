import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { CartProvider } from "./context/cart";
import { CartDrawer, CheckoutModal } from "./components/CheckoutModal";
import CommunicationBooth from "./components/CommunicationBooth";

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    type: "image/png",
    href: "/images/cropped-petstore-kenya-favicon-512x512-blue-background-192x192.png",
  },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Patrick+Hand&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Outlet />
      <CartDrawer />
      <CheckoutModal />
      <CommunicationBooth />
    </CartProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  } else if (error && typeof error === "object") {
    const errObj = error as any;
    details = errObj.message || JSON.stringify(error);
    stack = errObj.stack;
  }

  // Determine if it is a database connection error
  const isDbError =
    stack?.includes("ECONNREFUSED") ||
    details?.includes("ECONNREFUSED") ||
    stack?.includes("5433") ||
    details?.includes("5433") ||
    stack?.includes("6543") ||
    details?.includes("6543") ||
    stack?.includes("pg-pool") ||
    details?.includes("pg-pool") ||
    stack?.includes("connection timeout exceeded");

  if (isDbError) {
    let dbHost = "";
    let dbPort = "";
    
    // Parse connection details if present in the error stack or details
    const connRegex = /connect E[A-Z]+\s+([^:\s]+):(\d+)/i;
    const match = (stack || "").match(connRegex) || (details || "").match(connRegex);
    if (match) {
      dbHost = match[1];
      dbPort = match[2];
    } else {
      if (stack?.includes("supabase") || details?.includes("supabase")) {
        dbHost = "aws-0-eu-west-1.pooler.supabase.com";
        dbPort = "6543";
      } else {
        dbHost = "localhost";
        dbPort = "5433";
      }
    }

    const isLocalDb =
      dbHost === "localhost" ||
      dbHost === "127.0.0.1" ||
      dbHost === "host.docker.internal" ||
      dbHost === "::1" ||
      dbHost === "db" ||
      dbHost === "postgres";

    return (
      <main style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090e",
        color: "#f3f4f6",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: "2rem"
      }}>
        <div style={{
          maxWidth: "600px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.02)",
          border: isLocalDb ? "1px solid rgba(255, 77, 98, 0.15)" : "1px solid rgba(251, 142, 40, 0.15)",
          borderRadius: "12px",
          padding: "2.5rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "2rem" }}>{isLocalDb ? "🔌" : "☁️"}</span>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: isLocalDb ? "#ff4d62" : "#fb8e28", margin: 0 }}>
              {isLocalDb ? "PostgreSQL Database Offline" : "Cloud Database Connection Error"}
            </h1>
          </div>
          
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: "1.6", marginBottom: "1.75rem" }}>
            {isLocalDb ? (
              <>
                The storefront is unable to connect to the local PostgreSQL database server on port <strong>{dbPort || "5433"}</strong>. This happens because the database container is stopped.
              </>
            ) : (
              <>
                The storefront failed to connect to your hosted Supabase database at <strong>{dbHost}</strong> on port <strong>{dbPort || "6543"}</strong>.
              </>
            )}
          </p>

          <div style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            padding: "1.25rem",
            marginBottom: "1.75rem"
          }}>
            <h2 style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginTop: 0, marginBottom: "0.75rem" }}>
              {isLocalDb ? "How to Resolve" : "Possible Causes & Solutions"}
            </h2>
            {isLocalDb ? (
              <ol style={{ fontSize: "13px", paddingLeft: "1.25rem", margin: 0, color: "rgba(255,255,255,0.85)", lineHeight: "1.7" }}>
                <li style={{ marginBottom: "0.5rem" }}>
                  Make sure <strong>Docker Desktop</strong> (or your Docker daemon) is active and running on your system.
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Open a new terminal window in this project's root folder.
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Start the local database container by running:
                  <code style={{
                    display: "block",
                    background: "rgba(255, 77, 98, 0.1)",
                    border: "1px solid rgba(255, 77, 98, 0.2)",
                    color: "#ff4d62",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    marginTop: "6px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px"
                  }}>
                    docker compose up -d
                  </code>
                </li>
                <li>
                  Refresh this browser page to re-establish the connection.
                </li>
              </ol>
            ) : (
              <ul style={{ fontSize: "13px", paddingLeft: "1.25rem", margin: 0, color: "rgba(255,255,255,0.85)", lineHeight: "1.7" }}>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Network Fluctuation:</strong> Your internet connection may have briefly dropped. Click <strong>Retry Connection</strong> below.
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Connection Pool Exhaustion:</strong> If multiple development servers or clients are active, Supabase's transaction pool limits may have been reached.
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Database Paused:</strong> Free-tier Supabase databases pause automatically after inactivity. Verify the status on your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: "#fb8e28", textDecoration: "underline" }}>Supabase Dashboard</a>.
                </li>
              </ul>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "1.75rem" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: isLocalDb ? "#ff4d62" : "#fb8e28",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.6rem 1.2rem",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              Retry Connection
            </button>
          </div>

          <details style={{ cursor: "pointer" }}>
            <summary style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", outline: "none", fontWeight: "600" }}>
              View Technical Diagnostic Log
            </summary>
            <pre style={{
              whiteSpace: "pre-wrap",
              background: "#050508",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              borderRadius: "6px",
              padding: "1rem",
              marginTop: "0.75rem",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255, 255, 255, 0.55)",
              maxHeight: "200px",
              overflowY: "auto"
            }}>{stack || details}</pre>
          </details>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "3rem", fontFamily: "monospace" }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && <pre style={{ whiteSpace: "pre-wrap", marginTop: "1rem", fontSize: "0.8rem" }}>{stack}</pre>}
    </main>
  );
}
