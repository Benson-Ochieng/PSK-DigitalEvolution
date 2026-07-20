import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useLocation,
  useNavigate,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { CartProvider } from "./context/cart";
import { CartDrawer, CheckoutModal } from "./components/CheckoutModal";
import CommunicationBooth from "./components/CommunicationBooth";
import GoogleReviewsPopup from "./components/GoogleReviewsPopup";
import PurchaseNotificationPopup from "./components/PurchaseNotificationPopup";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&family=Patrick+Hand&display=swap",
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

import { useEffect, useState, useRef } from "react";

export default function App() {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoadingState = navigation.state === "loading";
  const [isLoading, setIsLoading] = useState(false);
  const loadingStartRef = useRef<number>(0);
  const isAdminPath = location.pathname.startsWith("/store_backend");

  useEffect(() => {
    let timeoutId: any;
    const MIN_LOAD_TIME = 600; // minimum duration in ms to ensure loading state is visible

    if (isLoadingState) {
      setIsLoading(true);
      loadingStartRef.current = Date.now();
    } else {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = MIN_LOAD_TIME - elapsed;
      if (remaining > 0) {
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      } else {
        setIsLoading(false);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoadingState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!faviconLink) return;

    if (!isLoading) {
      faviconLink.href = "/images/cropped-petstore-kenya-favicon-512x512-blue-background-192x192.png";
      return;
    }

    // Animation canvas setup
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const draw = () => {
      ctx.clearRect(0, 0, 32, 32);

      // Draw the premium blue circle background matching PetStore Kenya branding
      ctx.fillStyle = "#1E5DA7";
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();

      // Rotate around the center
      ctx.save();
      ctx.translate(16, 16);
      ctx.rotate(rotation);

      // Draw 6 rotating dots with trailing opacity matching the screenshot
      const dotCount = 6;
      for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2;
        const x = Math.cos(angle) * 8.5;
        const y = Math.sin(angle) * 8.5;
        // Fade the dots sequentially
        const opacity = 0.2 + 0.8 * (i / (dotCount - 1));
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      faviconLink.href = canvas.toDataURL("image/png");
      rotation += 0.12; // animation speed

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      faviconLink.href = "/images/cropped-petstore-kenya-favicon-512x512-blue-background-192x192.png";
    };
  }, [isLoading]);

  return (
    <CartProvider>
      {isLoading && <div className="top-loader-bar" />}
      <Outlet />
      <CartDrawer />
      <CheckoutModal />
      {!isAdminPath && <CommunicationBooth />}
      {!isAdminPath && <GoogleReviewsPopup />}
      {!isAdminPath && <PurchaseNotificationPopup />}
    </CartProvider>
  );
}

function NotFoundPage() {
  const [searchVal, setSearchVal] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <div className="not-found-page-container" style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "4rem var(--page-pad) 2rem",
      fontFamily: "var(--font-sans)",
      minHeight: "450px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1170px",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        padding: "3.5rem 3rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
        border: "1px solid #f1f5f9"
      }}>
        <h1 style={{
          fontSize: "2.8rem",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "1rem",
          marginTop: 0,
          fontFamily: "'Montserrat', sans-serif"
        }}>
          Not Found
        </h1>
        
        <p style={{
          fontSize: "1.05rem",
          color: "#475569",
          marginBottom: "2.5rem",
          fontWeight: 500
        }}>
          Nothing found for the requested page. Try a search instead?
        </p>

        <form onSubmit={handleSearchSubmit} style={{
          display: "flex",
          maxWidth: "100%",
          width: "100%",
          position: "relative"
        }}>
          <input
            type="text"
            placeholder="Search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{
              width: "100%",
              padding: "1rem 3.5rem 1rem 1.25rem",
              fontSize: "1rem",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
              outline: "none",
              fontFamily: "inherit",
              color: "#334155",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
            }}
          />
          <button
            type="submit"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "3.5rem",
              background: "#000000",
              border: "none",
              borderTopRightRadius: "4px",
              borderBottomRightRadius: "4px",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333333")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#000000")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <CartProvider>
        <Navbar />
        <NotFoundPage />
        <Footer />
        <CartDrawer />
        <CheckoutModal />
      </CartProvider>
    );
  }

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
