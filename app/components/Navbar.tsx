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
  { name: "Miglior", query: "Miglior", image: "/images/brands/Migliorcane_logo.png" },
  { name: "ROYAL CANIN", query: "Royal Canin", image: "/images/brands/Royal-Canin-Logo.svg_.png.webp" },
  { name: "Montego", query: "Montego", image: "/images/brands/Montego_White_Logo.png.webp" },
  { name: "Thunder", query: "Thunder", image: "/images/brands/thunder_logo.png.webp" }
];

const DRAWER_MENU_ITEMS = [
  { name: "New Arrivals", path: "/product-tag/new-arrivals" },
  {
    name: "Cat",
    path: "/product-category/cat-supplies-store/",
    subItems: [
      {
        name: "Cat Food & Treats",
        path: "/product-category/cat-food-and-treats/",
        subItems: [
          { name: "Wet Cat Food", path: "/product-category/wet-cat-food/" },
          { name: "Dry Cat Food", path: "/product-category/dry-cat-food/" },
          { name: "Kitten Food", path: "/product-category/kitten-food/" },
          { name: "Cat Treats", path: "/product-category/cat-treats/" },
          { name: "Kitten Treats", path: "/product-category/kitten-treats/" }
        ]
      },
      {
        name: "Litter and Litter Box & Accessories",
        path: "/product-category/cat-litter-and-accessories/",
        subItems: [
          { name: "Cat Litter", path: "/product-category/cat-litter/" },
          { name: "Litter Boxes", path: "/product-category/cat-litter-boxes/" }
        ]
      },
      {
        name: "Cat Collars, Leashes, Harnesses",
        path: "/product-category/cat-collars-leashes-harnesses/",
        subItems: [
          { name: "Cat Collars", path: "/product-category/cat-collars/" },
          { name: "Cat Harnesses", path: "/product-category/cat-harnesses/" }
        ]
      },
      {
        name: "Cat Healthcare Supplies",
        path: "/product-category/cat-healthcare/",
        subItems: [
          { name: "Flea & Tick", path: "/product-category/cat-flea-tick/" },
          { name: "Cat Dewormers", path: "/product-category/cat-dewormers/" },
          { name: "Supplements", path: "/product-category/cat-supplements/" }
        ]
      },
      { name: "Cat Carriers, Bags & Travel", path: "/product-category/cat-carriers-travels/" },
      { name: "Cat Beds & Houses", path: "/product-category/cat-beds-houses/" },
      { name: "Cat Toys", path: "/product-category/cat-toys/" },
      {
        name: "Cat Grooming",
        path: "/product-category/cat-grooming/",
        subItems: [
          { name: "Brushes & Fur Removal Tools", path: "/product-category/brushes-fur-removal-tools/" },
          { name: "Shampoo", path: "/product-category/cat-shampoo/" }
        ]
      },
      { name: "Cat Bowls & Feeders", path: "/product-category/cat-bowls-and-feeders/" }
    ]
  },
  {
    name: "Dog",
    path: "/product-category/dog-supplies-store/",
    subItems: [
      {
        name: "Dog Food & Treats",
        path: "/product-category/dog-food-treats/",
        subItems: [
          { name: "Dog Treats", path: "/product-category/dog-treats/" },
          { name: "Dry Dog Food", path: "/product-category/dry-dog-food/" },
          { name: "Wet Dog Food", path: "/product-category/wet-dog-food/" },
          { name: "Puppy Food", path: "/product-category/puppy-food/" },
          { name: "Puppy Treats", path: "/product-category/puppy-treats/" }
        ]
      },
      {
        name: "Collars, Leashes & Harnesses",
        path: "/product-category/dog-collars-leashes-and-harnesses/",
        subItems: [
          { name: "Dog Harnesses", path: "/product-category/dog-harnesses/" },
          { name: "Dog Leashes", path: "/product-category/dog-leashes/" },
          { name: "Dog Collars", path: "/product-category/dog-collars/" },
          { name: "Dog Muzzles", path: "/product-category/dog-muzzles/" }
        ]
      },
      {
        name: "Dog Toys",
        path: "/product-category/dog-toys/",
        subItems: [
          { name: "Dog Fetch Toys", path: "/product-category/dog-fetch-toys/" },
          { name: "Chew Toys", path: "/product-category/dog-chew-toys/" },
          { name: "Rope & Tug Toys", path: "/product-category/dog-rope-tug-toys/" }
        ]
      },
      {
        name: "Dog Grooming & Cleaning",
        path: "/product-category/dog-grooming-cleaning-supplies/",
        subItems: [
          { name: "Brushes, Combs & Fur Removal Tools", path: "/product-category/brushes-combs-fur-removal-tools/" },
          { name: "Shampoo", path: "/product-category/dog-shampoo/" },
          { name: "Dental Care", path: "/product-category/dental-care/" },
          { name: "Dog Hygiene & Potty Solutions", path: "/product-category/dog-hygiene-potty-solutions/" }
        ]
      },
      {
        name: "Dog Healthcare Supplies",
        path: "/product-category/dog-healthcare-supplies/",
        subItems: [
          { name: "Flea & Tick Control", path: "/product-category/dog-flea-tick/" },
          { name: "Dog Dewormers", path: "/product-category/dog-dewormers/" },
          { name: "Supplements", path: "/product-category/dog-supplements/" }
        ]
      },
      { name: "Dog Beds & Furniture", path: "/product-category/dog-beds-furniture/" },
      {
        name: "Dog Bowls & Feeders",
        path: "/product-category/dog-bowls-feeders/",
        subItems: [
          { name: "Airtight Pet Food Storage Container", path: "/product-category/airtight-pet-food-storage-container/" }
        ]
      }
    ]
  },
  {
    name: "Bird",
    path: "/product-category/bird-supplies-store/",
    subItems: [
      { name: "Bird Food & Treats", path: "/product-category/bird-food-treats/" }
    ]
  },
  {
    name: "Fish",
    path: "/product-category/fish/"
  },
  {
    name: "Our Brands",
    path: "/our-brands",
    subItems: [
      { name: "Spectrum", path: "/shop?brand=SPECTRUM" },
      { name: "Reflex", path: "/shop?brand=Reflex" },
      { name: "Bonnie", path: "/shop?brand=Bonnie" },
      { name: "King", path: "/shop?brand=KING" },
      { name: "Proline", path: "/shop?brand=Proline" },
      { name: "Unique", path: "/shop?brand=UNIQUE" },
      { name: "Miglior", path: "/shop?brand=Miglior" },
      { name: "Royal Canin", path: "/shop?brand=Royal+Canin" },
      { name: "Josera", path: "/shop?brand=Josera" },
      { name: "Trendline", path: "/shop?brand=TRENDLINE" },
      { name: "Montego", path: "/shop?brand=Montego" },
      { name: "Thunder", path: "/shop?brand=Thunder" }
    ]
  },
  {
    name: "Offers",
    path: "/shop?type=offer",
    subItems: [
      { name: "On Sale Now", path: "/product-tag/sale/" },
      { name: "Flash Sale", path: "/flash-sale" },
      { name: "Clearance", path: "/shop?type=clearance" },
      { name: "Bulk Items", path: "/shop?type=bulk" }
    ]
  },
  { name: "Human", path: "/product-category/human/" },
  { name: "Donate", path: "https://psk-donation.vercel.app/" },
  { name: "Gift Vouchers", path: "/product-tag/gift-cards/" },
  { name: "Food Comparison", path: "/food-comparison" },
  {
    name: "Pet Avenue",
    path: "/pet-avenue",
    subItems: [
      { name: "Boarding Facilities", path: "/pet-avenue/boarding-facilities" },
      { name: "Pet Adoption", path: "/pet-avenue/pet-adoption" },
      { name: "Restaurants", path: "/pet-avenue/restaurants" },
      { name: "Veterinary Care", path: "/pet-avenue/veterinary-care" }
    ]
  },
  { name: "Blogs", path: "/blog" },
  { name: "Brochures", path: "/brochures" },
  { name: "Reviews", path: "/reviews" },
  { name: "FAQs", path: "/faq" },
  { name: "Shipping Rates", path: "/shipping-rates" },
  {
    name: "Locations",
    path: "/locations",
    subItems: [
      { name: "Retail Locations", path: "/retail-locations-nairobi-nanyuki-naivasha-nakuru-mombasa" }
    ]
  },
  { name: "My Account", path: "/my-account" },
  { name: "Contact Us", path: "/contact-us" }
];

