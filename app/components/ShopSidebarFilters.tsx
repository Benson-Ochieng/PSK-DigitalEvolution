import { Link, useLocation } from "react-router";
import { ANIMAL_CATEGORIES } from "../routes/shop";
import { type CategoryRow } from "../lib/categories";

interface ShopSidebarFiltersProps {
  slug: string;
  animal: string;
  brand: string;
  lifeStage: string;
  type: string;
  isTag: boolean;
  isSearch: boolean;
  activeSidebarSlug: string;
  sidebarData?: {
    mode: "categories" | "brands";
    heading: string;
    items: { name: string; slug: string }[];
  };
  sidebarCategories?: { label: string; slug: string }[];
  categories?: CategoryRow[];
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
  sidebarData,
  sidebarCategories,
  categories,
  isBrandPage,
  brandCategories,
  fromCat,
  isOfferPage,
  sort,
  buildCategoryHref,
  navigate,
}: ShopSidebarFiltersProps) {
  const location = useLocation();

  const getLifeStageOptions = () => {
    if (animal === "dog") {
      return [
        { label: "Puppy", slug: "puppy" },
        { label: "Junior", slug: "junior" },
        { label: "Adult", slug: "adult" },
        { label: "Senior", slug: "senior" },
      ];
    }
    return [];
  };

  const lifeStages = getLifeStageOptions();

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

  const getSortOffersHref = (sortVal: string) => {
    const p = new URLSearchParams(location.search);
    p.set("sort", sortVal);
    p.delete("page");
    return `${location.pathname}${p.toString() ? "?" + p.toString() : ""}`;
  };

  const normSlug = slug ? slug.toLowerCase().replace(/\/$/, "") : "";
  const activeSlug = normSlug || activeSidebarSlug;

  // Resolve matching category filter list for the current page category
  let filterCategoriesList: { label: string; slug: string }[] = [];

  if (categories && categories.length > 0) {
    const normActiveSlug = activeSlug.toLowerCase().replace(/\/$/, "");
    const currentCatNode = categories.find(
      (c) => c.slug.toLowerCase() === normActiveSlug
    );

    if (currentCatNode) {
      // 1. If current category has child subcategories, render direct children
      const childRows = categories.filter((c) => c.parent === currentCatNode.id);
      if (childRows.length > 0) {
        childRows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        filterCategoriesList = childRows.map((c) => ({ label: c.name, slug: c.slug }));
      } else if (currentCatNode.parent && currentCatNode.parent !== 0) {
        // 2. If current category is a leaf node, render its sibling subcategories under parent
        const siblingRows = categories.filter((c) => c.parent === currentCatNode.parent);
        siblingRows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        filterCategoriesList = siblingRows.map((c) => ({ label: c.name, slug: c.slug }));
      }
    }

    // 3. Fallback to animal level-1 categories if top-level animal page
    if (filterCategoriesList.length === 0 && animal) {
      const animalRootSlug =
        animal === "cat"
          ? "cat-supplies-store"
          : animal === "dog"
          ? "dog-supplies-store"
          : `${animal}-supplies-store`;
      const animalParent = categories.find((c) => c.slug === animalRootSlug);
      if (animalParent) {
        const topChildren = categories.filter((c) => c.parent === animalParent.id);
        topChildren.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        filterCategoriesList = topChildren.map((c) => ({ label: c.name, slug: c.slug }));
      }
    }
  }

  if (filterCategoriesList.length === 0) {
    filterCategoriesList = sidebarCategories || (animal ? ANIMAL_CATEGORIES[animal] : []);
  }

  // Life stage filter appears ONLY under Dog > Dog Food & Treats category
  const isDogFoodCategory =
    animal === "dog" &&
    (activeSlug.includes("dog-food") ||
      activeSlug.includes("dog-treat") ||
      activeSlug.includes("puppy") ||
      activeSlug === "dog-food-treats" ||
      activeSidebarSlug.includes("dog-food") ||
      activeSidebarSlug.includes("dog-treat"));

  const showLifeStageFilter = isDogFoodCategory && lifeStages.length > 0;

  // 0. OFFERS PAGE LAYOUT
  if (isOfferPage) {
    const currentSort = sort || "availability";
    return (
      <div className="sidebar-filters-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="filter-section">
          <h3
            className="sidebar-title"
            style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}
          >
            SORT OFFERS
          </h3>
          <ul
            className="sidebar-brands-list"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <li>
              <Link
                to={getSortOffersHref("expiry-desc")}
                style={{
                  fontSize: "15px",
                  textDecoration: "none",
                  color:
                    currentSort === "expiry-desc" || currentSort === "expiry_desc"
                      ? "var(--brand-primary, #1053a0)"
                      : "var(--ink-medium, #475569)",
                  fontWeight: currentSort === "expiry-desc" || currentSort === "expiry_desc" ? "600" : "400",
                  display: "block",
                  padding: "2px 0",
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
                  color:
                    currentSort === "expiry-asc" || currentSort === "expiry_asc"
                      ? "var(--brand-primary, #1053a0)"
                      : "var(--ink-medium, #475569)",
                  fontWeight: currentSort === "expiry-asc" || currentSort === "expiry_asc" ? "600" : "400",
                  display: "block",
                  padding: "2px 0",
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

  // 1. BRAND PAGE LAYOUT
  if (isBrandPage) {
    return (
      <div className="sidebar-filters-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="filter-section">
          <h3
            className="sidebar-title"
            style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}
          >
            FILTER BY CATEGORY
          </h3>
          <ul
            className="sidebar-brands-list"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {brandCategories &&
              brandCategories.map((c) => {
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
                        padding: "2px 0",
                      }}
                    >
                      {c.name} ({c.count})
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    );
  }

  // 2. STANDARD STOREFRONT LAYOUT
  const isHumanPage =
    slug?.toLowerCase() === "human" ||
    slug?.toLowerCase() === "humans" ||
    activeSidebarSlug?.toLowerCase() === "human" ||
    activeSidebarSlug?.toLowerCase() === "humans";

  return (
    <div className="sidebar-filters-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Dynamic Server-driven Sidebar Widget (CATEGORIES or FILTER BY BRAND) */}
      {sidebarData && sidebarData.items && sidebarData.items.length > 0 ? (
        <div className="filter-section">
          <h3
            className="sidebar-title"
            style={{
              marginBottom: "1.2rem",
              fontSize: "14px",
              fontWeight: "600",
              letterSpacing: "0.08em",
              color: "#475569",
              textTransform: "uppercase",
            }}
          >
            {sidebarData.heading}
          </h3>
          <ul
            className="sidebar-brands-list"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            {sidebarData.items.map((item) => {
              const itemSlug = item.slug.toLowerCase().replace(/\/$/, "");
              const isItemActive = normSlug === itemSlug || activeSidebarSlug === itemSlug;
              const linkHref =
                sidebarData.mode === "brands"
                  ? `/product-category/${item.slug}/?from_cat=${normSlug || activeSidebarSlug}`
                  : `/product-category/${item.slug}/`;

              return (
                <li key={item.slug}>
                  <Link
                    to={linkHref}
                    className={isItemActive ? "active-brand" : ""}
                    style={{
                      fontSize: "15px",
                      textDecoration: "none",
                      color: isItemActive ? "var(--brand-primary, #1053a0)" : "#64748b",
                      fontWeight: isItemActive ? "600" : "400",
                      display: "block",
                      padding: "1px 0",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : sidebarData ? null : (
        /* Legacy / Fallback Categories Section */
        filterCategoriesList.length > 0 && (
          <div className="filter-section">
            <h3
              className="sidebar-title"
              style={{
                marginBottom: "1.2rem",
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "0.08em",
                color: "#475569",
                textTransform: "uppercase",
              }}
            >
              CATEGORIES
            </h3>
            <ul
              className="sidebar-brands-list"
              style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}
            >
              {filterCategoriesList.map((c) => {
                const isActive = normSlug === c.slug || activeSidebarSlug === c.slug;
                return (
                  <li key={c.slug}>
                    <Link
                      to={`/product-category/${c.slug}/`}
                      className={isActive ? "active-brand" : ""}
                      style={{
                        fontSize: "15px",
                        textDecoration: "none",
                        color: isActive ? "var(--brand-primary, #1053a0)" : "#64748b",
                        fontWeight: isActive ? "600" : "400",
                        display: "block",
                        padding: "1px 0",
                        transition: "color 0.15s ease",
                      }}
                    >
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      )}

      {/* 2. Life-Stage Filter (ONLY under Dog > Dog Food & Treats) */}
      {showLifeStageFilter && (
        <div className="filter-section">
          <h3
            className="sidebar-title"
            style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}
          >
            LIFE STAGE
          </h3>
          <ul
            className="sidebar-brands-list"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {lifeStages.map((stage) => {
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
                      padding: "2px 0",
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

      {/* 3. Filter By Brand Fallback (only rendered if sidebarData is not provided) */}
      {!sidebarData && !isHumanPage && (
        <div className="filter-section">
          <h3
            className="sidebar-title"
            style={{ marginBottom: "0.85rem", fontSize: "16px", letterSpacing: "0.05em", color: "var(--ink-dark)" }}
          >
            FILTER BY BRAND
          </h3>
          <ul
            className="sidebar-brands-list"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
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
                  padding: "2px 0",
                }}
              >
                All Brands
              </Link>
            </li>
            {SIDEBAR_BRANDS.map((b) => {
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
                      padding: "2px 0",
                    }}
                  >
                    {b}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
