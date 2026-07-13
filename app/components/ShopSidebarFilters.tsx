import { Link, useLocation } from "react-router";
import { ANIMAL_CATEGORIES } from "../routes/shop";

interface ShopSidebarFiltersProps {
  slug: string;
  animal: string;
  brand: string;
  lifeStage: string;
  type: string;
  isTag: boolean;
  isSearch: boolean;
  activeSidebarSlug: string;
  sidebarCategories?: { label: string; slug: string }[];
  isBrandPage?: boolean;
  brandCategories?: { name: string; slug: string; count: number }[];
  fromCat?: string;
  isOfferPage?: boolean;
  sort?: string;
  buildCategoryHref: (newBrand: string, newLimit?: string, newSort?: string) => string;
  navigate: (path: string) => void;
}

const SIDEBAR_BRANDS = ["Bonnie", "King", "Montego", "Proline", "Reflex", "Royal Canin", "Spectrum", "Trendline"];

export default function ShopSidebarFilters({
  slug,
  animal,
  brand,
  lifeStage,
  type,
  isTag,
  isSearch,
  activeSidebarSlug,
  sidebarCategories,
  isBrandPage,
  brandCategories,
  fromCat,
  isOfferPage,
  sort,
  buildCategoryHref,
  navigate,
}: ShopSidebarFiltersProps) {
  const location = useLocation();

  const isFoodOrSpecificFilter = 
    slug.includes("food") || 
    slug.includes("treat") || 
    slug === "dog-food" || 
    slug === "cat-food";

  // Display general category lists on main pet pages but hide them on grandchild food/treat pages
  const showCategoriesList = animal && !isFoodOrSpecificFilter;

  // Life-stage options based on animal context (Puppy/Junior/Adult/Senior for Dog, Kitten/Adult/Senior for Cat)
  const getLifeStageOptions = () => {
    if (animal === "dog") {
      return [
        { label: "Puppy", slug: "puppy" },
        { label: "Junior", slug: "junior" },
        { label: "Adult", slug: "adult" },
        { label: "Senior", slug: "senior" }
      ];
    }
    if (animal === "cat") {
      return [
        { label: "Kitten", slug: "kitten" },
        { label: "Adult", slug: "adult" },
        { label: "Senior", slug: "senior" }
      ];
    }
    return [];
  };

  const lifeStages = getLifeStageOptions();

  // URL Helper to toggle life stage tag parameter
  const getLifeStageHref = (stageSlug: string) => {
    const p = new URLSearchParams(location.search);
    if (lifeStage === stageSlug) {
      p.delete("life_stage");
    } else {
      p.set("life_stage", stageSlug);
    }
    p.delete("page");
    return `${location.pathname}${p.toString() ? "?" + p.toString() : ""}`;
  };

  // URL Helper to toggle brand page category filter
  const getBrandCategoryHref = (categorySlug: string) => {
    const p = new URLSearchParams(location.search);
    if (fromCat === categorySlug) {
      p.delete("from_cat");
    } else {
      p.set("from_cat", categorySlug);
    }
    p.delete("page");
    return `${location.pathname}${p.toString() ? "?" + p.toString() : ""}`;
  };

  // URL Helper to reset all filters
  const getClearAllHref = () => {
    if (isBrandPage) {
      if (slug) {
        return `/product-category/${slug}/`;
      } else {
        const p = new URLSearchParams(location.search);
        p.delete("from_cat");
        p.delete("life_stage");
        p.delete("page");
        return `${location.pathname}${p.toString() ? "?" + p.toString() : ""}`;
      }
    }
    return `/product-category/${slug || "dog-supplies-store"}/`;
  };

  // URL Helper to toggle offers sort filter
  const getSortOffersHref = (sortVal: string) => {
    const p = new URLSearchParams(location.search);
    p.set("sort", sortVal);
    p.delete("page");
    return `${location.pathname}${p.toString() ? "?" + p.toString() : ""}`;
  };

  const hasActiveFilters = brand || lifeStage || isSearch || fromCat;

  // Use dynamically loaded and sorted categories when available, otherwise fall back to static
  const displayCategories = sidebarCategories || (animal ? ANIMAL_CATEGORIES[animal] : []);

  // 0. OFFERS PAGE LAYOUT: Show only "SORT OFFERS"
  if (isOfferPage) {
    const currentSort = sort || "availability";
    return (
      <div className="sidebar-filters-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="filter-section">
          <h3 className="sidebar-title" style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}>
            SORT OFFERS
          </h3>
          <ul className="sidebar-brands-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              <Link
                to={getSortOffersHref("expiry-desc")}
                style={{
                  fontSize: "15px",
                  textDecoration: "none",
                  color: currentSort === "expiry-desc" || currentSort === "expiry_desc" ? "var(--brand-primary, #1053a0)" : "var(--ink-medium, #475569)",
                  fontWeight: currentSort === "expiry-desc" || currentSort === "expiry_desc" ? "600" : "400",
                  display: "block",
                  padding: "2px 0"
                }}
              >
                Expiry: New to Old
              </Link>
            </li>
            <li>
              <Link
                to={getSortOffersHref("expiry-asc")}
                style={{
                  fontSize: "15px",
                  textDecoration: "none",
                  color: currentSort === "expiry-asc" || currentSort === "expiry_asc" ? "var(--brand-primary, #1053a0)" : "var(--ink-medium, #475569)",
                  fontWeight: currentSort === "expiry-asc" || currentSort === "expiry_asc" ? "600" : "400",
                  display: "block",
                  padding: "2px 0"
                }}
              >
                Expiry: Old to New
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // 1. BRAND PAGE LAYOUT: Show only "FILTER BY CATEGORY" with counts
  if (isBrandPage) {
    return (
      <div className="sidebar-filters-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="filter-section">
          <h3 className="sidebar-title" style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}>
            FILTER BY CATEGORY
          </h3>
          <ul className="sidebar-brands-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {brandCategories && brandCategories.map(c => {
              const isActive = fromCat === c.slug;
              return (
                <li key={c.slug}>
                  <Link
                    to={getBrandCategoryHref(c.slug)}
                    className={isActive ? "active-brand" : ""}
                    style={{
                      fontSize: "15px",
                      textDecoration: "none",
                      color: isActive ? "var(--brand-primary, #1053a0)" : "var(--ink-medium, #475569)",
                      fontWeight: isActive ? "600" : "400",
                      display: "block",
                      padding: "2px 0"
                    }}
                  >
                    {c.name} ({c.count})
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Clear All Filters reset option */}
        {hasActiveFilters && (
          <div className="filter-section" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", marginTop: "0.5rem" }}>
            <button
              onClick={() => navigate(getClearAllHref())}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#334155",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"}
              onMouseOut={e => e.currentTarget.style.background = "#f1f5f9"}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. STANDARD STOREFRONT LAYOUT (Pet Categories, Search, Tag, General)
  return (
    <div className="sidebar-filters-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* 1. Category Tree / Pet Category list */}
      {showCategoriesList && displayCategories.length > 0 && (
        <div className="filter-section">
          <h3 className="sidebar-title" style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}>
            CATEGORIES
          </h3>
          <ul className="sidebar-brands-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {displayCategories.map(c => {
              const normSlug = slug ? slug.toLowerCase().replace(/\/$/, "") : "";
              const isActive = normSlug === c.slug || activeSidebarSlug === c.slug;
              return (
                <li key={c.slug}>
                  <Link
                    to={`/product-category/${c.slug}/`}
                    className={isActive ? "active-brand" : ""}
                    style={{
                      fontSize: "15px",
                      textDecoration: "none",
                      color: isActive ? "var(--brand-primary, #1053a0)" : "var(--ink-medium, #475569)",
                      fontWeight: isActive ? "600" : "400",
                      display: "block",
                      padding: "2px 0"
                    }}
                  >
                    {c.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 2. Brand Filters */}
      <div className="filter-section">
        <h3 className="sidebar-title" style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}>
          FILTER BY BRAND
        </h3>
        <ul className="sidebar-brands-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <li>
            <Link 
              to={buildCategoryHref("")} 
              className={!brand ? "active-brand" : ""}
              style={{
                fontSize: "15px",
                textDecoration: "none",
                color: !brand ? "var(--brand-primary, #1053a0)" : "var(--ink-medium, #475569)",
                fontWeight: !brand ? "600" : "400",
                display: "block",
                padding: "2px 0"
              }}
            >
              All Brands
            </Link>
          </li>
          {SIDEBAR_BRANDS.map(b => {
            const isActive = brand.toLowerCase() === b.toLowerCase();
            return (
              <li key={b}>
                <Link 
                  to={buildCategoryHref(b)} 
                  className={isActive ? "active-brand" : ""}
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: isActive ? "var(--brand-primary, #1053a0)" : "var(--ink-medium, #475569)",
                    fontWeight: isActive ? "600" : "400",
                    display: "block",
                    padding: "2px 0"
                  }}
                >
                  {b}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 3. Life-Stage Filters */}
      {lifeStages.length > 0 && (
        <div className="filter-section">
          <h3 className="sidebar-title" style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}>
            LIFE STAGE
          </h3>
          <ul className="sidebar-brands-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {lifeStages.map(stage => {
              const isActive = lifeStage === stage.slug;
              return (
                <li key={stage.slug}>
                  <Link 
                    to={getLifeStageHref(stage.slug)}
                    className={isActive ? "active-brand" : ""}
                    style={{
                      fontSize: "15px",
                      textDecoration: "none",
                      color: isActive ? "var(--brand-primary, #1053a0)" : "var(--ink-medium, #475569)",
                      fontWeight: isActive ? "600" : "400",
                      display: "block",
                      padding: "2px 0"
                    }}
                  >
                    {stage.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 4. Active filters summary and Reset option */}
      {hasActiveFilters && (
        <div className="filter-section" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", marginTop: "0.5rem" }}>
          <button
            onClick={() => navigate(getClearAllHref())}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"}
            onMouseOut={e => e.currentTarget.style.background = "#f1f5f9"}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
