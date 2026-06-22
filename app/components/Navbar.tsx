import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/cart";

// Custom Animal Icons for the Dropdown circles
function CatSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5c.67 0 1.35.09 2 .26L18.5 2 18 7.5c1.6 1.45 2.5 3.5 2.5 5.5a8.5 8.5 0 0 1-17 0c0-2 1-4.05 2.5-5.5L5.5 2l4.5 3.26c.65-.17 1.33-.26 2-.26Z" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <path d="M12 15v-1" />
    </svg>
  );
}

function DogSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172a3 3 0 0 0-3 3v2.828c0 .53.21 1.04.586 1.414l5.656 5.656a3 3 0 0 0 4.243 0L19 16.828a3 3 0 0 0 0-4.242L13.343 6.93a3 3 0 0 0-1.414-.586h-.586Z" />
      <path d="M16 16v1a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1" />
      <circle cx="11" cy="9.5" r="1" fill="currentColor" />
      <circle cx="14" cy="9.5" r="1" fill="currentColor" />
      <path d="M8 13.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function BirdSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 12a4 4 0 0 0-1-2.9L17 7.5l-3-1.5-1.5 3A4 4 0 0 0 9.6 10H4v2h2v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-4z" />
      <circle cx="13" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

function RabbitSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      <path d="M18 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      <path d="M7 10V4a2 2 0 0 1 4 0v6" />
      <path d="M13 10V4a2 2 0 0 1 4 0v6" />
      <path d="M12 20a6 6 0 0 1-6-6v-1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a6 6 0 0 1-6 6Z" />
    </svg>
  );
}

const BRANDS_LIST = [
  { name: "Proline", query: "Proline", className: "brand-proline" },
  { name: "Reflex", query: "Reflex", className: "brand-reflex" },
  { name: "SPECTRUM", query: "SPECTRUM", className: "brand-spectrum" },
  { name: "TRENDLINE", query: "TRENDLINE", className: "brand-trendline" },
  { name: "Josera", query: "Josera", className: "brand-josera" },
  { name: "Bonnie", query: "Bonnie", className: "brand-bonnie" },
  { name: "KING", query: "KING", className: "brand-king" },
  { name: "UNIQUE", query: "UNIQUE", className: "brand-unique" },
  { name: "MORANDO", query: "MORANDO", className: "brand-morando" },
  { name: "ROYAL CANIN", query: "Royal Canin", className: "brand-royal-canin" },
  { name: "Montego", query: "Montego", className: "brand-montego" },
  { name: "Thunder", query: "Thunder", className: "brand-thunder" }
];

