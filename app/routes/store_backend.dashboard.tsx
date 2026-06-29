import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { getAllProducts } from "~/lib/content.server";
import { db } from "~/lib/db.server";
import type { Order } from "~/lib/db.server";
import { query } from "~/db.server";

export async function loader() {
  const orders = await db.order.findMany();
  const products = getAllProducts();

  // Compute metrics
  const totalRevenue = orders.reduce((sum, o) => {
    if (o.status === "COMPLETED" || o.status === "PROCESSING") {
      return sum + o.total;
    }
    return sum;
  }, 0);

  const activeOrdersCount = orders.filter(
    (o) => o.status === "PROCESSING" || o.status === "PENDING_PAYMENT"
  ).length;

  // Simulate/collect low stock products
  // Products that are out of stock or marked inactive
  const lowStockProducts = products.filter(
    (p) => !p.inStock || p.sku?.includes("CLEARANCE") || p.id === 43015
  );

  // 1. Gather all candidate product IDs and slugs to query their images from the database
  const candidateIds = new Set<number>();
  const candidateSlugs = new Set<string>();

  // Add low stock product candidates
  lowStockProducts.slice(0, 10).forEach((p: any) => {
    if (p.id) candidateIds.add(Number(p.id));
    if (p.slug) candidateSlugs.add(p.slug);
  });

  // Add order item candidates
  orders.forEach((o) => {
    if (o.status === "COMPLETED" || o.status === "PROCESSING") {
      o.items.forEach((item) => {
        if (item.id) candidateIds.add(Number(item.id));
      });
    }
  });

  // Add seeded top-seller candidates
  const seededSlugs = [
    "bonnie-adult-dog-food-beef-15kg",
    "bonnie-adult-dog-food-lamb-and-rice-2-5kg",
    "reflex-adult-cat-food-salmon-rice-0-5kg",
    "bonnie-canary-bird-food-500gr-3",
    "bravecto-chewable-tablet-for-dogs-20-to-40kg-1-treatment"
  ];
  seededSlugs.forEach(s => candidateSlugs.add(s));

  // Query database for all candidate images
  const dbImagesMap: Record<string, string> = {};
  const idsArr = Array.from(candidateIds);
  const slugsArr = Array.from(candidateSlugs);

  if (idsArr.length > 0 || slugsArr.length > 0) {
    try {
      const res = await query(
        `SELECT id, slug, image_url FROM products WHERE id = ANY($1) OR slug = ANY($2)`,
        [idsArr, slugsArr]
      );
      res.rows.forEach((row: any) => {
        if (row.image_url) {
          dbImagesMap[String(row.id)] = row.image_url;
          if (row.slug) {
            dbImagesMap[row.slug] = row.image_url;
          }
        }
      });
    } catch (e) {
      console.error("Failed to query product images from DB in dashboard loader:", e);
    }
  }

  // Helper: resolve the best available image URL for a product.
  // Prioritizes the database image_url, then details JSON images, and finally falls back to summary or logo.
  const { getProduct } = await import("~/lib/content.server");
  const FALLBACK_IMG = "/images/psk_logo.png";
  function resolveProductImage(summary: any): string {
    const idKey = summary?.id ? String(summary.id) : "";
    const slugKey = summary?.slug || "";
    
    if (idKey && dbImagesMap[idKey]) return dbImagesMap[idKey];
    if (slugKey && dbImagesMap[slugKey]) return dbImagesMap[slugKey];
    
    if (!summary?.slug) return FALLBACK_IMG;
    try {
      const detail = getProduct(summary.slug) as any;
      if (detail) {
        const firstImage = detail.images?.[0]?.src;
        if (firstImage && firstImage !== FALLBACK_IMG) return firstImage;
        if (detail.thumbnail && detail.thumbnail !== FALLBACK_IMG) return detail.thumbnail;
        if (detail.image_url && detail.image_url !== FALLBACK_IMG) return detail.image_url;
      }
    } catch (_) { /* detail file may not exist */ }
    if (summary.thumbnail && summary.thumbnail !== FALLBACK_IMG) return summary.thumbnail;
    if ((summary as any).image_url && (summary as any).image_url !== FALLBACK_IMG)
      return (summary as any).image_url;
    return FALLBACK_IMG;
  }

  // Group top sellers from orders — cross-reference the product index to get real images
  const productSalesMap: Record<string, { name: string; count: number; thumbnail: string; price: number }> = {};
  orders.forEach((o) => {
    if (o.status === "COMPLETED" || o.status === "PROCESSING") {
      o.items.forEach((item) => {
        const idStr = String(item.id);
        if (!productSalesMap[idStr]) {
          const matchedSummary = products.find(
            (p: any) => String(p.id) === idStr
          );
          productSalesMap[idStr] = {
            name: item.name,
            count: 0,
            thumbnail: matchedSummary
              ? resolveProductImage(matchedSummary)
              : (item.thumbnail || FALLBACK_IMG),
            price: item.price,
          };
        }
        productSalesMap[idStr].count += item.quantity || 1;
      });
    }
  });

  let topSellers = Object.values(productSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Seed default top sellers — use getProduct() with exact known slugs so we always
  // get the real WooCommerce product image rather than a pattern-match that may miss.
  if (topSellers.length === 0) {
    // These slugs are confirmed to have images[] populated from WooCommerce
    const slot1 = getProduct("bonnie-adult-dog-food-beef-15kg") as any;
    const slot2 = getProduct("bonnie-adult-dog-food-lamb-and-rice-2-5kg") as any
               ?? getProduct("reflex-adult-cat-food-salmon-rice-0-5kg") as any;
    const slot3 = getProduct("bonnie-canary-bird-food-500gr-3") as any
               ?? getProduct("bravecto-chewable-tablet-for-dogs-20-to-40kg-1-treatment") as any;

    topSellers = [
      {
        name: slot1?.name ?? "Bonnie Adult Dog Food - Beef 15kg",
        count: 14,
        thumbnail: slot1 ? resolveProductImage(slot1) : FALLBACK_IMG,
        price: slot1?.regularPrice ?? slot1?.price ?? 4500,
      },
      {
        name: slot2?.name ?? "Bonnie Lamb & Rice 2.5kg",
        count: 9,
        thumbnail: slot2 ? resolveProductImage(slot2) : FALLBACK_IMG,
        price: slot2?.regularPrice ?? slot2?.price ?? 1200,
      },
      {
        name: slot3?.name ?? "Bonnie Canary Bird Food 500g",
        count: 5,
        thumbnail: slot3 ? resolveProductImage(slot3) : FALLBACK_IMG,
        price: slot3?.regularPrice ?? slot3?.price ?? 650,
      },
    ];
  }

  // Live order stream
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const couponsCount = (await db.coupon.findMany()).length;

  return {
    totalRevenue,
    activeOrdersCount,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 4).map((p: any) => ({
      ...p,
      thumbnail: resolveProductImage(p),
    })),
    couponsCount,
    topSellers,
    recentOrders,
  };
}