const BANNER_SLIDES = [
  {
    desktopImage: "/images/petstore-banner.gif.webp",
    mobileImage: "/images/petstore-whatsapp-banner-mobile.gif",
    linkTo: "/shop",
    alt: "PetStore Kenya - Click Here"
  },
  {
    desktopImage: "/images/petstore-new-arrival-banner.gif",
    mobileImage: "/images/petstore-whatsapp-banner-mobile.gif",
    linkTo: "/product-tag/new-arrivals",
    alt: "New Arrivals - Click Here"
  },
  {
    desktopImage: "/images/petstore-sale-banner.gif",
    mobileImage: "/images/petstore-whatsapp-banner-mobile.gif",
    linkTo: "/product-tag/sale/",
    alt: "On Sale Now - Click Here"
  },
  {
    desktopImage: "/images/petstore-clearance-banner.gif",
    mobileImage: "/images/petstore-whatsapp-banner-mobile.gif",
    linkTo: "/shop?type=clearance",
    alt: "Clearance - Click Here"
  }
];

export default function Navbar() {
  const { count, setIsCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof document !== "undefined") {
      return document.cookie.split(";").some(row => {
        const [name, val] = row.split("=");
        return name.trim() === "customer_name" && !!val;
      });
    }
    return false;
  });
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<{
    suggestions: string[];
    groups: string[];
    products: any[];
    correctedQuery?: string | null;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const isLogged = document.cookie.split(";").some(row => {
        const [name, val] = row.split("=");
        return name.trim() === "customer_name" && !!val;
      });
      setIsLoggedIn(isLogged);
    }
  }, [location]);

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
          {item.path.startsWith("http") ? (
            <a
              href={item.path}
              className="drawer-menu-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontWeight: depth === 0 ? "700" : "500",
                fontSize: depth === 0 ? "0.95rem" : "0.85rem",
                color: depth === 0 ? "#1e293b" : "#475569",
                paddingLeft: `${1.25 + depth * 0.75}rem`
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </a>
          ) : (
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
          )}
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

  // Highlight matches in the query string (handles multiple words)
  function highlightText(text: string, search: string) {
    if (!search.trim()) return <span>{text}</span>;
    const words = search.trim().split(/\s+/).filter(Boolean).map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    if (words.length === 0) return <span>{text}</span>;
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? <strong key={i} style={{ color: "#1053a0", fontWeight: 700 }}>{part}</strong> : part
        )}
      </span>
    );
  }

  return (
    <>
      {/* Top Announcement Banner */}
      <div className="top-promo-banner">
        {BANNER_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`promo-slide ${idx === currentSlide ? "active" : ""}`}
          >
            <Link to={slide.linkTo}>
              <picture>
                <source media="(max-width: 768px)" srcSet={slide.mobileImage} />
                <img
                  src={slide.desktopImage}
                  alt={slide.alt}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </picture>
            </Link>
          </div>
        ))}
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
                Shop By Pet <i className="fa fa-caret-down toggle-arrow"></i>
              </span>
              <ul className="dropdown-menu pet-dropdown">
                <li>
                  <Link to="/product-category/cat-supplies-store/" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/adultcat-icon-1.png.webp" alt="Cat Icon" className="pet-icon-img" />
                    </span>
                    <span>Cat</span>
                  </Link>
                </li>
                <li>
                  <Link to="/product-category/kitten-food/" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/kitten-icon.png.webp" alt="Kitten Icon" className="pet-icon-img" />
                    </span>
                    <span>Kitten</span>
                  </Link>
                </li>
                <li>
                  <Link to="/product-category/dog-supplies-store/" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/dog-icon.png.webp" alt="Dog Icon" className="pet-icon-img" />
                    </span>
                    <span>Dog</span>
                  </Link>
                </li>
                <li>
                  <Link to="/product-category/puppy-food/" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/puppy-icon.png.webp" alt="Puppy Icon" className="pet-icon-img" />
                    </span>
                    <span>Puppy</span>
                  </Link>
                </li>
                <li>
                  <Link to="/product-category/bird-supplies-store/" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/bird-icon-1.png.webp" alt="Bird Icon" className="pet-icon-img" />
                    </span>
                    <span>Bird</span>
                  </Link>
                </li>
                <li>
                  <Link to="/product-category/rabbit-supplies-store/" className="dropdown-item">
                    <span className="dropdown-item-icon">
                      <img src="/images/icons/rabbit-icon.png.webp" alt="Rabbit Icon" className="pet-icon-img" />
                    </span>
                    <span>Rabbit</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item-dropdown mega-dropdown-container">
              <Link to="/our-brands" className="nav-link dropdown-toggle">
                Shop By Brands <i className="fa fa-caret-down toggle-arrow"></i>
              </Link>
              <div className="mega-dropdown-menu brand-mega-menu">
                <div className="brand-grid">
                  {BRANDS_LIST.map((brand) => {
                    let customStyle: React.CSSProperties | undefined;
                    if (brand.name === "Montego") {
                      customStyle = { transform: "scale(2.2)" };
                    } else if (brand.name === "Thunder") {
                      customStyle = { transform: "scale(1.6)" };
                    } else if (brand.name === "SPECTRUM") {
                      customStyle = { transform: "scale(1.4)" };
                    }
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
                          style={customStyle}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </li>

            <li className="nav-item-dropdown">
              <span className="nav-link dropdown-toggle">
                Offers <i className="fa fa-caret-down toggle-arrow"></i>
              </span>
              <ul className="dropdown-menu offers-dropdown" style={{ minWidth: "180px" }}>
                <li style={{ borderBottom: "1px solid #eaeaea" }}>
                  <Link to="/flash-sale" className="dropdown-item" style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    Flash Sale
                  </Link>
                </li>
                <li style={{ borderBottom: "1px solid #eaeaea" }}>
                  <Link to="/product-tag/sale/" className="dropdown-item" style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    On Sale Now
                  </Link>
                </li>
                <li style={{ borderBottom: "1px solid #eaeaea" }}>
                  <Link to="/shop?type=bundles" className="dropdown-item" style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    Bundles
                  </Link>
                </li>
                <li style={{ borderBottom: "1px solid #eaeaea" }}>
                  <Link to="/shop?type=clearance" className="dropdown-item" style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    Clearance
                  </Link>
                </li>
                <li>
                  <Link to="/shop?type=bulk" className="dropdown-item" style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    Bulk Items
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link to="/product-tag/new-arrivals" className="nav-link">
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
                  placeholder="Search"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="nav-search-input"
                />
                {isSearching ? (
                  <div className="search-loading-spinner" />
                ) : (
                  searchVal.trim() !== "" && (
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
                  )
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
                {searchResults?.correctedQuery && (
                  <div className="search-autocorrect-banner">
                    Showing results for: <span className="search-autocorrect-term">{searchResults.correctedQuery}</span>
                  </div>
                )}

                {searchResults?.suggestions && searchResults.suggestions.length > 0 && (
                  <div className="search-suggestions-chips-section">
                    <span className="search-suggestions-chips-label">Suggestions:</span>
                    <div className="search-suggestions-chips-list">
                      {searchResults.suggestions.map((s, idx) => (
                        <button
                          type="button"
                          key={idx}
                          className="search-suggestion-chip"
                          onClick={() => {
                            setSearchVal(s);
                            navigate(`/shop?q=${encodeURIComponent(s)}`);
                            setIsSearchFocused(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults?.groups && searchResults.groups.length > 0 && (
                  <div className="search-groups-section">
                    {searchResults.groups.map((group, idx) => {
                      const name = group.split(" ")[0];
                      const countStr = group.split("(")[1]?.replace(")", "") || "";
                      return (
                        <div
                          key={idx}
                          className="search-group-header-row"
                          onClick={() => {
                            navigate(`/shop?q=${encodeURIComponent(name.toLowerCase())}`);
                            setIsSearchFocused(false);
                          }}
                        >
                          {name} ({countStr})
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="search-section-title">Products</div>

                {isSearching ? (
                  <div className="search-status-message">Searching...</div>
                ) : searchResults && searchResults.products.length > 0 ? (
                  <div className="search-products-scroll-list">
                    {searchResults.products.map((p) => {
                      const displayBreadcrumb = [
                        ...(p.categories || []).map((c: any) => c.name),
                        ...(p.tags || []).map((t: any) => t.name),
                        p.brand
                      ]
                        .filter(Boolean)
                        .filter((val, idx, self) => self.indexOf(val) === idx)
                        .join(", ");
                      const isDonation = p.name.toLowerCase().includes("donate");
                      return isDonation ? (
                        <a
                          key={p.id}
                          href="https://psk-donation.vercel.app/"
                          className="search-product-row-item"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setSearchVal("");
                          }}
                        >
                          <img src={p.image_url} alt={p.name} className="search-product-row-img" />
                          <div className="search-product-row-info">
                            <div className="search-product-row-name">
                              {highlightText(p.name, searchVal)}
                            </div>
                            <div className="search-product-row-price">
                              {p.price.toLocaleString()}KSh
                            </div>
                            {p.short_description && (
                              <div className="search-product-row-desc">
                                {highlightText(p.short_description, searchVal)}
                              </div>
                            )}
                            <div className="search-product-row-breadcrumb">
                              {displayBreadcrumb}
                            </div>
                          </div>
                        </a>
                      ) : (
                        <Link
                          key={p.id}
                          to={p.slug ? `/product/${p.slug}/` : `/shop/${p.id}`}
                          className="search-product-row-item"
                          onClick={() => {
                            setIsSearchFocused(false);
                            setSearchVal("");
                          }}
                        >
                          <img src={p.image_url} alt={p.name} className="search-product-row-img" />
                          <div className="search-product-row-info">
                            <div className="search-product-row-name">
                              {highlightText(p.name, searchVal)}
                            </div>
                            <div className="search-product-row-price">
                              {p.price.toLocaleString()}KSh
                            </div>
                            {p.short_description && (
                              <div className="search-product-row-desc">
                                {highlightText(p.short_description, searchVal)}
                              </div>
                            )}
                            <div className="search-product-row-breadcrumb">
                              {displayBreadcrumb}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
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
            )}
          </div>

          {/* Right Action Icons: My Account & Cart */}
          <div className="navbar-actions">
            <Link to="/my-account" className="account-nav-btn" title="My Account" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.25rem" }}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                  src="/assets/signinuser.png" 
                  alt="My Account" 
                  style={{ width: "30px", height: "30px", objectFit: "contain" }} 
                />
                {isLoggedIn && (
                  <span className="green-dot" style={{
                    position: "absolute",
                    bottom: "0px",
                    right: "0px",
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#22c55e",
                    borderRadius: "50%",
                    border: "2px solid #1E5DA7",
                    zIndex: 10
                  }} />
                )}
              </div>
            </Link>

            <Link className="cart-nav-btn" to="/cart" title="Shopping Cart" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", padding: "0.25rem" }}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="#ffffff" width="32" height="32" className="navbar-cart-svg" style={{ transform: "translateY(1.5px)" }}>
                  <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
                </svg>
                {count > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-8px",
                      background: "#ffffff",
                      color: "#1E5DA7",
                      fontSize: "11px",
                      fontWeight: "700",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                    }}
                    suppressHydrationWarning
                  >
                    {count}
                  </span>
                )}
              </div>
            </Link>
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