export default function Navbar() {
  const { count, setIsCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<{
    suggestions: string[];
    groups: string[];
    products: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestion overlay
  useEffect(() => {
    if (!searchVal.trim()) {
      setSearchResults(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchVal)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Failed to fetch autocomplete suggestions", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  // Click outside listener for suggestions panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchVal.trim())}`);
      setIsSearchFocused(false);
    } else {
      navigate("/shop");
    }
  }

  // Highlight matches in the query string
  function highlightText(text: string, search: string) {
    if (!search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <strong key={i} style={{ color: "var(--primary)", fontWeight: 700 }}>{part}</strong> : part
        )}
      </span>
    );
  }

  return (
    <>
      {/* Top Announcement Banner */}
      <div className="top-promo-banner">
        <Link to="/shop">
          <img 
            src="/images/petstore-new-arrival-banner.gif" 
            alt="Take me to the new page - Click Here" 
            loading="eager"
          />
        </Link>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          
          {/* Far Left: Hamburger Menu and White Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <button className="navbar-hamburger-btn" onClick={() => setIsMenuOpen(true)} title="Menu" aria-label="Toggle navigation">
              <i className="fa fa-bars"></i>
            </button>

            <Link to="/" className="navbar-logo-white">
              <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" />
            </Link>
          </div>

          {/* Links with Dropdowns on Hover */}
          <ul className="navbar-links" style={{ marginRight: "auto", marginLeft: "1rem" }}>
            <li className="nav-item-dropdown">
              <span className="nav-link dropdown-toggle">
                Shop By Pet <i className="fa fa-chevron-down toggle-arrow"></i>
              </span>
              <ul className="dropdown-menu pet-dropdown">
                <li>
                  <Link to="/shop?animal=cat" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <CatSvg />
                    </span>
                    <span>Cat</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=cat&food=kitten" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <CatSvg />
                    </span>
                    <span>Kitten</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=dog" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <DogSvg />
                    </span>
                    <span>Dog</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=dog&food=puppy" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <DogSvg />
                    </span>
                    <span>Puppy</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=bird" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <BirdSvg />
                    </span>
                    <span>Bird</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=rabbit" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <RabbitSvg />
                    </span>
                    <span>Rabbit</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item-dropdown mega-dropdown-container">
              <span className="nav-link dropdown-toggle">
                Shop By Brands <i className="fa fa-chevron-down toggle-arrow"></i>
              </span>
              <div className="mega-dropdown-menu brand-mega-menu">
                <div className="brand-grid">
                  {BRANDS_LIST.map((brand) => (
                    <Link 
                      key={brand.name} 
                      to={`/shop?brand=${encodeURIComponent(brand.query)}`} 
                      className="brand-card"
                    >
                      <span className={`brand-logo-text ${brand.className}`}>
                        {brand.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </li>

            <li>
              <Link to="/shop?type=offer" className="nav-link">
                Offers
              </Link>
            </li>
            <li>
              <Link to="/shop" className="nav-link">
                New Arrivals
              </Link>
            </li>
          </ul>

          {/* Center: Search Bar with Autocomplete Suggestions Dropdown */}
          <div ref={searchRef} className="nav-search-form" style={{ position: "relative" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", width: "100%" }}>
              <input
                type="text"
                placeholder="Search for products, brands or categories..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="nav-search-input"
              />
              <button type="submit" className="nav-search-btn" title="Search">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>

            {/* Suggestions Dropdown Container */}
            {isSearchFocused && searchVal.trim() !== "" && (
              <div className="search-suggestions-dropdown">
                {/* Left side: Product Results list */}
                <div className="search-dropdown-left">
                  <div className="search-section-title">Products</div>
                  
                  {isSearching ? (
                    <div style={{ padding: "1rem", color: "var(--ink-light)", fontSize: "0.85rem" }}>
                      Searching...
                    </div>
                  ) : searchResults && searchResults.products.length > 0 ? (
                    searchResults.products.map((p) => {
                      const oldPrice = Math.round(p.price * 1.2);
                      const displayBreadcrumb = ["Clearance", p.animal_type, p.brand]
                        .filter(Boolean)
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(", ");
                      return (
                        <Link 
                          key={p.id}
                          to={`/shop/${p.id}`}
                          className="search-product-item"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setSearchVal("");
                          }}
                        >
                          <img src={p.image_url} alt={p.name} className="search-product-img" />
                          <div className="search-product-info">
                            <div className="search-product-name">
                              {highlightText(p.name, searchVal)}
                            </div>
                            <div className="search-product-breadcrumb">
                              {displayBreadcrumb}
                            </div>
                            <div className="search-product-price">
                              <span className="search-price-sale">KES {p.price.toLocaleString()}</span>
                              <span className="search-price-old">KES {oldPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="search-no-results">No products found matching &ldquo;{searchVal}&rdquo;</div>
                  )}

                  {searchResults && searchResults.products.length > 0 && (
                    <div className="search-view-all">
                      <button 
                        type="button"
                        className="search-view-all-btn" 
                        onClick={() => {
                          navigate(`/shop?q=${encodeURIComponent(searchVal)}`);
                          setIsSearchFocused(false);
                        }}
                      >
                        View all search results &rarr;
                      </button>
                    </div>
                  )}
                </div>

                {/* Right side: Autocomplete Suggestions & Group Categorizations */}
                <div className="search-dropdown-right">
                  <div className="search-section-title">Suggestions</div>
                  {searchResults && searchResults.suggestions.length > 0 ? (
                    searchResults.suggestions.map((suggestion, index) => (
                      <button
                        type="button"
                        key={index}
                        className="search-suggestion-item"
                        onClick={() => {
                          setSearchVal(suggestion);
                          navigate(`/shop?q=${encodeURIComponent(suggestion)}`);
                          setIsSearchFocused(false);
                        }}
                        style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}
                      >
                        {highlightText(suggestion, searchVal)}
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: "0.5rem 0.6rem", color: "var(--ink-light)", fontSize: "0.8rem" }}>
                      No suggestions
                    </div>
                  )}

                  <div className="search-section-title" style={{ marginTop: "1.5rem" }}>Groups</div>
                  {searchResults && searchResults.groups.length > 0 ? (
                    searchResults.groups.map((group, index) => {
                      const name = group.split(" ")[0];
                      const countStr = group.split("(")[1]?.replace(")", "") || "";
                      return (
                        <button
                          type="button"
                          key={index}
                          className="search-group-item"
                          onClick={() => {
                            navigate(`/shop?q=${encodeURIComponent(name.toLowerCase())}`);
                            setIsSearchFocused(false);
                          }}
                          style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}
                        >
                          <span>{name}</span>
                          <span style={{ color: "var(--ink-light)", marginLeft: "auto" }}>({countStr})</span>
                        </button>
                      );
                    })
                  ) : (
                    <div style={{ padding: "0.5rem 0.6rem", color: "var(--ink-light)", fontSize: "0.8rem" }}>
                      No groups
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons: My Account & Cart */}
          <div className="navbar-actions">
            <Link to="/admin/login" className="account-nav-btn" title="My Account">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>

            <button className="cart-nav-btn" onClick={() => setIsCartOpen(true)} title="Shopping Cart">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {count > 0 && <span className="cart-count-badge" suppressHydrationWarning>{count}</span>}
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
