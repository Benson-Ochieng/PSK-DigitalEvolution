import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/admin._index";
import { query } from "../db.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Overview — PetStore Kenya Admin" }];
}

export async function loader() {
  // 1. Fetch total orders
  const totalOrdersRes = await query("SELECT COUNT(*) FROM orders");
  const totalOrders = Number(totalOrdersRes.rows[0].count);

  // 2. Fetch total revenue (exclude cancelled)
  const revenueRes = await query("SELECT SUM(total_kes) FROM orders WHERE status != 'cancelled'");
  const totalRevenue = Number(revenueRes.rows[0].sum || 0);

  // 3. Fetch pending orders count
  const pendingOrdersRes = await query("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
  const pendingOrders = Number(pendingOrdersRes.rows[0].count);

  // 4. Fetch total products
  const productsRes = await query("SELECT COUNT(*) FROM products");
  const totalProducts = Number(productsRes.rows[0].count);

  // 5. Fetch price alert count
  const alertsRes = await query(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM products p
    JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'PetStore Kenya'
    JOIN store_prices comp ON comp.product_id = p.id AND comp.store_name != 'PetStore Kenya'
    WHERE comp.price < bbp.price
  `);
  const alertCount = Number(alertsRes.rows[0].count);

  // 6. Fetch 10 most recent orders
  const recentOrdersRes = await query(`
    SELECT id, customer_name, customer_phone, total_kes, status, created_at 
    FROM orders 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  const recentOrders = recentOrdersRes.rows;

  return {
    stats: {
      totalOrders,
      totalRevenue,
      pendingOrders,
      totalProducts,
      alertCount,
    },
    recentOrders,
  };
}

export default function AdminOverview() {
  const { stats, recentOrders } = useLoaderData<typeof loader>();

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#fff" }}>📊 Dashboard Overview</h1>
        <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "0.25rem" }}>
          Real-time metrics and operational feed
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Total Revenue</span>
          <span className="stat-card-value">KES {stats.totalRevenue.toLocaleString()}</span>
          <span className="stat-card-delta positive">Completed & Active sales</span>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid var(--admin-warning)" }}>
          <span className="stat-card-label">Pending Orders</span>
          <span className="stat-card-value" style={{ color: "var(--admin-warning)" }}>{stats.pendingOrders}</span>
          <span className="stat-card-delta" style={{ color: "var(--admin-warning)" }}>Requires action</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Total Orders</span>
          <span className="stat-card-value">{stats.totalOrders}</span>
          <span className="stat-card-delta positive">All lifetime orders</span>
        </div>

        <div className="stat-card" style={{ borderLeft: stats.alertCount > 0 ? "4px solid var(--admin-accent)" : "2px solid var(--admin-border)" }}>
          <span className="stat-card-label">Price Alerts</span>
          <span className="stat-card-value" style={{ color: stats.alertCount > 0 ? "var(--admin-accent)" : "#fff" }}>{stats.alertCount}</span>
          <span className="stat-card-delta" style={{ color: stats.alertCount > 0 ? "var(--admin-accent)" : "var(--admin-text-muted)" }}>
            {stats.alertCount > 0 ? "⚠️ Competitors beat our price" : "🏷️ Price advantage safe"}
          </span>
        </div>
      </div>

      {/* Quick navigation panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div style={{ background: "var(--admin-card-bg)", border: "2px solid var(--admin-border)", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#fff", marginBottom: "0.8rem" }}>⚡ Quick Actions</h3>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/admin/orders" className="btn-admin-primary" style={{ textDecoration: "none" }}>Manage Orders</Link>
            <Link to="/admin/products" className="btn-admin-secondary" style={{ textDecoration: "none" }}>Add New Product</Link>
            <Link to="/admin/prices" className="btn-admin-secondary" style={{ textDecoration: "none" }}>Audit Competitors</Link>
          </div>
        </div>
        
        <div style={{ background: "var(--admin-card-bg)", border: "2px solid var(--admin-border)", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.85rem", color: "#fff", marginBottom: "0.8rem" }}>📋 Catalog Summary</h3>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.25rem 0", borderBottom: "1px dashed var(--admin-border)" }}>
            <span style={{ color: "var(--admin-text-muted)" }}>Active Products:</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>{stats.totalProducts} items</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.25rem 0", marginTop: "0.4rem" }}>
            <span style={{ color: "var(--admin-text-muted)" }}>Delivery Coverage:</span>
            <span style={{ fontWeight: 700, color: "var(--admin-success)" }}>Nairobi & Suburbs</span>
          </div>
        </div>
      </div>

      {/* Recent Orders table */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#fff" }}>📦 Recent Orders</h2>
          <Link to="/admin/orders" style={{ fontSize: "0.7rem", color: "var(--admin-accent)", textDecoration: "none" }}>
            View all orders →
          </Link>
        </div>

        <div className="admin-table-container">
          {recentOrders.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--admin-text-muted)", fontSize: "0.8rem" }}>
              No orders placed yet.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed At</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/admin/orders?id=${order.id}`} style={{ color: "var(--admin-accent)", fontWeight: 700, textDecoration: "none" }}>
                        #{order.id}
                      </Link>
                    </td>
                    <td>{order.customer_name || <span style={{ color: "var(--admin-text-muted)" }}>Not specified</span>}</td>
                    <td>{order.customer_phone}</td>
                    <td style={{ fontWeight: 700, color: "#fff" }}>KES {Number(order.total_kes).toLocaleString()}</td>
                    <td>
                      <span className={`status-pill ${order.status}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
