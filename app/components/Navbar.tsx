import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { useCart } from "../context/cart";

export default function Navbar() {
  const { count, setIsCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate("/shop");
    }
  }

  return (
    <>
      {/* Top GIF Announcement Banner */}
      <div className="top-promo-banner">
        <Link to="/shop">
          <img 
            src="/images/petstore-new-arrival-banner.gif" 
            alt="Take me to the new page - Click Here" 
            loading="eager"
          />
        </Link>
      </div>

      {/* Flag Strip */}
      <div className="flag-strip" />

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          
          {/* Left: Logo & Menu Button */}
          <Link to="/" className="navbar-logo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" />
          </Link>

          {/* Left Navigation links */}
          <ul className="navbar-links" style={{ marginRight: "auto", marginLeft: "1rem" }}>
            <li>
              <Link to="/shop" className="nav-link">
                🐾 Shop by Brand
              </Link>
            </li>
            <li>
              <Link to="/shop?type=offer" className="nav-link">
                🎁 Offers
              </Link>
            </li>
            <li>
              <Link to="/shop" className="nav-link">
                ⭐ New Arrivals
              </Link>
            </li>
          </ul>

          {/* Center: Search Bar */}
          <form onSubmit={handleSearchSubmit} className="nav-search-form">
            <input
              type="text"
              placeholder="Search for products, brands or categories..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="nav-search-input"
            />
            <button type="submit" className="nav-search-btn" title="Search">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* Right: Actions */}
          <div className="navbar-actions">
            <Link to="/admin/login" className="account-nav-btn" title="My Account">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>

            <button className="cart-nav-btn" onClick={() => setIsCartOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.2rem" }}>
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span>Cart</span>
              {count > 0 && <span className="cart-count-badge" suppressHydrationWarning>{count}</span>}
            </button>

            <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />
          <div className="mobile-menu" style={{
            position: "fixed", top: 0, left: 0, width: "290px", height: "100vh",
            backgroundColor: "#ffffff", borderRight: "1px solid var(--border-light)",
            zIndex: 160, display: "flex", flexDirection: "column", padding: "1.5rem",
            boxShadow: "4px 0 16px rgba(0,0,0,0.1)",
            animation: "slideInLeftMenu 0.22s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <div className="navbar-logo">
                <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" style={{ height: "32px", width: "auto" }} />
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                style={{ background: "none", border: "1px solid var(--border-light)", width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{ flex: 1, padding: "0.5rem", border: "1px solid var(--border-light)", borderRadius: "4px", outline: "none" }}
              />
              <button type="submit" className="btn-primary" style={{ padding: "0.5rem 0.8rem" }}>Go</button>
            </form>

            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <li>
                <Link to="/shop" style={{ textDecoration: "none", color: "var(--ink)", fontWeight: 500, display: "block", padding: "0.5rem 0" }} onClick={() => setIsMenuOpen(false)}>
                  🐾 Shop All
                </Link>
              </li>
              <li>
                <Link to="/shop?type=offer" style={{ textDecoration: "none", color: "var(--ink)", fontWeight: 500, display: "block", padding: "0.5rem 0" }} onClick={() => setIsMenuOpen(false)}>
                  🎁 Offers & Sale
                </Link>
              </li>
              <li>
                <Link to="/admin/login" style={{ textDecoration: "none", color: "var(--ink)", fontWeight: 500, display: "block", padding: "0.5rem 0" }} onClick={() => setIsMenuOpen(false)}>
                  👤 My Account / Login
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/254795350292"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", background: "#25D366", color: "#ffffff", padding: "0.6rem", borderRadius: "4px", textAlign: "center", display: "block", fontWeight: 600, marginTop: "1rem" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  💬 WhatsApp Support
                </a>
              </li>

            </ul>
          </div>
        </>
      )}
    </>
  );
}



