import { useState } from "react";
import { Link, useLoaderData, useSearchParams, Form, useActionData, useNavigation } from "react-router";
import { getAllProducts, getAllCategories } from "~/lib/content.server";
import { db } from "~/lib/db.server";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const products = getAllProducts(true);
  const categories = getAllCategories(true);
  const dbOrders = await db.order.findMany();
  const dbCoupons = await db.coupon.findMany();

  const fs = await import("fs");
  const path = await import("path");
  const CONTENT_DIR = path.join(process.cwd(), "content");
  const settingsPath = path.join(CONTENT_DIR, "analytics-settings.json");
  let analyticsSettings = {
    excludedStatuses: ["pending", "cancelled", "failed"],
    actionableStatuses: ["on-hold", "processing"],
    defaultDateRange: "june-2026",
    updatesType: "immediate"
  };

  if (fs.existsSync(settingsPath)) {
    try {
      analyticsSettings = { ...analyticsSettings, ...JSON.parse(fs.readFileSync(settingsPath, "utf-8")) };
    } catch (e) {
      console.error("Failed to parse analytics settings:", e);
    }
  }

  return { products, categories, dbOrders, dbCoupons, analyticsSettings, currentUser };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "save_analytics_settings") {
    const fs = await import("fs");
    const path = await import("path");
    const { logHistoryEvent } = await import("~/lib/content.server");

    // Gather excluded statuses
    const excludedStatuses: string[] = [];
    if (formData.get("excluded_pending") === "true") excludedStatuses.push("pending");
    if (formData.get("excluded_on_hold") === "true") excludedStatuses.push("on-hold");
    if (formData.get("excluded_processing") === "true") excludedStatuses.push("processing");
    if (formData.get("excluded_completed") === "true") excludedStatuses.push("completed");
    if (formData.get("excluded_cancelled") === "true") excludedStatuses.push("cancelled");
    if (formData.get("excluded_failed") === "true") excludedStatuses.push("failed");

    // Gather actionable statuses
    const actionableStatuses: string[] = [];
    if (formData.get("actionable_on_hold") === "true") actionableStatuses.push("on-hold");
    if (formData.get("actionable_processing") === "true") actionableStatuses.push("processing");

    const defaultDateRange = formData.get("defaultDateRange")?.toString() || "june-2026";
    const updatesType = formData.get("updatesType")?.toString() || "immediate";

    const updatedSettings = {
      excludedStatuses,
      actionableStatuses,
      defaultDateRange,
      updatesType
    };

    const CONTENT_DIR = path.join(process.cwd(), "content");
    fs.writeFileSync(
      path.join(CONTENT_DIR, "analytics-settings.json"),
      JSON.stringify(updatedSettings, null, 2),
      "utf-8"
    );

    logHistoryEvent(
      currentUser.name,
      "Analytics Settings Updated",
      "Updated the commerce reporting and analytics configuration settings",
      "📈"
    );

    return { success: true };
  }

  return null;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

