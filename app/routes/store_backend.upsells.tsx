import { useState, useMemo } from "react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import fs from "fs";
import path from "path";
import { query } from "~/db.server";

interface UpsellItem {
  id: number;
  name: string;
  brand: string;
  image_url: string | null;
  regularPrice: number;
  salePrice: number;
  minQuantity?: number;
  category?: string;
  isPrimary?: boolean;
  slug?: string;
}

interface UpsellEvent {
  type: "impression" | "purchase";
  productId: number;
  revenue?: number;
  timestamp: string;
}

interface UpsellsConfig {
  enabled: boolean;
  activeProductId: number;
  rotationMode?: string;
  timerSeconds: number;
  items: UpsellItem[];
  events?: UpsellEvent[];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const upsellsPath = path.join(process.cwd(), "content", "upsells.json");
  let upsellsConfig: UpsellsConfig = {
    enabled: true,
    activeProductId: 48957,
    timerSeconds: 30,
    items: [],
    events: [],
  };

  if (fs.existsSync(upsellsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(upsellsPath, "utf-8"));
      upsellsConfig = { ...upsellsConfig, ...parsed };
      if (!upsellsConfig.events) upsellsConfig.events = [];
    } catch (e) {
      console.error("Failed to parse upsells.json:", e);
    }
  }

  // Fetch catalog products for the Add New Upsell Product dropdown
  let catalogProducts: Array<{
    id: number;
    name: string;
    brand: string;
    image_url: string | null;
    price: number;
    category: string;
    slug: string;
  }> = [];

  try {
    const res = await query(`
      SELECT p.id, p.name, p.brand, p.image_url, p.slug, p.categories, sp.price
      FROM products p
      LEFT JOIN store_prices sp ON sp.product_id = p.id AND sp.store_name = 'PetStore Kenya'
      WHERE p.status = 'publish' AND sp.price > 0
      ORDER BY p.name ASC
      LIMIT 500
    `);

    catalogProducts = res.rows.map((r) => {
      let catStr = r.brand || "";
      if (r.categories && Array.isArray(r.categories)) {
        catStr = r.categories.map((c: any) => c.name).filter(Boolean).join(", ") || catStr;
      }
      return {
        id: r.id,
        name: r.name,
        brand: r.brand || "",
        image_url: r.image_url,
        price: Number(r.price) || 0,
        category: catStr,
        slug: r.slug,
      };
    });
  } catch (err) {
    console.error("Error fetching catalog products for upsell selector:", err);
  }

  return { upsellsConfig, catalogProducts, currentUser };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const upsellsPath = path.join(process.cwd(), "content", "upsells.json");
  const settingsPath = path.join(process.cwd(), "content", "general-settings.json");

  let config: UpsellsConfig = {
    enabled: true,
    activeProductId: 48957,
    timerSeconds: 30,
    items: [],
    events: [],
  };

  if (fs.existsSync(upsellsPath)) {
    try {
      config = JSON.parse(fs.readFileSync(upsellsPath, "utf-8"));
    } catch {}
  }
  if (!config.events) config.events = [];

  // Public checkout tracking (no admin auth required)
  if (intent === "track_impression") {
    const productId = Number(formData.get("productId"));
    if (productId) {
      config.events.push({
        type: "impression",
        productId,
        timestamp: new Date().toISOString(),
      });
      if (config.events.length > 10000) {
        config.events = config.events.slice(-10000);
      }
      try {
        fs.writeFileSync(upsellsPath, JSON.stringify(config, null, 2), "utf-8");
      } catch {}
      return { success: true };
    }
  }

  if (intent === "track_purchase") {
    const productId = Number(formData.get("productId"));
    if (productId) {
      const item = config.items.find((i) => i.id === productId);
      const revenue = item ? item.salePrice : 137;
      config.events.push({
        type: "purchase",
        productId,
        revenue,
        timestamp: new Date().toISOString(),
      });
      if (config.events.length > 10000) {
        config.events = config.events.slice(-10000);
      }
      try {
        fs.writeFileSync(upsellsPath, JSON.stringify(config, null, 2), "utf-8");
      } catch {}
      return { success: true };
    }
  }

  // Admin authentication required for mutations
  const { requireAdminUser } = await import("~/lib/sessions.server");
  await requireAdminUser(request);

  if (intent === "add_upsell_product") {
    const productId = Number(formData.get("productId"));
    if (!productId) {
      return { error: "Please select a valid product to add." };
    }

    const existingIndex = config.items.findIndex((i) => i.id === productId);
    if (existingIndex >= 0) {
      return { error: "This product is already in the upsell list." };
    }

    try {
      const res = await query(`
        SELECT p.id, p.name, p.brand, p.image_url, p.slug, p.categories, sp.price
        FROM products p
        LEFT JOIN store_prices sp ON sp.product_id = p.id AND sp.store_name = 'PetStore Kenya'
        WHERE p.id = $1
        LIMIT 1
      `, [productId]);

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const regPrice = Number(row.price) || 195;
        const defaultSalePrice = Math.round(regPrice * 0.7);
        let catStr = row.brand || "";
        if (row.categories && Array.isArray(row.categories)) {
          catStr = row.categories.map((c: any) => c.name).filter(Boolean).join(", ") || catStr;
        }

        const isFirst = config.items.length === 0;
        config.items.push({
          id: row.id,
          name: row.name,
          brand: row.brand || "",
          image_url: row.image_url,
          regularPrice: regPrice,
          salePrice: defaultSalePrice,
          minQuantity: 1,
          category: catStr,
          isPrimary: isFirst,
          slug: row.slug,
        });

        if (isFirst) {
          config.activeProductId = row.id;
        }
      }
    } catch (err) {
      console.error("Error adding upsell product:", err);
      return { error: "Failed to load product details from database." };
    }
  } else if (intent === "remove_upsell_product") {
    const productId = Number(formData.get("productId"));
    config.items = config.items.filter((i) => i.id !== productId);
    if (config.activeProductId === productId) {
      config.activeProductId = config.items.length > 0 ? config.items[0].id : 0;
      if (config.items.length > 0) {
        config.items[0].isPrimary = true;
      }
    }
  } else if (intent === "update_upsell_price") {
    const productId = Number(formData.get("productId"));
    const newPrice = Number(formData.get("upsellPrice"));
    if (productId && !isNaN(newPrice) && newPrice > 0) {
      const item = config.items.find((i) => i.id === productId);
      if (item) {
        item.salePrice = newPrice;
      }
    }
  } else if (intent === "update_rotation_mode") {
    const mode = formData.get("rotationMode")?.toString();
    if (mode) {
      config.rotationMode = mode as any;
    }
  }

  // Save to content/upsells.json
  try {
    fs.writeFileSync(upsellsPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write upsells.json:", e);
    return { error: "Failed to save upsell configuration." };
  }

  // Sync primary product to content/general-settings.json
  if (fs.existsSync(settingsPath)) {
    try {
      const genSettings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      genSettings.checkoutUpsellEnabled = config.enabled;
      genSettings.checkoutUpsellProductId = config.activeProductId;
      const activeItem = config.items.find((i) => i.id === config.activeProductId) || config.items[0];
      if (activeItem) {
        genSettings.checkoutUpsellSalePrice = activeItem.salePrice;
        genSettings.checkoutUpsellRegularPrice = activeItem.regularPrice;
      }
      fs.writeFileSync(settingsPath, JSON.stringify(genSettings, null, 2), "utf-8");
    } catch {}
  }

  return { success: true, message: "Upsell configuration updated successfully." };
}

