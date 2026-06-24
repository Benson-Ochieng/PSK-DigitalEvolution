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

  const isDbError =
    stack?.includes("ECONNREFUSED") ||
    details?.includes("ECONNREFUSED") ||
    stack?.includes("5433") ||
    details?.includes("5433") ||
    stack?.includes("pg-pool") ||
    details?.includes("pg-pool");

  if (isDbError) {
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
          border: "1px solid rgba(255, 77, 98, 0.15)",
          borderRadius: "12px",
          padding: "2.5rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "2rem" }}>🔌</span>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#ff4d62", margin: 0 }}>
              PostgreSQL Database Offline
            </h1>
          </div>
          
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: "1.6", marginBottom: "1.75rem" }}>
            The storefront is unable to connect to the local PostgreSQL database server on port <strong>5433</strong>. This happens because the database container is stopped.
          </p>

          <div style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            padding: "1.25rem",
            marginBottom: "1.75rem"
          }}>
            <h2 style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginTop: 0, marginBottom: "0.75rem" }}>
              How to Resolve
            </h2>
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
