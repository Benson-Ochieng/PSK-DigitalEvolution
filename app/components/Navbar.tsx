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
  { name: "Proline", query: "Proline", image: "/images/brands/Proline_Logo-300x105.png.webp" },
  { name: "Reflex", query: "Reflex", image: "/images/brands/Reflex_logo_plain-300x180.png.webp" },
  { name: "SPECTRUM", query: "SPECTRUM", image: "/images/brands/Spectrum_Logo.png.webp" },
  { name: "TRENDLINE", query: "TRENDLINE", image: "/images/brands/Trendline-logo-300x75.jpg.webp" },
  { name: "Josera", query: "Josera", image: "/images/brands/Josera_logo1.png.webp" },
  { name: "Bonnie", query: "Bonnie", image: "/images/brands/Bonnie_Logo-300x102.png.webp" },
  { name: "KING", query: "KING", image: "/images/brands/King-Logo-1080x1080.png.webp" },
  { name: "UNIQUE", query: "UNIQUE", image: "/images/brands/Unique-Logo.png.webp" },
  { name: "MORANDO", query: "MORANDO", image: "/images/brands/logo-morando.png.webp" },
  { name: "ROYAL CANIN", query: "Royal Canin", image: "/images/brands/Royal-Canin-Logo.svg_.png.webp" },
  { name: "Montego", query: "Montego", image: "/images/brands/Montego_White_Logo.png.webp" },
  { name: "Thunder", query: "Thunder", image: "/images/brands/thunder_logo.png.webp" }
];