export default function StoreBackendUpsells() {
  const { upsellsConfig, catalogProducts } = useLoaderData<typeof loader>();
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Section 1: Selected product to add
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Section 2: Table search filter & inline price editing state
  const [tableSearch, setTableSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [editingPriceMap, setEditingPriceMap] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    upsellsConfig.items.forEach((item) => {
      init[item.id] = item.salePrice;
    });
    return init;
  });

  // Section 3: Metrics Time Range, Product Filter & Chart Pagination
  const [timeRange, setTimeRange] = useState("30");
  const [metricsProductFilter, setMetricsProductFilter] = useState("all");
  const [chartPage, setChartPage] = useState(1);

  // Dynamic filtered table rows in Section 2
  const filteredUpsellItems = useMemo(() => {
    const queryTerm = appliedSearch.trim().toLowerCase() || tableSearch.trim().toLowerCase();
    if (!queryTerm) return upsellsConfig.items;
    return upsellsConfig.items.filter(
      (item) =>
        item.name.toLowerCase().includes(queryTerm) ||
        (item.category || "").toLowerCase().includes(queryTerm) ||
        String(item.id).includes(queryTerm)
    );
  }, [upsellsConfig.items, appliedSearch, tableSearch]);

  // Compute truly dynamic metrics from the events log
  const rawEvents = upsellsConfig.events || [];

  const filteredEvents = useMemo(() => {
    if (timeRange === "all") return rawEvents;
    const days = Number(timeRange) || 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return rawEvents.filter((e) => e.timestamp >= cutoff);
  }, [rawEvents, timeRange]);

  const thirtyDaysCutoff = useMemo(() => {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }, []);

  // Compute dynamic stats per product in the upsell pool
  const dynamicProductMetrics = useMemo(() => {
    return upsellsConfig.items.map((item) => {
      const productEvents = filteredEvents.filter((e) => e.productId === item.id);
      const shown = productEvents.filter((e) => e.type === "impression").length;
      const purchases = productEvents.filter((e) => e.type === "purchase");
      const purchased = purchases.length;
      const conversionRate = shown > 0 ? Number(((purchased / shown) * 100).toFixed(1)) : 0;
      const revenue = purchases.reduce((sum, p) => sum + (p.revenue || item.salePrice), 0);
      const recentImpressions = rawEvents.filter(
        (e) => e.productId === item.id && e.type === "impression" && e.timestamp >= thirtyDaysCutoff
      ).length;

      return {
        id: item.id,
        name: item.name,
        shown,
        purchased,
        conversionRate,
        revenue,
        recentImpressions,
      };
    });
  }, [upsellsConfig.items, filteredEvents, rawEvents, thirtyDaysCutoff]);

  // Overall dynamic metric counters (all start at 0)
  const totalProductsCount = upsellsConfig.items.length;
  const totalImpressionsCount = useMemo(() => {
    return filteredEvents.filter((e) => e.type === "impression").length;
  }, [filteredEvents]);

  const totalPurchasesCount = useMemo(() => {
    return filteredEvents.filter((e) => e.type === "purchase").length;
  }, [filteredEvents]);

  // Filtered metrics table in Section 3
  const filteredMetrics = useMemo(() => {
    if (metricsProductFilter === "all") return dynamicProductMetrics;
    return dynamicProductMetrics.filter(
      (m) =>
        m.name.toLowerCase().includes(metricsProductFilter.toLowerCase()) ||
        String(m.id) === metricsProductFilter
    );
  }, [dynamicProductMetrics, metricsProductFilter]);

  // Chart data pagination (5 per page)
  const chartItemsPerPage = 5;
  const totalChartPages = Math.max(1, Math.ceil(filteredMetrics.length / chartItemsPerPage));
  const currentChartItems = filteredMetrics.slice((chartPage - 1) * chartItemsPerPage, chartPage * chartItemsPerPage);

  // Maximum value for the bar chart scaling
  const maxShownInView = useMemo(() => {
    const highest = Math.max(0, ...currentChartItems.map((i) => i.shown));
    return highest > 80 ? Math.ceil(highest / 20) * 20 : 80;
  }, [currentChartItems]);

  // CSV download trigger
  const handleDownloadCSV = () => {
    const headers = ["Product", "Times Shown", "Times Purchased", "Conversion Rate (%)", "Revenue (KSh)", "Recent Impressions"];
    const rows = filteredMetrics.map((m) => [
      `"${m.name.replace(/"/g, '""')}"`,
      m.shown,
      m.purchased,
      `${m.conversionRate}%`,
      m.revenue.toFixed(2),
      m.recentImpressions,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `upsell_metrics_${timeRange}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div
      style={{
        padding: "1.75rem 2.25rem",
        maxWidth: "1400px",
        margin: "0 auto",
        color: "#f3f4f6",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Action Notification Messages */}
      {actionData?.message && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            color: "#34d399",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "14px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✓</span> {actionData.message}
        </div>
      )}

      {actionData?.error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            color: "#f87171",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "14px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✕</span> {actionData.error}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 1: ADD NEW UPSELL PRODUCT (TOP)                  */}
      {/* ========================================================= */}
      <div
        style={{
          background: "#14141c",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "1.5rem 1.75rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#ffffff", margin: "0 0 1.25rem 0", letterSpacing: "-0.01em" }}>
          Add New Upsell Product
        </h2>

        <Form method="post" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <input type="hidden" name="intent" value="add_upsell_product" />

          {/* Product Dropdown */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            <select
              name="productId"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              style={{
                width: "100%",
                height: "42px",
                padding: "0 14px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "#1c1c27",
                fontSize: "13.5px",
                color: selectedProductId ? "#f3f4f6" : "#9ca3af",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="" style={{ background: "#1c1c27", color: "#9ca3af" }}>
                Select a product
              </option>
              {catalogProducts.map((p) => {
                const isAdded = upsellsConfig.items.some((i) => i.id === p.id);
                return (
                  <option key={p.id} value={p.id} disabled={isAdded} style={{ background: "#1c1c27", color: isAdded ? "#6b7280" : "#f3f4f6" }}>
                    {p.name} ({p.price.toLocaleString()} KSh){isAdded ? " — Already Added" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Add Button */}
          <button
            type="submit"
            disabled={!selectedProductId || isSubmitting}
            style={{
              background: "#0088cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0 22px",
              height: "42px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: !selectedProductId || isSubmitting ? "not-allowed" : "pointer",
              opacity: !selectedProductId || isSubmitting ? 0.6 : 1,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(0, 136, 204, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (selectedProductId && !isSubmitting) e.currentTarget.style.background = "#0077b3";
            }}
            onMouseLeave={(e) => {
              if (selectedProductId && !isSubmitting) e.currentTarget.style.background = "#0088cc";
            }}
          >
            Add Upsell Product
          </button>
        </Form>

        <p style={{ margin: "0.75rem 0 0 0", fontSize: "12.5px", color: "#9ca3af", fontStyle: "italic" }}>
          Select a product to add as an upsell. It will be added to the table below.
        </p>

        {/* Rotation Strategy Selector */}
        <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f3f4f6" }}>
              Upsell Display & Rotation Strategy
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Determines how products from the pool are chosen when a shopper views the checkout modal.
            </div>
          </div>
          <Form method="post" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="hidden" name="intent" value="update_rotation_mode" />
            <select
              name="rotationMode"
              defaultValue={upsellsConfig.rotationMode || "category_affinity"}
              onChange={(e) => e.target.form?.requestSubmit()}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "6px",
                border: "1px solid rgba(0, 204, 255, 0.4)",
                background: "#1c1c27",
                color: "#00ccff",
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="category_affinity" style={{ background: "#1c1c27", color: "#f3f4f6" }}>
                🎯 Smart Category Match (Dog / Cat Cart Context)
              </option>
              <option value="highest_converting" style={{ background: "#1c1c27", color: "#f3f4f6" }}>
                ⭐ Highest Conversion Rate First (Auto-Optimized)
              </option>
              <option value="round_robin" style={{ background: "#1c1c27", color: "#f3f4f6" }}>
                🔄 Round-Robin Rotation
              </option>
              <option value="single_featured" style={{ background: "#1c1c27", color: "#f3f4f6" }}>
                📌 Fixed Featured Product Only
              </option>
            </select>
          </Form>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: OVERVIEW WITH THE FILTER (MIDDLE)              */}
      {/* ========================================================= */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#ffffff", margin: "0 0 1.25rem 0" }}>
          Overview
        </h2>

        {/* 3 Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          {/* Card 1: Total Upsell Products */}
          <div
            style={{
              background: "#14141c",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "1.1rem 1.4rem",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <span style={{ fontSize: "20px", color: "#00ccff" }}>🛒</span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#d1d5db" }}>
              Total Upsell Products: <strong style={{ fontWeight: 700, color: "#ffffff" }}>{totalProductsCount}</strong>
            </span>
          </div>

          {/* Card 2: Total Times Shown */}
          <div
            style={{
              background: "#14141c",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "1.1rem 1.4rem",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <span style={{ fontSize: "20px", color: "#38bdf8" }}>👁</span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#d1d5db" }}>
              Total Times Shown: <strong style={{ fontWeight: 700, color: "#ffffff" }}>{totalImpressionsCount}</strong>
            </span>
          </div>

          {/* Card 3: Total Purchases */}
          <div
            style={{
              background: "#14141c",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "1.1rem 1.4rem",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <span style={{ fontSize: "20px", color: "#34d399", fontWeight: "bold" }}>✓</span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#d1d5db" }}>
              Total Purchases: <strong style={{ fontWeight: 700, color: "#ffffff" }}>{totalPurchasesCount}</strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "1.25rem" }}>
          <input
            type="text"
            placeholder="Search products..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setAppliedSearch(tableSearch);
            }}
            style={{
              width: "300px",
              height: "40px",
              padding: "0 14px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "#1c1c27",
              color: "#ffffff",
              fontSize: "13.5px",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => setAppliedSearch(tableSearch)}
            style={{
              background: "#0088cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0 20px",
              height: "40px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0077b3")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0088cc")}
          >
            Filter
          </button>
        </div>

        {/* Overview Upsell Products Table */}
        <div
          style={{
            background: "#14141c",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#1a1a24", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#9ca3af" }}>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "70px" }}>ID</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "110px" }}>Regular Price</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "110px" }}>Upsell Price</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "90px" }}>Min Quantity</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, textAlign: "right", width: "90px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUpsellItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
                    No products found matching "{tableSearch || appliedSearch}".
                  </td>
                </tr>
              ) : (
                filteredUpsellItems.map((item, idx) => {
                  const currentPrice = editingPriceMap[item.id] ?? item.salePrice;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: idx < filteredUpsellItems.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                        color: "#e5e7eb",
                        background: idx % 2 === 1 ? "rgba(255, 255, 255, 0.015)" : "transparent",
                      }}
                    >
                      {/* ID */}
                      <td style={{ padding: "0.9rem 1.25rem", color: "#9ca3af", fontWeight: 500 }}>
                        {item.id}
                      </td>

                      {/* Name */}
                      <td style={{ padding: "0.9rem 1.25rem", fontWeight: 500, color: "#ffffff", maxWidth: "340px", lineHeight: 1.4 }}>
                        {item.name}
                      </td>

                      {/* Regular Price */}
                      <td style={{ padding: "0.9rem 1.25rem", color: "#9ca3af", fontWeight: 500 }}>
                        {item.regularPrice}KSh
                      </td>

                      {/* Upsell Price with input & Update button */}
                      <td style={{ padding: "0.9rem 1.25rem" }}>
                        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "4px", width: "70px" }}>
                          <input type="hidden" name="intent" value="update_upsell_price" />
                          <input type="hidden" name="productId" value={item.id} />
                          <input
                            type="number"
                            name="upsellPrice"
                            value={currentPrice}
                            onChange={(e) =>
                              setEditingPriceMap((prev) => ({
                                ...prev,
                                [item.id]: Number(e.target.value),
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "4px 6px",
                              borderRadius: "4px",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              background: "#1c1c27",
                              color: "#ffffff",
                              fontSize: "13px",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              background: "transparent",
                              color: "#00ccff",
                              border: "1px solid rgba(0, 204, 255, 0.5)",
                              borderRadius: "4px",
                              padding: "2px 0",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#00ccff";
                              e.currentTarget.style.color = "#0d0d12";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#00ccff";
                            }}
                          >
                            Update
                          </button>
                        </Form>
                      </td>

                      {/* Min Quantity */}
                      <td style={{ padding: "0.9rem 1.25rem", color: "#9ca3af" }}>
                        {item.minQuantity ?? 1}
                      </td>

                      {/* Category */}
                      <td style={{ padding: "0.9rem 1.25rem", color: "#9ca3af", fontSize: "12.5px", lineHeight: 1.4 }}>
                        {item.category || item.brand || "—"}
                      </td>

                      {/* Remove Button */}
                      <td style={{ padding: "0.9rem 1.25rem", textAlign: "right" }}>
                        <Form
                          method="post"
                          onSubmit={(e) => {
                            if (!confirm(`Remove "${item.name}" from upsells?`)) e.preventDefault();
                          }}
                        >
                          <input type="hidden" name="intent" value="remove_upsell_product" />
                          <input type="hidden" name="productId" value={item.id} />
                          <button
                            type="submit"
                            style={{
                              background: "transparent",
                              color: "#f87171",
                              border: "1px solid rgba(248, 113, 113, 0.4)",
                              borderRadius: "4px",
                              padding: "4px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#ef4444";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#f87171";
                            }}
                          >
                            Remove
                          </button>
                        </Form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: UPSELL CONVERSION METRICS (BOTTOM)             */}
      {/* ========================================================= */}
      <div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#ffffff", margin: "0 0 1.25rem 0" }}>
          Upsell Conversion Metrics
        </h2>

        {/* Metrics Filter Controls */}
        <div
          style={{
            background: "#14141c",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "0.9rem 1.4rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#9ca3af" }}>Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "#1c1c27",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
              }}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "240px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#9ca3af" }}>Product:</span>
            <select
              value={metricsProductFilter}
              onChange={(e) => {
                setMetricsProductFilter(e.target.value);
                setChartPage(1);
              }}
              style={{
                width: "100%",
                maxWidth: "380px",
                height: "38px",
                padding: "0 12px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "#1c1c27",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
              }}
            >
              <option value="all">All Products</option>
              {upsellsConfig.items.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {}}
            style={{
              background: "#0088cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0 20px",
              height: "38px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>
        </div>

        {/* Charts Grid: Product Performance (Left) & Revenue Over Time (Right) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.75rem" }}>
          {/* Chart 1: Product Performance Bar Chart */}
          <div
            style={{
              background: "#14141c",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>Product Performance</div>
              <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>Impressions vs. Purchases</div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "18px", marginBottom: "1rem", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "14px", height: "10px", background: "rgba(0, 204, 255, 0.35)", border: "1px solid #00ccff", display: "inline-block", borderRadius: "2px" }} />
                <span style={{ color: "#d1d5db" }}>Times Shown</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "14px", height: "10px", background: "rgba(244, 63, 94, 0.35)", border: "1px solid #f43f5e", display: "inline-block", borderRadius: "2px" }} />
                <span style={{ color: "#d1d5db" }}>Times Purchased</span>
              </div>
            </div>

            {/* Bar Chart Graphic Area */}
            <div style={{ height: "180px", position: "relative", borderLeft: "1px solid rgba(255,255,255,0.12)", borderBottom: "1px solid rgba(255,255,255,0.12)", margin: "0 10px 10px 35px", display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
              {/* Y-axis Ticks */}
              <div style={{ position: "absolute", left: "-32px", top: 0, fontSize: "11px", color: "#6b7280" }}>{maxShownInView}</div>
              <div style={{ position: "absolute", left: "-32px", top: "25%", fontSize: "11px", color: "#6b7280" }}>{Math.round(maxShownInView * 0.75)}</div>
              <div style={{ position: "absolute", left: "-32px", top: "50%", fontSize: "11px", color: "#6b7280" }}>{Math.round(maxShownInView * 0.5)}</div>
              <div style={{ position: "absolute", left: "-32px", top: "75%", fontSize: "11px", color: "#6b7280" }}>{Math.round(maxShownInView * 0.25)}</div>
              <div style={{ position: "absolute", left: "-24px", bottom: "-6px", fontSize: "11px", color: "#6b7280" }}>0</div>

              {/* Gridlines */}
              <div style={{ position: "absolute", left: 0, right: 0, top: "25%", borderTop: "1px dashed rgba(255,255,255,0.06)", zIndex: 0 }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed rgba(255,255,255,0.06)", zIndex: 0 }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "75%", borderTop: "1px dashed rgba(255,255,255,0.06)", zIndex: 0 }} />

              {/* Bars */}
              {currentChartItems.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: "12px", alignSelf: "center" }}>No products to display</div>
              ) : (
                currentChartItems.map((item, idx) => {
                  const maxVal = maxShownInView || 80;
                  const shownHeight = item.shown > 0 ? Math.min(100, Math.max(4, (item.shown / maxVal) * 100)) : 0;
                  const purchasedHeight = item.purchased > 0 ? Math.min(100, Math.max(4, (item.purchased / maxVal) * 100)) : 0;
                  const shortLabel = item.name.length > 16 ? item.name.slice(0, 14) + "..." : item.name;

                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "45px", position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "160px", width: "100%", justifyContent: "center" }}>
                        {/* Shown Bar */}
                        <div
                          style={{
                            width: "14px",
                            height: `${shownHeight}%`,
                            background: shownHeight > 0 ? "rgba(0, 204, 255, 0.25)" : "transparent",
                            border: shownHeight > 0 ? "1px solid #00ccff" : "none",
                            borderRadius: "2px 2px 0 0",
                          }}
                          title={`Times Shown: ${item.shown}`}
                        />
                        {/* Purchased Bar */}
                        {purchasedHeight > 0 && (
                          <div
                            style={{
                              width: "14px",
                              height: `${purchasedHeight}%`,
                              background: "rgba(244, 63, 94, 0.3)",
                              border: "1px solid #f43f5e",
                              borderRadius: "2px 2px 0 0",
                            }}
                            title={`Times Purchased: ${item.purchased}`}
                          />
                        )}
                      </div>
                      {/* Tilted Label */}
                      <div
                        style={{
                          position: "absolute",
                          top: "165px",
                          fontSize: "10px",
                          color: "#9ca3af",
                          whiteSpace: "nowrap",
                          transform: "rotate(-35deg)",
                          transformOrigin: "top left",
                          width: "80px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={item.name}
                      >
                        {shortLabel}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", marginTop: "55px", fontSize: "12.5px" }}>
              <button
                type="button"
                onClick={() => setChartPage((p) => Math.max(1, p - 1))}
                disabled={chartPage === 1}
                style={{
                  background: "#1c1c27",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "4px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  cursor: chartPage === 1 ? "not-allowed" : "pointer",
                  color: chartPage === 1 ? "#6b7280" : "#d1d5db",
                }}
              >
                Previous
              </button>
              <span style={{ color: "#9ca3af" }}>
                Page {chartPage} of {totalChartPages}
              </span>
              <button
                type="button"
                onClick={() => setChartPage((p) => Math.min(totalChartPages, p + 1))}
                disabled={chartPage >= totalChartPages}
                style={{
                  background: "#1c1c27",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "4px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  cursor: chartPage >= totalChartPages ? "not-allowed" : "pointer",
                  color: chartPage >= totalChartPages ? "#6b7280" : "#d1d5db",
                }}
              >
                Next
              </button>
            </div>
          </div>

          {/* Chart 2: Revenue Over Time Line Chart */}
          <div
            style={{
              background: "#14141c",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>Revenue Over Time</div>
              <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>Revenue Growth (KShs)</div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "1rem", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "20px", height: "3px", background: "#00ccff", display: "inline-block", borderRadius: "1px" }} />
                <span style={{ color: "#d1d5db" }}>Revenue (KShs)</span>
              </div>
            </div>

            {/* Line Chart Grid Area */}
            <div style={{ height: "180px", position: "relative", borderLeft: "1px solid rgba(255,255,255,0.12)", borderBottom: "1px solid rgba(255,255,255,0.12)", margin: "0 10px 10px 35px" }}>
              {/* Y-axis Ticks */}
              <div style={{ position: "absolute", left: "-32px", top: 0, fontSize: "11px", color: "#6b7280" }}>1.0</div>
              <div style={{ position: "absolute", left: "-32px", top: "11%", fontSize: "11px", color: "#6b7280" }}>0.9</div>
              <div style={{ position: "absolute", left: "-32px", top: "22%", fontSize: "11px", color: "#6b7280" }}>0.8</div>
              <div style={{ position: "absolute", left: "-32px", top: "33%", fontSize: "11px", color: "#6b7280" }}>0.7</div>
              <div style={{ position: "absolute", left: "-32px", top: "44%", fontSize: "11px", color: "#6b7280" }}>0.6</div>
              <div style={{ position: "absolute", left: "-32px", top: "55%", fontSize: "11px", color: "#6b7280" }}>0.5</div>
              <div style={{ position: "absolute", left: "-32px", top: "66%", fontSize: "11px", color: "#6b7280" }}>0.4</div>
              <div style={{ position: "absolute", left: "-32px", top: "77%", fontSize: "11px", color: "#6b7280" }}>0.3</div>
              <div style={{ position: "absolute", left: "-32px", top: "88%", fontSize: "11px", color: "#6b7280" }}>0.2</div>
              <div style={{ position: "absolute", left: "-32px", top: "95%", fontSize: "11px", color: "#6b7280" }}>0.1</div>

              {/* Gridlines */}
              <div style={{ position: "absolute", left: 0, right: 0, top: "20%", borderTop: "1px dashed rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "40%", borderTop: "1px dashed rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "60%", borderTop: "1px dashed rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "80%", borderTop: "1px dashed rgba(255,255,255,0.06)" }} />

              {/* Data Point / Zero State */}
              <div style={{ position: "absolute", left: "20px", bottom: "-5px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00ccff", border: "1px solid #0099cc" }} />
                <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>0</span>
                <span style={{ fontSize: "10px", color: "#6b7280" }}>No Data</span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "55px", fontSize: "12px", color: "#9ca3af" }}>
              Revenue tracking active ({timeRange === "all" ? "All Time" : `Last ${timeRange} Days`})
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div
          style={{
            background: "#14141c",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            marginBottom: "2rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#1a1a24", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#9ca3af" }}>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Product</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "110px" }}>Times Shown</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "110px" }}>Times Purchased</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "130px" }}>Conversion Rate (%)</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "100px" }}>Revenue</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, width: "160px" }}>Recent Impressions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "#6b7280" }}>
                    No conversion metrics found.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: idx < filteredMetrics.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                      color: "#e5e7eb",
                      background: idx % 2 === 1 ? "rgba(255, 255, 255, 0.015)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "0.85rem 1.25rem", color: "#ffffff", fontWeight: 500 }}>
                      {m.name}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "#9ca3af" }}>
                      {m.shown}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "#9ca3af" }}>
                      {m.purchased}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "#9ca3af" }}>
                      {m.conversionRate}%
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "#9ca3af" }}>
                      {m.revenue.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", color: "#9ca3af" }}>
                      {m.recentImpressions}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detailed Conversion Reports Buttons */}
        <div style={{ textAlign: "center", paddingBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", margin: "0 0 1rem 0" }}>
            Detailed Conversion Reports
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={handleDownloadPDF}
              style={{
                background: "#0088cc",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.65rem 1.4rem",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
                boxShadow: "0 2px 8px rgba(0, 136, 204, 0.3)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0077b3")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0088cc")}
            >
              Download PDF Report
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              style={{
                background: "#0088cc",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.65rem 1.4rem",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
                boxShadow: "0 2px 8px rgba(0, 136, 204, 0.3)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0077b3")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0088cc")}
            >
              Download CSV Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