export default function VpBackendDashboard() {
  const data = useLoaderData() as any;
  const [selectedPeriod, setSelectedPeriod] = useState("June 2026");

  // Chart coordinate mapping
  const chartDataMap: Record<string, { path: string; area: string; dots: { cx: number; cy: number; fill: string }[] }> = {
    "June 2026": {
      path: "M 100,160 Q 200,100 300,130 T 500,50 T 700,90",
      area: "M 100,160 Q 200,100 300,130 T 500,50 T 700,90 L 700,170 L 100,170 Z",
      dots: [
        { cx: 100, cy: 160, fill: "#472f8f" },
        { cx: 300, cy: 130, fill: "#472f8f" },
        { cx: 500, cy: 50, fill: "#00ccff" },
        { cx: 700, cy: 90, fill: "#472f8f" },
      ]
    },
    "May 2026": {
      path: "M 100,120 Q 200,150 300,80 T 500,140 T 700,60",
      area: "M 100,120 Q 200,150 300,80 T 500,140 T 700,60 L 700,170 L 100,170 Z",
      dots: [
        { cx: 100, cy: 120, fill: "#472f8f" },
        { cx: 300, cy: 80, fill: "#00ccff" },
        { cx: 500, cy: 140, fill: "#472f8f" },
        { cx: 700, cy: 60, fill: "#472f8f" },
      ]
    },
    "April 2026": {
      path: "M 100,90 Q 200,70 300,120 T 500,60 T 700,150",
      area: "M 100,90 Q 200,70 300,120 T 500,60 T 700,150 L 700,170 L 100,170 Z",
      dots: [
        { cx: 100, cy: 90, fill: "#472f8f" },
        { cx: 300, cy: 120, fill: "#472f8f" },
        { cx: 500, cy: 60, fill: "#00ccff" },
        { cx: 700, cy: 150, fill: "#472f8f" },
      ]
    },
    "March 2026": {
      path: "M 100,140 Q 200,90 300,140 T 500,80 T 700,110",
      area: "M 100,140 Q 200,90 300,140 T 500,80 T 700,110 L 700,170 L 100,170 Z",
      dots: [
        { cx: 100, cy: 140, fill: "#472f8f" },
        { cx: 300, cy: 140, fill: "#472f8f" },
        { cx: 500, cy: 80, fill: "#472f8f" },
        { cx: 700, cy: 110, fill: "#00ccff" },
      ]
    },
    "February 2026": {
      path: "M 100,70 Q 200,130 300,90 T 500,120 T 700,40",
      area: "M 100,70 Q 200,130 300,90 T 500,120 T 700,40 L 700,170 L 100,170 Z",
      dots: [
        { cx: 100, cy: 70, fill: "#00ccff" },
        { cx: 300, cy: 90, fill: "#472f8f" },
        { cx: 500, cy: 120, fill: "#472f8f" },
        { cx: 700, cy: 40, fill: "#472f8f" },
      ]
    },
    "January 2026": {
      path: "M 100,150 Q 200,110 300,60 T 500,90 T 700,80",
      area: "M 100,150 Q 200,110 300,60 T 500,90 T 700,80 L 700,170 L 100,170 Z",
      dots: [
        { cx: 100, cy: 150, fill: "#472f8f" },
        { cx: 300, cy: 60, fill: "#472f8f" },
        { cx: 500, cy: 90, fill: "#00ccff" },
        { cx: 700, cy: 80, fill: "#472f8f" },
      ]
    }
  };
  const activeChart = chartDataMap[selectedPeriod] || chartDataMap["June 2026"];

  // Format currency helper
  const formatKsh = (num: number) => {
    return "KSh " + num.toLocaleString("en-KE");
  };

  return (
    <div className="dashboard-view animate-fade-in">
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .stat-card::after {
          content: '';
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          filter: blur(40px);
          bottom: -20px;
          right: -20px;
          opacity: 0.15;
          pointer-events: none;
        }

        .stat-card.revenue::after { background: #472f8f; }
        .stat-card.orders::after { background: #00ccff; }
        .stat-card.stock::after { background: #ff9f43; }
        .stat-card.coupons::after { background: #9b5de5; }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .stat-title {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-icon {
          font-size: 20px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 750;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .stat-footer {
          margin-top: 10px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .growth-up { color: #2ed573; font-weight: 600; }

        /* Chart section */
        .chart-card {
          margin-bottom: 32px;
        }

        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .chart-container {
          height: 240px;
          width: 100%;
          display: flex;
          align-items: flex-end;
          position: relative;
          padding-top: 20px;
        }

        /* Widgets grid */
        .widgets-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .widgets-grid {
            grid-template-columns: 1fr;
          }
        }

        .widget-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .widget-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .widget-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .product-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-mini-thumb {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          object-fit: contain;
          padding: 2px;
        }

        .product-name-txt {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          max-width: 260px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-sub-txt {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }

        .stock-badge-red {
          background: rgba(255, 77, 98, 0.1);
          border: 1px solid rgba(255, 77, 98, 0.25);
          color: #ff4d62;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .sales-count-badge {
          background: rgba(0, 204, 255, 0.1);
          border: 1px solid rgba(0, 204, 255, 0.25);
          color: #00ccff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }
      ` }} />

      <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-header">
            <span className="stat-title">Total Revenue</span>
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-value">{formatKsh(data.totalRevenue)}</div>
          <div className="stat-footer">
            <span className="growth-up">↑ 12.4%</span> vs last month
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-header">
            <span className="stat-title">Active Orders</span>
            <span className="stat-icon">🛒</span>
          </div>
          <div className="stat-value">{data.activeOrdersCount}</div>
          <div className="stat-footer">
            Orders pending fulfillment
          </div>
        </div>

        <div className="stat-card stock">
          <div className="stat-header">
            <span className="stat-title">Low Stock items</span>
            <span className="stat-icon">⚠️</span>
          </div>
          <div className="stat-value">{data.lowStockCount}</div>
          <div className="stat-footer">
            Products requiring attention
          </div>
        </div>

        <div className="stat-card coupons">
          <div className="stat-header">
            <span className="stat-title">Active Coupons</span>
            <span className="stat-icon">🎫</span>
          </div>
          <div className="stat-value">{data.couponsCount}</div>
          <div className="stat-footer">
            Store-wide discount codes
          </div>
        </div>
      </div>

      {/* SVG Sales Trend Chart */}
      <div className="admin-card chart-card">
        <div className="chart-header">
          <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#fff" }}>Weekly Sales Performance</h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
              color: "#fff",
              padding: "6px 12px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
              transition: "border-color 0.3s ease",
            }}
          >
            <option value="June 2026">June 2026</option>
            <option value="May 2026">May 2026</option>
            <option value="April 2026">April 2026</option>
            <option value="March 2026">March 2026</option>
            <option value="February 2026">February 2026</option>
            <option value="January 2026">January 2026</option>
          </select>
        </div>
        <div className="chart-container">
          <svg viewBox="0 0 800 220" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            {/* Grid Lines */}
            <line x1="50" y1="20" x2="750" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="50" y1="70" x2="750" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="50" y1="120" x2="750" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="50" y1="170" x2="750" y2="170" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

            {/* Left Y Axis labels */}
            <text x="15" y="25" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="Poppins">KSh 150K</text>
            <text x="15" y="75" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="Poppins">KSh 100K</text>
            <text x="15" y="125" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="Poppins">KSh 50K</text>
            <text x="15" y="175" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="Poppins">0</text>

            {/* Trend line */}
            <path
              d={activeChart.path}
              fill="none"
              stroke="url(#line-glow)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ transition: "d 0.5s ease" }}
            />
            {/* Gradient under curve */}
            <path
              d={activeChart.area}
              fill="url(#area-gradient)"
              opacity="0.1"
              style={{ transition: "d 0.5s ease" }}
            />

            {/* Glowing dots */}
            {activeChart.dots.map((dot, index) => (
              <circle
                key={index}
                cx={dot.cx}
                cy={dot.cy}
                r="5"
                fill={dot.fill}
                filter={`drop-shadow(0 0 4px ${dot.fill})`}
                style={{ transition: "cx 0.5s ease, cy 0.5s ease" }}
              />
            ))}

            {/* X labels */}
            <text x="100" y="195" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle" fontFamily="Poppins">Week 1</text>
            <text x="300" y="195" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle" fontFamily="Poppins">Week 2</text>
            <text x="500" y="195" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle" fontFamily="Poppins">Week 3</text>
            <text x="700" y="195" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle" fontFamily="Poppins">Week 4</text>

            <defs>
              <linearGradient id="line-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#472f8f" />
                <stop offset="50%" stopColor="#ff7b8b" />
                <stop offset="100%" stopColor="#00ccff" />
              </linearGradient>
              <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#472f8f" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="widgets-grid">
        {/* Left: Recent Orders Feed */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>Recent Incoming Orders</h3>
            <Link to="/store_backend/orders" style={{ fontSize: "12px", color: "#00ccff", textDecoration: "none" }}>View All</Link>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order: Order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: "600", color: "#00ccff" }}>{order.id}</td>
                    <td>{order.billing.name}</td>
                    <td>{formatKsh(order.total)}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Columns: Top Sellers & Low Stock Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Sellers Widget */}
          <div className="admin-card">
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>Top Selling Products</h3>
            <div className="widget-list">
              {data.topSellers.map((prod: any, idx: number) => (
                <div className="widget-item" key={idx}>
                  <div className="product-meta-row">
                    <img
                      className="product-mini-thumb"
                      src={prod.thumbnail || "/images/psk_logo.png"}
                      alt={prod.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/psk_logo.png"; }}
                    />
                    <div>
                      <div className="product-name-txt">{prod.name}</div>
                      <div className="product-sub-txt">{formatKsh(prod.price)}</div>
                    </div>
                  </div>
                  <span className="sales-count-badge">{prod.count} sold</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="admin-card">
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>Low Stock Warnings</h3>
            <div className="widget-list">
              {data.lowStockProducts.map((prod: any, idx: number) => (
                <div className="widget-item" key={idx}>
                  <div className="product-meta-row">
                    <img
                      className="product-mini-thumb"
                      src={prod.thumbnail || "/images/psk_logo.png"}
                      alt={prod.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/psk_logo.png"; }}
                    />
                    <div>
                      <div className="product-name-txt">{prod.name}</div>
                      <div className="product-sub-txt">SKU: {prod.sku}</div>
                    </div>
                  </div>
                  <span className="stock-badge-red">OUT OF STOCK</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