const DRAWER_MENU_ITEMS = [
  { name: "New Arrivals", path: "/shop" },
  {
    name: "Cat",
    path: "/shop?animal=cat",
    subItems: [
      {
        name: "Cat Food & Treats",
        path: "/shop?animal=cat&type=food",
        subItems: [
          { name: "Dry Cat Food", path: "/shop?animal=cat&type=food&sub=dry" },
          { name: "Wet Cat Food", path: "/shop?animal=cat&type=food&sub=wet" },
          { name: "Cat Treats & Catnip", path: "/shop?animal=cat&type=treats" },
          { name: "Milk Replacers", path: "/shop?animal=cat&type=food&sub=milk" },
          { name: "Kitten Food", path: "/shop?animal=cat&food=kitten" }
        ]
      },
      {
        name: "Cat Litter & Litter Boxes",
        path: "/shop?animal=cat&type=litter",
        subItems: [
          { name: "Cat Litter", path: "/shop?animal=cat&type=litter" },
          { name: "Litter Boxes & Scoops", path: "/shop?animal=cat&type=litter-accessories" }
        ]
      },
      {
        name: "Flea, Tick & Worm Treatment",
        path: "/shop?animal=cat&type=treatment",
        subItems: [
          { name: "Dewormers", path: "/shop?animal=cat&type=treatment&sub=dewormer" },
          { name: "Flea & Tick Sprays, Collars", path: "/shop?animal=cat&type=treatment&sub=flea-tick" }
        ]
      },
      {
        name: "Health & Grooming",
        path: "/shop?animal=cat&type=grooming",
        subItems: [
          { name: "Grooming Tools", path: "/shop?animal=cat&type=grooming&sub=tools" },
          { name: "Shampoo & Deodorizers", path: "/shop?animal=cat&type=grooming&sub=shampoo" },
          { name: "Supplements & Vitamins", path: "/shop?animal=cat&type=supplements" }
        ]
      },
      {
        name: "Cat Accessories & Bowls",
        path: "/shop?animal=cat&type=accessories",
        subItems: [
          { name: "Collars, Leashes & Harnesses", path: "/shop?animal=cat&type=accessories&sub=collars" },
          { name: "Cat Toys", path: "/shop?animal=cat&type=toys" },
          { name: "Cat Bowls & Feeders", path: "/shop?animal=cat&type=bowls" },
          {
            name: "Cat Beds, Scratchers & Carriers",
            path: "/shop?animal=cat&type=beds-carriers",
            subItems: [
              { name: "Beds", path: "/shop?animal=cat&type=beds-carriers&sub=beds" },
              { name: "Carriers", path: "/shop?animal=cat&type=beds-carriers&sub=carriers" }
            ]
          }
        ]
      },
      { name: "Cat Scratchers & Trees", path: "/shop?animal=cat&type=scratchers" }
    ]
  },
  {
    name: "Dog",
    path: "/shop?animal=dog",
    subItems: [
      {
        name: "Dog Food & Treats",
        path: "/shop?animal=dog&type=food",
        subItems: [
          { name: "Dry Dog Food", path: "/shop?animal=dog&type=food&sub=dry" },
          { name: "Wet Dog Food", path: "/shop?animal=dog&type=food&sub=wet" },
          { name: "Dog Treats & Bones", path: "/shop?animal=dog&type=treats" },
          { name: "Puppy Food", path: "/shop?animal=dog&food=puppy" }
        ]
      },
      {
        name: "Flea, Tick & Worm Treatment",
        path: "/shop?animal=dog&type=treatment",
        subItems: [
          { name: "Dewormers", path: "/shop?animal=dog&type=treatment&sub=dewormer" },
          { name: "Flea & Tick Spray", path: "/shop?animal=dog&type=treatment&sub=spray" },
          { name: "Flea & Tick Collars", path: "/shop?animal=dog&type=treatment&sub=collar" },
          { name: "Flea & Tick Spot On", path: "/shop?animal=dog&type=treatment&sub=spoton" }
        ]
      },
      {
        name: "Health & Grooming",
        path: "/shop?animal=dog&type=grooming",
        subItems: [
          { name: "Grooming Tools", path: "/shop?animal=dog&type=grooming&sub=tools" },
          { name: "Shampoos & Conditioners", path: "/shop?animal=dog&type=grooming&sub=shampoo" },
          { name: "Supplements & Vitamins", path: "/shop?animal=dog&type=supplements" }
        ]
      },
      {
        name: "Dog Accessories & Collars",
        path: "/shop?animal=dog&type=accessories",
        subItems: [
          { name: "Collars, Leashes & Harnesses", path: "/shop?animal=dog&type=accessories&sub=collars" },
          { name: "Dog Toys", path: "/shop?animal=dog&type=toys" },
          { name: "Dog Bowls & Feeders", path: "/shop?animal=dog&type=bowls" },
          { name: "Dog Cages, Carriers & Crates", path: "/shop?animal=dog&type=cages" }
        ]
      },
      { name: "Dog Beds", path: "/shop?animal=dog&type=beds" },
      {
        name: "Dog Training Accessories",
        path: "/shop?animal=dog&type=training",
        subItems: [
          { name: "Pee Pads & Diapers", path: "/shop?animal=dog&type=training&sub=pads" },
          { name: "Training Leashes & Collars", path: "/shop?animal=dog&type=training&sub=leashes" },
          { name: "Training Treats", path: "/shop?animal=dog&type=training&sub=treats" }
        ]
      },
      { name: "Dog Feeders & Bowls", path: "/shop?animal=dog&type=bowls" },
      {
        name: "Dental Care",
        path: "/shop?animal=dog&type=dental",
        subItems: [
          { name: "Dental Gels, Sprays & Toothpastes", path: "/shop?animal=dog&type=dental&sub=toothpaste" }
        ]
      }
    ]
  },
  {
    name: "Bird",
    path: "/shop?animal=bird",
    subItems: [
      { name: "Bird Food & Feeds", path: "/shop?animal=bird&type=food" }
    ]
  },
  {
    name: "Fish",
    path: "/shop?animal=fish",
    subItems: [
      { name: "Fish Food & Feeds", path: "/shop?animal=fish&type=food" }
    ]
  },
  {
    name: "Our Brands",
    path: "/shop",
    subItems: [
      { name: "Royal Canin", path: "/shop?brand=Royal+Canin" },
      { name: "Reflex", path: "/shop?brand=Reflex" },
      { name: "Josera", path: "/shop?brand=Josera" },
      { name: "Spectrum", path: "/shop?brand=SPECTRUM" },
      { name: "Trendline", path: "/shop?brand=TRENDLINE" },
      { name: "Bonnie", path: "/shop?brand=Bonnie" },
      { name: "King", path: "/shop?brand=KING" },
      { name: "Unique", path: "/shop?brand=UNIQUE" },
      { name: "Morando", path: "/shop?brand=MORANDO" },
      { name: "Montego", path: "/shop?brand=Montego" },
      { name: "Thunder", path: "/shop?brand=Thunder" }
    ]
  },
  {
    name: "Offers",
    path: "/shop?type=offer",
    subItems: [
      { name: "Buy 1 Get 1 Free", path: "/shop?type=offer&sub=bogo" },
      { name: "Clearance Sale", path: "/shop?type=offer&sub=clearance" },
      { name: "Discounted Items", path: "/shop?type=offer&sub=discount" }
    ]
  },
  { name: "Human", path: "/shop?type=human" },
  { name: "Donate", path: "/shop?type=donate" },
  { name: "Gift Vouchers", path: "/shop?type=gift" },
  { name: "Food Comparison", path: "/shop?type=comparison" },
  {
    name: "Pet Avenue",
    path: "/shop?type=avenue",
    subItems: [
      { name: "Avenue Group", path: "/shop?type=avenue&sub=group" },
      { name: "Avenue Shops", path: "/shop?type=avenue&sub=shops" },
      { name: "Avenue Cart", path: "/shop?type=avenue&sub=cart" },
      { name: "Avenue Checkout", path: "/shop?type=avenue&sub=checkout" }
    ]
  },
  { name: "Blogs", path: "/blogs" },
  { name: "Brochures", path: "/brochures" },
  { name: "Reviews", path: "/reviews" },
  { name: "FAQs", path: "/faqs" },
  { name: "Shipping Rates", path: "/shipping-rates" },
  {
    name: "Locations",
    path: "/locations",
    subItems: [
      { name: "Store Locations", path: "/locations" }
    ]
  },
  { name: "My Account", path: "/admin/login" },
  { name: "Checkout", path: "/shop?type=checkout" }
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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const renderDrawerMenuItem = (item: any, depth = 0) => {
    const isExpandable = !!item.subItems && item.subItems.length > 0;
    const isExpanded = !!expandedItems[item.name];

    return (
      <li key={item.name} style={{ display: "flex", flexDirection: "column" }}>
        <div 
          className="drawer-menu-item-row" 
          style={{ 
            borderBottom: depth === 0 ? "1px solid #e2e8f0" : "none",
            background: depth > 0 ? "#ffffff" : "#f8fafc" 
          }}
        >
          <Link
            to={item.path}
            className="drawer-menu-link"
            style={{ 
              fontWeight: depth === 0 ? "700" : "500", 
              fontSize: depth === 0 ? "0.95rem" : "0.85rem",
              color: depth === 0 ? "#1e293b" : "#475569",
              paddingLeft: `${1.25 + depth * 0.75}rem`
            }}
            onClick={() => setIsMenuOpen(false)}
          >
            {item.name}
          </Link>
          {isExpandable && (
            <button
              type="button"
              className="drawer-menu-arrow-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpandedItems(prev => ({
                  ...prev,
                  [item.name]: !prev[item.name]
                }));
              }}
              aria-label={`Toggle ${item.name} sub-menu`}
            >
              <i className={`fa fa-chevron-${isExpanded ? "down" : "right"}`}></i>
            </button>
          )}
        </div>
        {isExpandable && isExpanded && (
          <ul className="drawer-menu-list">
            {item.subItems.map((subItem: any) => renderDrawerMenuItem(subItem, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

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
                      <img src="/images/icons/adultcat-icon-1.png.webp" alt="Cat Icon" className="pet-icon-img" />
                    </span>
                    <span>Cat</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=cat&food=kitten" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/kitten-icon.png.webp" alt="Kitten Icon" className="pet-icon-img" />
                    </span>
                    <span>Kitten</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=dog" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/dog-icon.png.webp" alt="Dog Icon" className="pet-icon-img" />
                    </span>
                    <span>Dog</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=dog&food=puppy" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/puppy-icon.png.webp" alt="Puppy Icon" className="pet-icon-img" />
                    </span>
                    <span>Puppy</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=bird" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/bird-icon-1.png.webp" alt="Bird Icon" className="pet-icon-img" />
                    </span>
                    <span>Bird</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop?animal=rabbit" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/rabbit-icon.png.webp" alt="Rabbit Icon" className="pet-icon-img" />
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
                  {BRANDS_LIST.map((brand) => {
                    const isScaledLogo = brand.name === "Montego" || brand.name === "Thunder";
                    return (
                      <Link
                        key={brand.name}
                        to={`/shop?brand=${encodeURIComponent(brand.query)}`}
                        className="brand-card"
                      >
                        <img
                          src={brand.image}
                          alt={`${brand.name} Logo`}
                          className="brand-card-img"
                          style={isScaledLogo ? { transform: "scale(1.5)" } : undefined}
                        />
                      </Link>
                    );
                  })}
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
            <form onSubmit={handleSearchSubmit} className="nav-search-wrapper">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search for products, brands or categories..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="nav-search-input"
                />
                {searchVal.trim() !== "" && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchVal("");
                      setSearchResults(null);
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
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
              <i className="fa fa-user" style={{ fontSize: "30px", color: "#ffffff" }}></i>
            </Link>

            <button className="cart-nav-btn" onClick={() => setIsCartOpen(true)} title="Shopping Cart">
              <i className="fa fa-shopping-cart" style={{ fontSize: "30px", color: "#ffffff" }}></i>
              {count > 0 && <span className="cart-count-badge" suppressHydrationWarning>{count}</span>}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />
          <div className="mobile-menu-drawer">
            <div className="drawer-header">
              <div className="drawer-logo">
                <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" />
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="drawer-close-btn"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <ul className="drawer-menu-list">
              {DRAWER_MENU_ITEMS.map((item) => renderDrawerMenuItem(item))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