function AnalyticsChart({
  data,
  lineColor = "#472f8f",
  valuePrefix = "",
  valueSuffix = ""
}: {
  data: ChartDataPoint[];
  lineColor?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">No data for the selected date range</div>;
  }

  const width = 600;
  const height = 180;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = 0;

  const points = data.map((d, index) => {
    const x = paddingLeft + (index / Math.max(1, data.length - 1)) * chartWidth;
    const y = height - paddingBottom - ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L ${p.x},${p.y}`).join(" ");
  }

  let areaD = "";
  if (points.length > 0) {
    areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingBottom} L ${points[0].x},${height - paddingBottom} Z`;
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const y = paddingTop + ratio * chartHeight;
    const value = maxVal - ratio * (maxVal - minVal);
    return { y, value };
  });

  const gradientId = `areaGrad-${lineColor.replace("#", "")}`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={width - paddingRight}
              y2={line.y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 12}
              y={line.y + 4}
              fill="rgba(255,255,255,0.4)"
              fontSize="9"
              textAnchor="end"
            >
              {valuePrefix}{Math.round(line.value).toLocaleString()}{valueSuffix}
            </text>
          </g>
        ))}

        {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 8}
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
            textAnchor="middle"
          >
            {p.label}
          </text>
        ))}

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="14"
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? "6" : "4.5"}
              fill={lineColor}
              stroke="#0d0d12"
              strokeWidth={hoveredIndex === i ? "2" : "1.5"}
              style={{
                transition: "all 0.15s ease-in-out",
                pointerEvents: "none"
              }}
            />
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          style={{
            position: "absolute",
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100 - 15}%`,
            transform: "translate(-50%, -100%)",
            background: "#161622",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "8px 12px",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            pointerEvents: "none",
            zIndex: 10,
            whiteSpace: "nowrap",
            transition: "all 0.1s ease-out"
          }}
        >
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>
            {points[hoveredIndex].label}
          </div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>
            {valuePrefix}{points[hoveredIndex].value.toLocaleString()}{valueSuffix}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VpBackendAnalytics() {
  const { products, categories, dbOrders, dbCoupons, analyticsSettings } = useLoaderData() as any;
  const actionData = useActionData() as { success?: boolean } | undefined;
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "overview";

  // Settings Form states
  const [excludedPending, setExcludedPending] = useState(analyticsSettings.excludedStatuses.includes("pending"));
  const [excludedOnHold, setExcludedOnHold] = useState(analyticsSettings.excludedStatuses.includes("on-hold"));
  const [excludedProcessing, setExcludedProcessing] = useState(analyticsSettings.excludedStatuses.includes("processing"));
  const [excludedCompleted, setExcludedCompleted] = useState(analyticsSettings.excludedStatuses.includes("completed"));
  const [excludedCancelled, setExcludedCancelled] = useState(analyticsSettings.excludedStatuses.includes("cancelled"));
  const [excludedFailed, setExcludedFailed] = useState(analyticsSettings.excludedStatuses.includes("failed"));

  const [actionableOnHold, setActionableOnHold] = useState(analyticsSettings.actionableStatuses.includes("on-hold"));
  const [actionableProcessing, setActionableProcessing] = useState(analyticsSettings.actionableStatuses.includes("processing"));

  const [defaultDateRange, setDefaultDateRange] = useState(analyticsSettings.defaultDateRange);
  const [updatesType, setUpdatesType] = useState(analyticsSettings.updatesType);

  // Date range and show states
  const [dateRange, setDateRange] = useState("june-2026");
  const [showFilter, setShowFilter] = useState("all");

  // Sorting states for orders table
  const [orderSortKey, setOrderSortKey] = useState<"date" | "status" | "itemsSold">("date");
  const [orderSortDirection, setOrderSortDirection] = useState<"asc" | "desc">("desc");

  // Sorting states for other analytical tabs
  const [apSortKey, setApSortKey] = useState<"title" | "items" | "sales" | "stock">("title");
  const [apSortDir, setApSortDir] = useState<"asc" | "desc">("asc");

  const [acSortKey, setAcSortKey] = useState<"name" | "items" | "sales">("name");
  const [acSortDir, setAcSortDir] = useState<"asc" | "desc">("asc");

  const [arSortKey, setArSortKey] = useState<"date" | "orders" | "gross" | "net" | "total">("date");
  const [arSortDir, setArSortDir] = useState<"asc" | "desc">("desc");

  const [avSortKey, setAvSortKey] = useState<"title" | "items" | "sales" | "stock">("title");
  const [avSortDir, setAvSortDir] = useState<"asc" | "desc">("asc");

  const [acoSortKey, setAcoSortKey] = useState<"code" | "discount" | "orders">("code");
  const [acoSortDir, setAcoSortDir] = useState<"asc" | "desc">("asc");

  const [showBanner, setShowBanner] = useState(true);

  const [atSortKey, setAtSortKey] = useState<"rate" | "orders" | "tax">("rate");
  const [atSortDir, setAtSortDir] = useState<"asc" | "desc">("asc");

  const [adSortKey, setAdSortKey] = useState<"title" | "ip" | "user">("title");
  const [adSortDir, setAdSortDir] = useState<"asc" | "desc">("asc");

  const [asSortKey, setAsSortKey] = useState<"name" | "sku" | "stock" | "status">("name");
  const [asSortDir, setAsSortDir] = useState<"asc" | "desc">("asc");

  // Format price helper
  const formatKsh = (amount: number) => {
    return `KSh ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Mocked analytics data consistent with WooCommerce screenshots
  // Dynamic analytics data derived from products, categories and database orders
  const ordersData = [
    { date: "June 4, 2026", orderId: "OR10768", status: "Confirmed", customer: "Howard Isumba", customerType: "New", product: "Optical Cable - 1M", itemsSold: 1, coupon: "-", netSales: 500, attribution: "Direct" },
    { date: "June 3, 2026", orderId: "OR10767", status: "Processing", customer: "John Doe", customerType: "Returning", product: "Sound Pro 450 2.1CH WIRELESS SOUNDBAR", itemsSold: 2, coupon: "VISION8", netSales: 32990, attribution: "Referral" },
    { date: "June 3, 2026", orderId: "OR10766", status: "Completed", customer: "Jane Smith", customerType: "Returning", product: "55\" 4K Frameless QLED Vidaa TV", itemsSold: 1, coupon: "WELCOME500", netSales: 38995, attribution: "Search" },
    { date: "June 2, 2026", orderId: "OR10765", status: "Completed", customer: "Alice Kamau", customerType: "New", product: "43\" FHD Frameless Whale TV Smart TV", itemsSold: 2, coupon: "-", netSales: 41990, attribution: "Direct" }
  ];

  const mergedOrdersData = [
    ...(dbOrders || []).map((o: any) => {
      const itemsText = (o.items || []).map((it: any) => `${it.name}${it.quantity > 1 ? ` (×${it.quantity})` : ''}`).join(", ");
      const itemsCount = (o.items || []).reduce((sum: number, it: any) => sum + it.quantity, 0);
      return {
        date: o.date,
        orderId: o.id,
        status: o.status === "COMPLETED" ? "Completed" : o.status === "PROCESSING" ? "Processing" : o.status === "FAILED" ? "Failed" : "Pending Payment",
        customer: o.billing?.name || "N/A",
        customerType: "New",
        product: itemsText || "N/A",
        itemsSold: itemsCount,
        coupon: o.paymentGatewayData?.couponApplied || "-",
        netSales: o.total - (o.shipping || 0),
        attribution: "Direct",
        paymentMethod: o.paymentMethod || "M-Pesa on Delivery",
        rawItems: o.items || []
      };
    }),
    ...ordersData.map((o: any) => ({
      ...o,
      paymentMethod: o.orderId === "OR10768" ? "iPay" : o.orderId === "OR10767" ? "MPESA Express" : o.orderId === "OR10766" ? "iPay" : "M-Pesa on Delivery",
      rawItems: [
        {
          name: o.product,
          quantity: o.itemsSold,
          price: o.netSales / o.itemsSold
        }
      ]
    }))
  ];

  const isOrderExcluded = (status: string) => {
    const norm = status.toLowerCase();
    if (norm === "pending payment") return analyticsSettings.excludedStatuses.includes("pending");
    if (norm === "confirmed") return analyticsSettings.excludedStatuses.includes("completed");
    return analyticsSettings.excludedStatuses.includes(norm);
  };

  const productsData = products.map((p: any) => {
    let itemsSold = 0;
    let netSales = 0;
    let ordersCount = 0;

    mergedOrdersData.forEach((o: any) => {
      if (isOrderExcluded(o.status)) return;

      let hasProduct = false;
      const orderItems = Array.isArray(o.rawItems) ? o.rawItems : [];
      orderItems.forEach((item: any) => {
        const nameMatch = item.name && (
          item.name.toLowerCase().includes(p.name.toLowerCase()) || 
          p.name.toLowerCase().includes(item.name.toLowerCase())
        );
        const skuMatch = p.sku && item.sku && String(p.sku).toLowerCase() === String(item.sku).toLowerCase();
        const idMatch = item.id && String(item.id) === String(p.id);
        const slugMatch = item.slug && String(item.slug) === String(p.slug);

        if (idMatch || slugMatch || skuMatch || nameMatch) {
          itemsSold += Number(item.quantity) || 0;
          netSales += (Number(item.price) || 0) * (Number(item.quantity) || 0);
          hasProduct = true;
        }
      });

      if (hasProduct) {
        ordersCount += 1;
      }
    });

    const stockVal = p.manageStock !== false && typeof p.lowStockRemaining === "number"
      ? p.lowStockRemaining
      : (p.inStock ? 100 : 0);

    return {
      title: p.name,
      sku: p.sku || "N/A",
      itemsSold,
      netSales,
      ordersCount,
      category: p.categories?.map((c: any) => c.name).join(" • ") || "Uncategorized",
      variations: 0,
      status: p.inStock ? "In stock" : "Out of stock",
      stock: stockVal
    };
  });

  const categoriesData = categories.map((c: any) => {
    let itemsSold = 0;
    let netSales = 0;
    let ordersCount = 0;

    const categoryProducts = products.filter((p: any) =>
      p.categories?.some((cat: any) => cat.slug === c.slug || cat.id === c.id)
    );
    const productsCount = categoryProducts.length;

    mergedOrdersData.forEach((o: any) => {
      if (isOrderExcluded(o.status)) return;

      let hasCategoryProduct = false;
      const orderItems = Array.isArray(o.rawItems) ? o.rawItems : [];
      orderItems.forEach((item: any) => {
        const matchesProduct = categoryProducts.some((p: any) => {
          const nameMatch = item.name && (
            item.name.toLowerCase().includes(p.name.toLowerCase()) || 
            p.name.toLowerCase().includes(item.name.toLowerCase())
          );
          const skuMatch = p.sku && item.sku && String(p.sku).toLowerCase() === String(item.sku).toLowerCase();
          const idMatch = item.id && String(item.id) === String(p.id);
          const slugMatch = item.slug && String(item.slug) === String(p.slug);
          return idMatch || slugMatch || skuMatch || nameMatch;
        });

        if (matchesProduct) {
          itemsSold += Number(item.quantity) || 0;
          netSales += (Number(item.price) || 0) * (Number(item.quantity) || 0);
          hasCategoryProduct = true;
        }
      });

      if (hasCategoryProduct) {
        ordersCount += 1;
      }
    });

    return {
      name: c.name,
      itemsSold,
      netSales,
      productsCount,
      ordersCount
    };
  });

  const paymentStats = {
    "M-Pesa on Delivery": { count: 0, sales: 0 },
    "MPESA Express": { count: 0, sales: 0 },
    "iPay": { count: 0, sales: 0 }
  };

  mergedOrdersData.forEach((ord: any) => {
    const rawMethod = ord.paymentMethod;
    let key: "M-Pesa on Delivery" | "MPESA Express" | "iPay" = "M-Pesa on Delivery";
    if (rawMethod?.toLowerCase().includes("express")) {
      key = "MPESA Express";
    } else if (rawMethod?.toLowerCase().includes("ipay")) {
      key = "iPay";
    }
    if (paymentStats[key]) {
      paymentStats[key].count += 1;
      paymentStats[key].sales += ord.netSales;
    }
  });

  const totalPaymentOrders = Object.values(paymentStats).reduce((sum, p) => sum + p.count, 0) || 1;
  const totalPaymentSales = Object.values(paymentStats).reduce((sum, p) => sum + p.sales, 0) || 1;

  const revenueMap = new Map<string, {
    orders: number;
    grossSales: number;
    returns: number;
    coupons: number;
    netSales: number;
    taxes: number;
    shipping: number;
    totalSales: number;
  }>();

  mergedOrdersData.forEach((o: any) => {
    if (isOrderExcluded(o.status)) return;

    let dateStr = "Unknown Date";
    if (o.date) {
      try {
        const d = new Date(o.date);
        dateStr = d.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) {
        dateStr = String(o.date);
      }
    } else {
      dateStr = "June 1, 2026";
    }

    const current = revenueMap.get(dateStr) || {
      orders: 0,
      grossSales: 0,
      returns: 0,
      coupons: 0,
      netSales: 0,
      taxes: 0,
      shipping: 0,
      totalSales: 0
    };

    let shippingAmt = 0;
    if (o.orderId?.startsWith("OR")) {
      shippingAmt = o.orderId === "OR10768" ? 400 : o.orderId === "OR10767" ? 500 : o.orderId === "OR10766" ? 0 : o.orderId === "OR10765" ? 500 : 0;
    } else {
      const dbOrder = dbOrders.find((dbo: any) => dbo.id === o.orderId);
      if (dbOrder) {
        shippingAmt = Number(dbOrder.shipping) || 0;
      }
    }

    const netAmt = Number(o.netSales) || 0;
    const couponAmt = o.coupon && o.coupon !== "-" ? 500 : 0;
    const totalAmt = netAmt + shippingAmt;
    const grossAmt = netAmt + couponAmt;

    current.orders += 1;
    current.grossSales += grossAmt;
    current.coupons += couponAmt;
    current.shipping += shippingAmt;
    current.netSales += netAmt;
    current.totalSales += totalAmt;

    revenueMap.set(dateStr, current);
  });

  const revenueData = Array.from(revenueMap.entries()).map(([date, val]) => ({
    date,
    ...val
  }));

  revenueData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (revenueData.length === 0) {
    revenueData.push(
      { date: "June 4, 2026", orders: 1, grossSales: 500, returns: 0, coupons: 0, netSales: 500, taxes: 0, shipping: 400, totalSales: 900 },
      { date: "June 3, 2026", orders: 2, grossSales: 71985, returns: 0, coupons: 2500, netSales: 69485, taxes: 0, shipping: 500, totalSales: 72485 },
      { date: "June 2, 2026", orders: 1, grossSales: 41990, returns: 0, coupons: 0, netSales: 41990, taxes: 0, shipping: 500, totalSales: 42490 },
      { date: "June 1, 2026", orders: 0, grossSales: 0, returns: 0, coupons: 0, netSales: 0, taxes: 0, shipping: 0, totalSales: 0 }
    );
  }

  const variationsData = [
    { title: "Optical Cable - 1M", sku: "OPTC", itemsSold: 1, netSales: 500, ordersCount: 1, status: "Out of stock", stock: 0 }
  ];

  // Dynamic coupons calculated from database and mock order history
  const couponsDataList = (dbCoupons || []).map((coupon: any) => {
    const matchingOrdersData = mergedOrdersData.filter(
      (o: any) => o.coupon.toUpperCase() === coupon.code.toUpperCase()
    );

    const totalOrdersCount = matchingOrdersData.length;

    let totalDiscountAmount = 0;
    matchingOrdersData.forEach((o: any) => {
      if (coupon.code === "VISION8") {
        totalDiscountAmount += 2500;
      } else if (coupon.code === "WELCOME500") {
        totalDiscountAmount += 500;
      } else {
        if (coupon.discountType === "percentage") {
          totalDiscountAmount += (o.netSales * coupon.discountValue) / 100;
        } else {
          totalDiscountAmount += coupon.discountValue;
        }
      }
    });

    return {
      code: coupon.code,
      ordersCount: totalOrdersCount,
      amountDiscounted: totalDiscountAmount,
      created: coupon.createdAt || "N/A",
      expires: "Never",
      type: coupon.discountType === "percentage" ? "Percentage discount" : "Fixed cart discount"
    };
  });

  const totalDiscountedOrders = couponsDataList.reduce((sum: number, c: any) => sum + c.ordersCount, 0);
  const totalDiscountedAmount = couponsDataList.reduce((sum: number, c: any) => sum + c.amountDiscounted, 0);

  const handleExportCSV = () => {
    const parseDate = (dStr: string) => {
      const timestamp = Date.parse(dStr);
      return isNaN(timestamp) ? 0 : timestamp;
    };

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return "";
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    let filename = `report-${view}-${new Date().toISOString().slice(0, 10)}.csv`;
    let headers: string[] = [];
    let rows: any[][] = [];

    if (view === "overview") {
      headers = ["Metric", "Value"];
      rows = [
        ["Total Sales", 304730],
        ["Net Sales", 303830],
        ["Orders", 17],
        ["Products Sold", 16],
        ["Variations Sold", 1],
        [],
        ["Top Categories - Category", "Items Sold", "Net Sales"],
        ...categoriesData.slice(0, 5).map((cat: any) => [cat.name, cat.itemsSold, cat.netSales]),
        [],
        ["Top Products - Product", "Items Sold", "Net Sales"],
        ...productsData.slice(0, 5).map((p: any) => [p.title, p.itemsSold, p.netSales])
      ];
    } else if (view === "products") {
      const sorted = [...productsData].sort((a: any, b: any) => {
        let result = 0;
        if (apSortKey === "title") {
          result = (a.title || "").localeCompare(b.title || "");
        } else if (apSortKey === "items") {
          result = (a.itemsSold || 0) - (b.itemsSold || 0);
        } else if (apSortKey === "sales") {
          result = (a.netSales || 0) - (b.netSales || 0);
        } else if (apSortKey === "stock") {
          result = (a.stock || 0) - (b.stock || 0);
        }
        return apSortDir === "asc" ? result : -result;
      });
      headers = ["Product Title", "SKU", "Items Sold", "Net Sales", "Orders", "Category", "Variations", "Status", "Stock"];
      rows = sorted.map((p: any) => [
        p.title,
        p.sku,
        p.itemsSold,
        p.netSales,
        p.ordersCount,
        p.category,
        p.variations,
        p.status,
        p.stock
      ]);
    } else if (view === "revenue") {
      const sorted = [...revenueData].sort((a: any, b: any) => {
        let result = 0;
        if (arSortKey === "date") {
          result = parseDate(a.date) - parseDate(b.date);
        } else if (arSortKey === "orders") {
          result = (a.orders || 0) - (b.orders || 0);
        } else if (arSortKey === "gross") {
          result = (a.grossSales || 0) - (b.grossSales || 0);
        } else if (arSortKey === "net") {
          result = (a.netSales || 0) - (b.netSales || 0);
        } else if (arSortKey === "total") {
          result = (a.totalSales || 0) - (b.totalSales || 0);
        }
        return arSortDir === "asc" ? result : -result;
      });
      headers = ["Date", "Orders", "Gross Sales", "Returns", "Coupons", "Net Sales", "Taxes", "Shipping", "Total Sales"];
      rows = sorted.map((rev: any) => [
        rev.date,
        rev.orders,
        rev.grossSales,
        rev.returns,
        rev.coupons,
        rev.netSales,
        rev.taxes,
        rev.shipping,
        rev.totalSales
      ]);
    } else if (view === "orders") {
      const sorted = [...mergedOrdersData].sort((a: any, b: any) => {
        let result = 0;
        if (orderSortKey === "date") {
          result = parseDate(a.date) - parseDate(b.date);
        } else if (orderSortKey === "status") {
          result = (a.status || "").localeCompare(b.status || "");
        } else if (orderSortKey === "itemsSold") {
          result = (a.itemsSold || 0) - (b.itemsSold || 0);
        }
        return orderSortDirection === "asc" ? result : -result;
      });
      headers = ["Date", "Order ID", "Status", "Customer", "Customer Type", "Product(s)", "Items Sold", "Coupon(s)", "Net Sales", "Payment Method", "Attribution"];
      rows = sorted.map((o: any) => [
        o.date,
        o.orderId,
        o.status,
        o.customer,
        o.customerType,
        o.product,
        o.itemsSold,
        o.coupon,
        o.netSales,
        o.paymentMethod,
        o.attribution
      ]);
    } else if (view === "variations") {
      const sorted = [...variationsData].sort((a: any, b: any) => {
        let result = 0;
        if (avSortKey === "title") {
          result = (a.title || "").localeCompare(b.title || "");
        } else if (avSortKey === "items") {
          result = (a.itemsSold || 0) - (b.itemsSold || 0);
        } else if (avSortKey === "sales") {
          result = (a.netSales || 0) - (b.netSales || 0);
        } else if (avSortKey === "stock") {
          result = (a.stock || 0) - (b.stock || 0);
        }
        return avSortDir === "asc" ? result : -result;
      });
      headers = ["Product / Variation Title", "SKU", "Items Sold", "Net Sales", "Orders", "Status", "Stock"];
      rows = sorted.map((v: any) => [
        v.title,
        v.sku,
        v.itemsSold,
        v.netSales,
        v.ordersCount,
        v.status,
        v.stock
      ]);
    } else if (view === "categories") {
      const sorted = [...categoriesData].sort((a: any, b: any) => {
        let result = 0;
        if (acSortKey === "name") {
          result = (a.name || "").localeCompare(b.name || "");
        } else if (acSortKey === "items") {
          result = (a.itemsSold || 0) - (b.itemsSold || 0);
        } else if (acSortKey === "sales") {
          result = (a.netSales || 0) - (b.netSales || 0);
        }
        return acSortDir === "asc" ? result : -result;
      });
      headers = ["Category", "Items Sold", "Net Sales", "Products Count", "Orders Count"];
      rows = sorted.map((cat: any) => [
        cat.name,
        cat.itemsSold,
        cat.netSales,
        cat.productsCount,
        cat.ordersCount
      ]);
    } else if (view === "coupons") {
      const sorted = [...couponsDataList].sort((a: any, b: any) => {
        let result = 0;
        if (acoSortKey === "code") {
          result = (a.code || "").localeCompare(b.code || "");
        } else if (acoSortKey === "discount") {
          result = (a.amountDiscounted || 0) - (b.amountDiscounted || 0);
        } else if (acoSortKey === "orders") {
          result = (a.ordersCount || 0) - (b.ordersCount || 0);
        }
        return acoSortDir === "asc" ? result : -result;
      });
      headers = ["Coupon Code", "Orders", "Amount Discounted", "Created", "Expires", "Type"];
      rows = sorted.map((c: any) => [
        c.code,
        c.ordersCount,
        c.amountDiscounted,
        c.created,
        c.expires,
        c.type
      ]);
    } else if (view === "taxes") {
      headers = ["Tax Code", "Rate", "Total Tax", "Order Tax", "Shipping Tax", "Orders"];
      rows = [];
    } else if (view === "downloads") {
      headers = ["Date", "Product Title", "File Name", "Order #", "Username", "IP"];
      rows = [];
    } else if (view === "stock") {
      const sorted = [...productsData].sort((a: any, b: any) => {
        let result = 0;
        if (asSortKey === "name") {
          result = (a.title || "").localeCompare(b.title || "");
        } else if (asSortKey === "sku") {
          result = (a.sku || "").localeCompare(b.sku || "");
        } else if (asSortKey === "status") {
          result = (a.status || "").localeCompare(b.status || "");
        } else if (asSortKey === "stock") {
          result = (a.stock || 0) - (b.stock || 0);
        }
        return asSortDir === "asc" ? result : -result;
      });
      headers = ["Product / Variation", "SKU", "Status", "Stock"];
      rows = sorted.map((p: any) => [
        p.title,
        p.sku,
        p.status,
        p.stock
      ]);
    }

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-page">
      <style dangerouslySetInnerHTML={{ __html: `
        .analytics-page {
          padding: 40px;
          background: #0d0d12;
          min-height: 100vh;
          font-family: 'Poppins', sans-serif;
          color: #f3f4f6;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .analytics-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        /* Filter Toolbar */
        .analytics-toolbar {
          background: #07070a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          gap: 20px;
          align-items: center;
          margin-bottom: 24px;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .btn-export-csv {
          background: rgba(0, 204, 255, 0.08);
          border: 1px solid rgba(0, 204, 255, 0.2);
          color: #00ccff;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }

        .btn-export-csv:hover {
          background: #00ccff;
          color: #0d0d12;
          box-shadow: 0 0 12px rgba(0, 204, 255, 0.3);
        }

        .toolbar-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .toolbar-group label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .toolbar-select {
          background: #111116;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          min-width: 220px;
        }

        .toolbar-select:focus {
          border-color: #472f8f;
        }

        /* Performance Tiles */
        .analytics-tiles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .performance-tile {
          background: #07070a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          position: relative;
          transition: all 0.3s ease;
        }

        .performance-tile:hover {
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .tile-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
        }

        .tile-value {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .tile-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .tile-badge.negative {
          background: rgba(71, 47, 143, 0.1);
          color: #ff4d62;
        }

        .tile-badge.positive {
          background: rgba(46, 213, 115, 0.1);
          color: #2ed573;
        }

        .tile-badge.neutral {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
        }

        /* Chart container */
        .chart-card {
          background: #07070a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .chart-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }

        .chart-body {
          position: relative;
          height: 250px;
          width: 100%;
        }

        .chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
        }

        /* Leaderboard and tables */
        .analytics-table-card {
          background: #07070a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          overflow-x: auto;
        }

        .table-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 20px;
        }

        .leaderboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .analytics-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .analytics-table th {
          font-size: 11px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .analytics-table td {
          font-size: 13px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          color: rgba(255, 255, 255, 0.85);
        }

        .analytics-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
          color: #ffffff;
        }

        .text-right {
          text-align: right;
        }

        /* Badges */
        .status-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .status-badge.in-stock {
          background: rgba(46, 213, 115, 0.1);
          color: #2ed573;
        }

        .status-badge.out-of-stock {
          background: rgba(71, 47, 143, 0.1);
          color: #ff4d62;
        }

        .status-badge.confirmed {
          background: rgba(0, 204, 255, 0.1);
          color: #00ccff;
        }

        .status-badge.processing {
          background: rgba(255, 165, 2, 0.1);
          color: #ffa502;
        }

        /* Settings card forms */
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .settings-row {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding-bottom: 24px;
        }

        .settings-label-col h4 {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .settings-label-col p {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .settings-input-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .checkbox-group input {
          width: 16px;
          height: 16px;
          accent-color: #472f8f;
        }

        .btn-settings {
          background: #472f8f;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
          align-self: flex-start;
        }

        .btn-settings:hover {
          background: #ff1f3b;
        }

        /* Info Alert */
        .info-alert {
          background: rgba(0, 204, 255, 0.05);
          border: 1px solid rgba(0, 204, 255, 0.15);
          color: #00ccff;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 12px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-alert a {
          color: #00ccff;
          text-decoration: underline;
        }

        .success-toast {
          background: rgba(46, 213, 115, 0.1);
          border: 1px solid rgba(46, 213, 115, 0.3);
          color: #2ed573;
          border-radius: 6px;
          padding: 12px 18px;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}} />

      {/* Top Banner Alert */}
      {showBanner && (
      <div className="info-alert">
        <span>Analytics now supports scheduled updates, providing improved performance. Enable it in <Link to="/store_backend/analytics?view=settings">Settings</Link>.</span>
        <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setShowBanner(false)}>×</span>
      </div>
      )}

      <div className="analytics-header">
        <h2>{view.charAt(0).toUpperCase() + view.slice(1)}</h2>
      </div>

      {/* Toolbar Filter */}
      <div className="analytics-toolbar">
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="toolbar-group">
            <label>Date range</label>
            <select
              className="toolbar-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="june-2026">Month to date (Jun 1 - 4, 2026)</option>
              <option value="last-year">Previous year (Jun 1 - 4, 2025)</option>
            </select>
          </div>

          <div className="toolbar-group">
            <label>Show</label>
            <select
              className="toolbar-select"
              value={showFilter}
              onChange={(e) => setShowFilter(e.target.value)}
            >
              <option value="all">All {view}</option>
              <option value="top">Top 10 Only</option>
            </select>
          </div>
        </div>

        {view !== "settings" && (
          <div style={{ alignSelf: "flex-end", marginBottom: "4px" }}>
            <button
              type="button"
              className="btn-export-csv"
              onClick={handleExportCSV}
            >
              <span style={{ marginRight: "6px" }}>⬇</span> Export CSV
            </button>
          </div>
        )}
      </div>

      {/* RENDER DYNAMIC DASHBOARDS */}
      {view === "overview" && (
        <>
          {/* Performance Summary Cards */}
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Total sales</div>
              <div className="tile-value">{formatKsh(304730)}</div>
              <span className="tile-badge negative">-99%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Net sales</div>
              <div className="tile-value">{formatKsh(303830)}</div>
              <span className="tile-badge negative">-100%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Orders</div>
              <div className="tile-value">17</div>
              <span className="tile-badge negative">-83%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Products sold</div>
              <div className="tile-value">16</div>
              <span className="tile-badge positive">80%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Variations sold</div>
              <div className="tile-value">1</div>
              <span className="tile-badge neutral">0%</span>
            </div>
          </div>

          {/* Line Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Net sales</span>
              </div>
              <div className="chart-body">
                <AnalyticsChart
                  data={[
                    { label: "Jun 1", value: 10500 },
                    { label: "Jun 2", value: 34990 },
                    { label: "Jun 3", value: 198900 },
                    { label: "Jun 4", value: 60340 }
                  ]}
                  lineColor="#2ed573"
                  valuePrefix="KSh "
                />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Orders</span>
              </div>
              <div className="chart-body">
                <AnalyticsChart
                  data={[
                    { label: "Jun 1", value: 1 },
                    { label: "Jun 2", value: 2 },
                    { label: "Jun 3", value: 11 },
                    { label: "Jun 4", value: 3 }
                  ]}
                  lineColor="#00ccff"
                />
              </div>
            </div>
          </div>

          {/* Leaderboard Lists */}
          <div className="leaderboard-grid">
            <div className="analytics-table-card">
              <div className="table-title">Top categories - items sold</div>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Items sold</th>
                    <th className="text-right">Net sales</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesData.slice(0, 5).map((cat: any, i: number) => (
                    <tr key={i}>
                      <td>{cat.name}</td>
                      <td className="text-right">{cat.itemsSold}</td>
                      <td className="text-right">{formatKsh(cat.netSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="analytics-table-card">
              <div className="table-title">Top products - items sold</div>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Items sold</th>
                    <th className="text-right">Net sales</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.slice(0, 5).map((p: any, i: number) => (
                    <tr key={i}>
                      <td>{p.title}</td>
                      <td className="text-right">{p.itemsSold}</td>
                      <td className="text-right">{formatKsh(p.netSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "products" && (
        <>
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Items sold</div>
              <div className="tile-value">16</div>
              <span className="tile-badge positive">60%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Net sales</div>
              <div className="tile-value">{formatKsh(303830)}</div>
              <span className="tile-badge positive">39%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Orders</div>
              <div className="tile-value">16</div>
              <span className="tile-badge positive">60%</span>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Items sold</span>
            </div>
            <div className="chart-body">
              <AnalyticsChart
                data={[
                  { label: "Jun 1", value: 1 },
                  { label: "Jun 2", value: 2 },
                  { label: "Jun 3", value: 9 },
                  { label: "Jun 4", value: 4 }
                ]}
                lineColor="#2ed573"
              />
            </div>
          </div>

          {(() => {
            const handleApSort = (key: "title" | "items" | "sales" | "stock") => {
              if (apSortKey === key) {
                setApSortDir(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setApSortKey(key);
                setApSortDir("asc");
              }
            };

            const renderApSortIndicator = (key: "title" | "items" | "sales" | "stock") => {
              if (apSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
              return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{apSortDir === "asc" ? "▲" : "▼"}</span>;
            };

            const sortedProductsData = [...productsData].sort((a, b) => {
              let result = 0;
              if (apSortKey === "title") {
                result = (a.title || "").localeCompare(b.title || "");
              } else if (apSortKey === "items") {
                result = (a.itemsSold || 0) - (b.itemsSold || 0);
              } else if (apSortKey === "sales") {
                result = (a.netSales || 0) - (b.netSales || 0);
              } else if (apSortKey === "stock") {
                result = (a.stock || 0) - (b.stock || 0);
              }
              return apSortDir === "asc" ? result : -result;
            });

            return (
              <div className="analytics-table-card">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleApSort("title")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Product title {renderApSortIndicator("title")}
                      </th>
                      <th>SKU</th>
                      <th onClick={() => handleApSort("items")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Items sold {renderApSortIndicator("items")}
                      </th>
                      <th onClick={() => handleApSort("sales")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Net sales {renderApSortIndicator("sales")}
                      </th>
                      <th className="text-right">Orders</th>
                      <th>Category</th>
                      <th className="text-right">Variations</th>
                      <th>Status</th>
                      <th onClick={() => handleApSort("stock")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Stock {renderApSortIndicator("stock")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProductsData.map((p, i) => (
                      <tr key={i}>
                        <td>{p.title}</td>
                        <td>{p.sku}</td>
                        <td className="text-right">{p.itemsSold}</td>
                        <td className="text-right">{formatKsh(p.netSales)}</td>
                        <td className="text-right">{p.ordersCount}</td>
                        <td>{p.category}</td>
                        <td className="text-right">{p.variations}</td>
                        <td>
                          <span className={`status-badge ${p.status.toLowerCase().replace(" ", "-")}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="text-right">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {view === "revenue" && (
        <>
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Gross sales</div>
              <div className="tile-value">{formatKsh(304730)}</div>
              <span className="tile-badge negative">-100%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Returns</div>
              <div className="tile-value">KSh 0.00</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Coupons</div>
              <div className="tile-value">KSh 2,500.00</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Net sales</div>
              <div className="tile-value">{formatKsh(303830)}</div>
              <span className="tile-badge negative">-100%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Shipping</div>
              <div className="tile-value">KSh 1,400.00</div>
              <span className="tile-badge negative">-100%</span>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Gross sales</span>
            </div>
            <div className="chart-body">
              <AnalyticsChart
                data={[
                  { label: "Jun 1", value: 10500 },
                  { label: "Jun 2", value: 34990 },
                  { label: "Jun 3", value: 198900 },
                  { label: "Jun 4", value: 59440 }
                ]}
                lineColor="#2ed573"
                valuePrefix="KSh "
              />
            </div>
          </div>

          {(() => {
            const handleArSort = (key: "date" | "orders" | "gross" | "net" | "total") => {
              if (arSortKey === key) {
                setArSortDir(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setArSortKey(key);
                setArSortDir("desc");
              }
            };

            const renderArSortIndicator = (key: "date" | "orders" | "gross" | "net" | "total") => {
              if (arSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
              return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{arSortDir === "asc" ? "▲" : "▼"}</span>;
            };

            const parseDate = (dStr: string) => {
              const timestamp = Date.parse(dStr);
              return isNaN(timestamp) ? 0 : timestamp;
            };

            const sortedRevenueData = [...revenueData].sort((a, b) => {
              let result = 0;
              if (arSortKey === "date") {
                result = parseDate(a.date) - parseDate(b.date);
              } else if (arSortKey === "orders") {
                result = (a.orders || 0) - (b.orders || 0);
              } else if (arSortKey === "gross") {
                result = (a.grossSales || 0) - (b.grossSales || 0);
              } else if (arSortKey === "net") {
                result = (a.netSales || 0) - (b.netSales || 0);
              } else if (arSortKey === "total") {
                result = (a.totalSales || 0) - (b.totalSales || 0);
              }
              return arSortDir === "asc" ? result : -result;
            });

            return (
              <div className="analytics-table-card">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleArSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Date {renderArSortIndicator("date")}
                      </th>
                      <th onClick={() => handleArSort("orders")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Orders {renderArSortIndicator("orders")}
                      </th>
                      <th onClick={() => handleArSort("gross")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Gross sales {renderArSortIndicator("gross")}
                      </th>
                      <th className="text-right">Returns</th>
                      <th className="text-right">Coupons</th>
                      <th onClick={() => handleArSort("net")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Net sales {renderArSortIndicator("net")}
                      </th>
                      <th className="text-right">Taxes</th>
                      <th className="text-right">Shipping</th>
                      <th onClick={() => handleArSort("total")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Total sales {renderArSortIndicator("total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRevenueData.map((rev, i) => (
                      <tr key={i}>
                        <td>{rev.date}</td>
                        <td className="text-right">{rev.orders}</td>
                        <td className="text-right">{formatKsh(rev.grossSales)}</td>
                        <td className="text-right">{formatKsh(rev.returns)}</td>
                        <td className="text-right">{formatKsh(rev.coupons)}</td>
                        <td className="text-right">{formatKsh(rev.netSales)}</td>
                        <td className="text-right">{formatKsh(rev.taxes)}</td>
                        <td className="text-right">{formatKsh(rev.shipping)}</td>
                        <td className="text-right">{formatKsh(rev.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {view === "orders" && (
        <>
          {(() => {
            const totalNetSalesSum = mergedOrdersData.reduce((sum, o) => sum + o.netSales, 0);
            const totalOrdersCount = mergedOrdersData.length;
            const avgOrderValue = totalNetSalesSum / (totalOrdersCount || 1);
            const totalItemsSold = mergedOrdersData.reduce((sum, o) => sum + o.itemsSold, 0);
            const avgItemsPerOrder = (totalItemsSold / (totalOrdersCount || 1)).toFixed(1);

            const parseDate = (dStr: string) => {
              const timestamp = Date.parse(dStr);
              return isNaN(timestamp) ? 0 : timestamp;
            };

            const sortedOrdersData = [...mergedOrdersData].sort((a, b) => {
              let result = 0;
              if (orderSortKey === "date") {
                result = parseDate(a.date) - parseDate(b.date);
              } else if (orderSortKey === "status") {
                result = (a.status || "").localeCompare(b.status || "");
              } else if (orderSortKey === "itemsSold") {
                result = (a.itemsSold || 0) - (b.itemsSold || 0);
              }
              return orderSortDirection === "asc" ? result : -result;
            });

            const handleSort = (key: "date" | "status" | "itemsSold") => {
              if (orderSortKey === key) {
                setOrderSortDirection(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setOrderSortKey(key);
                setOrderSortDirection("desc");
              }
            };

            const renderSortIndicator = (key: "date" | "status" | "itemsSold") => {
              if (orderSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
              return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{orderSortDirection === "asc" ? "▲" : "▼"}</span>;
            };

            return (
              <>
                <div className="analytics-tiles-grid">
                  <div className="performance-tile">
                    <div className="tile-label">Orders</div>
                    <div className="tile-value">{totalOrdersCount}</div>
                    <span className="tile-badge positive">+15%</span>
                  </div>
                  <div className="performance-tile">
                    <div className="tile-label">Net sales</div>
                    <div className="tile-value">{formatKsh(totalNetSalesSum)}</div>
                    <span className="tile-badge positive">+28%</span>
                  </div>
                  <div className="performance-tile">
                    <div className="tile-label">Average order value</div>
                    <div className="tile-value">{formatKsh(avgOrderValue)}</div>
                    <span className="tile-badge positive">+12%</span>
                  </div>
                  <div className="performance-tile">
                    <div className="tile-label">Average items per order</div>
                    <div className="tile-value">{avgItemsPerOrder}</div>
                    <span className="tile-badge neutral">0%</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "24px" }}>
                  <div className="chart-card" style={{ marginBottom: 0 }}>
                    <div className="chart-header">
                      <span className="chart-title">Orders</span>
                    </div>
                    <div className="chart-body">
                      <AnalyticsChart
                        data={[
                          { label: "Jun 1", value: mergedOrdersData.filter(o => o.date.includes("June 1") || o.date.includes("Jun 1")).length },
                          { label: "Jun 2", value: mergedOrdersData.filter(o => o.date.includes("June 2") || o.date.includes("Jun 2")).length },
                          { label: "Jun 3", value: mergedOrdersData.filter(o => o.date.includes("June 3") || o.date.includes("Jun 3")).length },
                          { label: "Jun 4", value: mergedOrdersData.filter(o => o.date.includes("June 4") || o.date.includes("Jun 4")).length }
                        ]}
                        lineColor="#00ccff"
                      />
                    </div>
                  </div>

                  <div className="chart-card" style={{ marginBottom: 0 }}>
                    <div className="chart-header">
                      <span className="chart-title">Payment Methods Distribution</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>
                      {Object.entries(paymentStats).map(([method, data]) => {
                        const pctOrders = Math.round((data.count / totalPaymentOrders) * 100);
                        const color = method === "MPESA Express" ? "#00ccff" : method === "iPay" ? "#472f8f" : "#2ed573";
                        return (
                          <div key={method} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                              <span style={{ fontWeight: "600" }}>{method}</span>
                              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                                {data.count} order{data.count !== 1 ? 's' : ''} ({pctOrders}%) — <strong>{formatKsh(data.sales)}</strong>
                              </span>
                            </div>
                            <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pctOrders}%`, background: color, borderRadius: "4px" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="analytics-table-card">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Date {renderSortIndicator("date")}
                        </th>
                        <th>Order #</th>
                        <th onClick={() => handleSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Status {renderSortIndicator("status")}
                        </th>
                        <th>Customer</th>
                        <th>Customer type</th>
                        <th>Product(s)</th>
                        <th onClick={() => handleSort("itemsSold")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                          Items sold {renderSortIndicator("itemsSold")}
                        </th>
                        <th>Coupon(s)</th>
                        <th className="text-right">Net sales</th>
                        <th>Payment Method</th>
                        <th>Attribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOrdersData.map((ord, i) => (
                        <tr key={i}>
                          <td>{ord.date}</td>
                          <td>
                            <span style={{ color: "#00ccff", textDecoration: "underline", cursor: "pointer" }}>
                              {ord.orderId}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${ord.status.toLowerCase().replace(" ", "-")}`}>
                              {ord.status}
                            </span>
                          </td>
                          <td>{ord.customer}</td>
                          <td>{ord.customerType}</td>
                          <td style={{ color: "#00ccff" }}>{ord.product}</td>
                          <td className="text-right">{ord.itemsSold}</td>
                          <td>{ord.coupon}</td>
                          <td className="text-right">{formatKsh(ord.netSales)}</td>
                          <td>
                            <span style={{
                              fontWeight: "600",
                              color: ord.paymentMethod === "MPESA Express" ? "#00ccff" : ord.paymentMethod === "iPay" ? "#472f8f" : "#2ed573"
                            }}>
                              {ord.paymentMethod}
                            </span>
                          </td>
                          <td>{ord.attribution}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </>
      )}

      {view === "variations" && (
        <>
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Items sold</div>
              <div className="tile-value">1</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Net sales</div>
              <div className="tile-value">{formatKsh(500)}</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Orders</div>
              <div className="tile-value">1</div>
              <span className="tile-badge neutral">0%</span>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Items sold</span>
            </div>
            <div className="chart-body">
              <AnalyticsChart
                data={[
                  { label: "Jun 1", value: 0 },
                  { label: "Jun 2", value: 0 },
                  { label: "Jun 3", value: 1 },
                  { label: "Jun 4", value: 0 }
                ]}
                lineColor="#2ed573"
              />
            </div>
          </div>

          {(() => {
            const handleAvSort = (key: "title" | "items" | "sales" | "stock") => {
              if (avSortKey === key) {
                setAvSortDir(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setAvSortKey(key);
                setAvSortDir("asc");
              }
            };

            const renderAvSortIndicator = (key: "title" | "items" | "sales" | "stock") => {
              if (avSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
              return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{avSortDir === "asc" ? "▲" : "▼"}</span>;
            };

            const sortedVariationsData = [...variationsData].sort((a, b) => {
              let result = 0;
              if (avSortKey === "title") {
                result = (a.title || "").localeCompare(b.title || "");
              } else if (avSortKey === "items") {
                result = (a.itemsSold || 0) - (b.itemsSold || 0);
              } else if (avSortKey === "sales") {
                result = (a.netSales || 0) - (b.netSales || 0);
              } else if (avSortKey === "stock") {
                result = (a.stock || 0) - (b.stock || 0);
              }
              return avSortDir === "asc" ? result : -result;
            });

            return (
              <div className="analytics-table-card">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleAvSort("title")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Product / Variation title {renderAvSortIndicator("title")}
                      </th>
                      <th>SKU</th>
                      <th onClick={() => handleAvSort("items")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Items sold {renderAvSortIndicator("items")}
                      </th>
                      <th onClick={() => handleAvSort("sales")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Net sales {renderAvSortIndicator("sales")}
                      </th>
                      <th className="text-right">Orders</th>
                      <th>Status</th>
                      <th onClick={() => handleAvSort("stock")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Stock {renderAvSortIndicator("stock")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVariationsData.map((v, i) => (
                      <tr key={i}>
                        <td>{v.title}</td>
                        <td>{v.sku}</td>
                        <td className="text-right">{v.itemsSold}</td>
                        <td className="text-right">{formatKsh(v.netSales)}</td>
                        <td className="text-right">{v.ordersCount}</td>
                        <td>
                          <span className={`status-badge ${v.status.toLowerCase().replace(" ", "-")}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="text-right">{v.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {view === "categories" && (
        <>
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Items sold</div>
              <div className="tile-value">16</div>
              <span className="tile-badge positive">60%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Net sales</div>
              <div className="tile-value">{formatKsh(303830)}</div>
              <span className="tile-badge positive">39%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Orders</div>
              <div className="tile-value">16</div>
              <span className="tile-badge positive">60%</span>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Items sold</span>
            </div>
            <div className="chart-body">
              <AnalyticsChart
                data={[
                  { label: "Jun 1", value: 1 },
                  { label: "Jun 2", value: 2 },
                  { label: "Jun 3", value: 9 },
                  { label: "Jun 4", value: 4 }
                ]}
                lineColor="#2ed573"
              />
            </div>
          </div>

          {(() => {
            const handleAcSort = (key: "name" | "items" | "sales") => {
              if (acSortKey === key) {
                setAcSortDir(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setAcSortKey(key);
                setAcSortDir("asc");
              }
            };

            const renderAcSortIndicator = (key: "name" | "items" | "sales") => {
              if (acSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
              return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{acSortDir === "asc" ? "▲" : "▼"}</span>;
            };

            const sortedCategoriesData = [...categoriesData].sort((a, b) => {
              let result = 0;
              if (acSortKey === "name") {
                result = (a.name || "").localeCompare(b.name || "");
              } else if (acSortKey === "items") {
                result = (a.itemsSold || 0) - (b.itemsSold || 0);
              } else if (acSortKey === "sales") {
                result = (a.netSales || 0) - (b.netSales || 0);
              }
              return acSortDir === "asc" ? result : -result;
            });

            return (
              <div className="analytics-table-card">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleAcSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Category {renderAcSortIndicator("name")}
                      </th>
                      <th onClick={() => handleAcSort("items")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Items sold {renderAcSortIndicator("items")}
                      </th>
                      <th onClick={() => handleAcSort("sales")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Net sales {renderAcSortIndicator("sales")}
                      </th>
                      <th className="text-right">Products</th>
                      <th className="text-right">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCategoriesData.map((cat, i) => (
                      <tr key={i}>
                        <td>{cat.name}</td>
                        <td className="text-right">{cat.itemsSold}</td>
                        <td className="text-right">{formatKsh(cat.netSales)}</td>
                        <td className="text-right">{cat.productsCount}</td>
                        <td className="text-right">{cat.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {view === "coupons" && (
        <>
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Discounted orders</div>
              <div className="tile-value">{totalDiscountedOrders}</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Amount</div>
              <div className="tile-value">{formatKsh(totalDiscountedAmount)}</div>
              <span className="tile-badge neutral">0%</span>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Discounted orders</span>
            </div>
            <div className="chart-body">
              {totalDiscountedOrders > 0 ? (
                <AnalyticsChart
                  data={[
                    { label: "Jun 1", value: 0 },
                    { label: "Jun 2", value: 0 },
                    { label: "Jun 3", value: 2 },
                    { label: "Jun 4", value: (dbOrders || []).filter((o: any) => o.paymentGatewayData?.couponApplied).length }
                  ]}
                  lineColor="#472f8f"
                />
              ) : (
                <div className="chart-empty">No data for the selected date range</div>
              )}
            </div>
          </div>

          {(() => {
            const handleAcoSort = (key: "code" | "discount" | "orders") => {
              if (acoSortKey === key) {
                setAcoSortDir(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setAcoSortKey(key);
                setAcoSortDir("asc");
              }
            };

            const renderAcoSortIndicator = (key: "code" | "discount" | "orders") => {
              if (acoSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
              return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{acoSortDir === "asc" ? "▲" : "▼"}</span>;
            };

            const sortedCouponsDataList = [...couponsDataList].sort((a, b) => {
              let result = 0;
              if (acoSortKey === "code") {
                result = (a.code || "").localeCompare(b.code || "");
              } else if (acoSortKey === "discount") {
                result = (a.amountDiscounted || 0) - (b.amountDiscounted || 0);
              } else if (acoSortKey === "orders") {
                result = (a.ordersCount || 0) - (b.ordersCount || 0);
              }
              return acoSortDir === "asc" ? result : -result;
            });

            return (
              <div className="analytics-table-card">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleAcoSort("code")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Coupon code {renderAcoSortIndicator("code")}
                      </th>
                      <th onClick={() => handleAcoSort("orders")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Orders {renderAcoSortIndicator("orders")}
                      </th>
                      <th onClick={() => handleAcoSort("discount")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Amount discounted {renderAcoSortIndicator("discount")}
                      </th>
                      <th>Created</th>
                      <th>Expires</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCouponsDataList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "40px" }}>
                          No data to display
                        </td>
                      </tr>
                    ) : (
                      sortedCouponsDataList.map((c: any, i: number) => (
                        <tr key={i}>
                          <td>{c.code}</td>
                          <td className="text-right">{c.ordersCount}</td>
                          <td className="text-right">{formatKsh(c.amountDiscounted)}</td>
                          <td>{c.created}</td>
                          <td>{c.expires}</td>
                          <td>{c.type}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {view === "taxes" && (
        <>
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Total tax</div>
              <div className="tile-value">KSh 0.00</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Order tax</div>
              <div className="tile-value">KSh 0.00</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Shipping tax</div>
              <div className="tile-value">KSh 0.00</div>
              <span className="tile-badge neutral">0%</span>
            </div>
            <div className="performance-tile">
              <div className="tile-label">Orders</div>
              <div className="tile-value">0</div>
              <span className="tile-badge neutral">0%</span>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Total tax</span>
            </div>
            <div className="chart-body">
              <div className="chart-empty">No data for the selected date range</div>
            </div>
          </div>

          <div className="analytics-table-card">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Tax code</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Total tax</th>
                  <th className="text-right">Order tax</th>
                  <th className="text-right">Shipping tax</th>
                  <th className="text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "40px" }}>
                    No data to display
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "downloads" && (
        <>
          <div className="analytics-tiles-grid">
            <div className="performance-tile">
              <div className="tile-label">Downloads</div>
              <div className="tile-value">0</div>
              <span className="tile-badge neutral">0%</span>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Downloads</span>
            </div>
            <div className="chart-body">
              <div className="chart-empty">No data for the selected date range</div>
            </div>
          </div>

          <div className="analytics-table-card">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product title</th>
                  <th>File name</th>
                  <th>Order #</th>
                  <th>Username</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "40px" }}>
                    No data to display
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "stock" && (
        <>
          {(() => {
            const handleAsSort = (key: "name" | "sku" | "status" | "stock") => {
              if (asSortKey === key) {
                setAsSortDir(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setAsSortKey(key);
                setAsSortDir("asc");
              }
            };

            const renderAsSortIndicator = (key: "name" | "sku" | "status" | "stock") => {
              if (asSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
              return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{asSortDir === "asc" ? "▲" : "▼"}</span>;
            };

            const sortedStockData = [...productsData].sort((a, b) => {
              let result = 0;
              if (asSortKey === "name") {
                result = (a.title || "").localeCompare(b.title || "");
              } else if (asSortKey === "sku") {
                result = (a.sku || "").localeCompare(b.sku || "");
              } else if (asSortKey === "status") {
                result = (a.status || "").localeCompare(b.status || "");
              } else if (asSortKey === "stock") {
                result = (a.stock || 0) - (b.stock || 0);
              }
              return asSortDir === "asc" ? result : -result;
            });

            return (
              <div className="analytics-table-card">
                <div className="table-title">Stock Status Directory</div>
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleAsSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Product / Variation {renderAsSortIndicator("name")}
                      </th>
                      <th onClick={() => handleAsSort("sku")} style={{ cursor: "pointer", userSelect: "none" }}>
                        SKU {renderAsSortIndicator("sku")}
                      </th>
                      <th onClick={() => handleAsSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Status {renderAsSortIndicator("status")}
                      </th>
                      <th onClick={() => handleAsSort("stock")} className="text-right" style={{ cursor: "pointer", userSelect: "none" }}>
                        Stock {renderAsSortIndicator("stock")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStockData.map((p, i) => (
                      <tr key={i}>
                        <td>{p.title}</td>
                        <td>{p.sku}</td>
                        <td>
                          <span className={`status-badge ${p.status.toLowerCase().replace(" ", "-")}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="text-right">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {view === "settings" && (
        <Form method="post" className="analytics-table-card">
          <input type="hidden" name="intent" value="save_analytics_settings" />
          
          <div className="table-title" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
            Analytics Settings
          </div>

          {actionData?.success && (
            <div className="success-toast" style={{ margin: "20px 0 0 0" }}>
              ✓ Settings saved successfully. Reports will update accordingly.
            </div>
          )}

          <div className="settings-grid" style={{ marginTop: "24px" }}>
            <div className="settings-row">
              <div className="settings-label-col">
                <h4>Excluded statuses</h4>
                <p>Orders with these statuses are excluded from the totals in your reports.</p>
              </div>
              <div className="settings-input-col">
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={excludedPending}
                    onChange={(e) => setExcludedPending(e.target.checked)}
                  />
                  Pending Payment
                  <input type="hidden" name="excluded_pending" value={excludedPending ? "true" : "false"} />
                </label>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={excludedOnHold}
                    onChange={(e) => setExcludedOnHold(e.target.checked)}
                  />
                  On Hold
                  <input type="hidden" name="excluded_on_hold" value={excludedOnHold ? "true" : "false"} />
                </label>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={excludedProcessing}
                    onChange={(e) => setExcludedProcessing(e.target.checked)}
                  />
                  Processing
                  <input type="hidden" name="excluded_processing" value={excludedProcessing ? "true" : "false"} />
                </label>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={excludedCompleted}
                    onChange={(e) => setExcludedCompleted(e.target.checked)}
                  />
                  Completed
                  <input type="hidden" name="excluded_completed" value={excludedCompleted ? "true" : "false"} />
                </label>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={excludedCancelled}
                    onChange={(e) => setExcludedCancelled(e.target.checked)}
                  />
                  Cancelled
                  <input type="hidden" name="excluded_cancelled" value={excludedCancelled ? "true" : "false"} />
                </label>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={excludedFailed}
                    onChange={(e) => setExcludedFailed(e.target.checked)}
                  />
                  Failed
                  <input type="hidden" name="excluded_failed" value={excludedFailed ? "true" : "false"} />
                </label>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-label-col">
                <h4>Actionable statuses</h4>
                <p>Orders with these statuses require action. They will show up in the Tasks list.</p>
              </div>
              <div className="settings-input-col">
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={actionableOnHold}
                    onChange={(e) => setActionableOnHold(e.target.checked)}
                  />
                  On Hold
                  <input type="hidden" name="actionable_on_hold" value={actionableOnHold ? "true" : "false"} />
                </label>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={actionableProcessing}
                    onChange={(e) => setActionableProcessing(e.target.checked)}
                  />
                  Processing
                  <input type="hidden" name="actionable_processing" value={actionableProcessing ? "true" : "false"} />
                </label>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-label-col">
                <h4>Default date range</h4>
                <p>Select a default date range. When no range is selected, reports will be viewed by the default range.</p>
              </div>
              <div className="settings-input-col">
                <select
                  className="toolbar-select"
                  name="defaultDateRange"
                  value={defaultDateRange}
                  onChange={(e) => setDefaultDateRange(e.target.value)}
                >
                  <option value="june-2026">Month to date (Jun 1 - 4, 2026)</option>
                  <option value="year">Year to date</option>
                </select>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-label-col">
                <h4>Updates</h4>
                <p>Select whether data reports update in real-time or via schedules.</p>
              </div>
              <div className="settings-input-col">
                <label className="checkbox-group">
                  <input
                    type="radio"
                    name="updatesType"
                    value="scheduled"
                    checked={updatesType === "scheduled"}
                    onChange={() => setUpdatesType("scheduled")}
                  />
                  Scheduled (updates every 12 hours)
                </label>
                <label className="checkbox-group">
                  <input
                    type="radio"
                    name="updatesType"
                    value="immediate"
                    checked={updatesType === "immediate"}
                    onChange={() => setUpdatesType("immediate")}
                  />
                  Immediately (real-time aggregation)
                </label>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button type="submit" disabled={isSaving} className="btn-settings">
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}
