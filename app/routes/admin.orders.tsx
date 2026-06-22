import { useLoaderData, Form, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.orders";
import { query } from "../db.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Manage Orders — PetStore Kenya Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "";
  
  let q = `
    SELECT 
      o.id, o.customer_name, o.customer_phone, o.customer_email, o.delivery_area,
      o.subtotal_kes, o.delivery_fee_kes, o.total_kes, o.payment_method, o.status,
      o.notes, o.created_at,
      json_agg(
        json_build_object(
          'product_name', oi.product_name,
          'qty', oi.qty,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
  `;
  
  const params: any[] = [];
  if (statusFilter) {
    params.push(statusFilter);
    q += ` WHERE o.status = $1`;
  }
  
  q += ` GROUP BY o.id ORDER BY o.created_at DESC`;

  const { rows } = await query(q, params);
  return { orders: rows, statusFilter };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const orderId = formData.get("orderId");
  const status = formData.get("status");

  if (!orderId || !status) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  await query("UPDATE orders SET status = $1 WHERE id = $2", [status, orderId]);
  return { success: true };
}

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled"
];

export default function AdminOrders() {
  const { orders, statusFilter } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderId = searchParams.get("id");

  function handleFilterChange(status: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (status) {
      nextParams.set("status", status);
    } else {
      nextParams.delete("status");
    }
    setSearchParams(nextParams);
  }

  function toggleOrderSelect(id: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextParams.get("id") === id) {
      nextParams.delete("id");
    } else {
      nextParams.set("id", id);
    }
    setSearchParams(nextParams);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#fff" }}>📦 Order Management</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "0.25rem" }}>
            Track sales and adjust delivery statuses
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleFilterChange("")}
            className={`btn-admin-secondary ${!statusFilter ? "btn-admin-primary" : ""}`}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.7rem", border: "2px solid var(--admin-border)", background: !statusFilter ? "var(--admin-accent)" : "none", color: "#fff" }}
          >
            ALL
          </button>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleFilterChange(opt)}
              style={{
                padding: "0.4rem 0.8rem",
                fontSize: "0.7rem",
                border: "2px solid var(--admin-border)",
                background: statusFilter === opt ? "var(--admin-accent)" : "none",
                color: "#fff",
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              {opt.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ background: "var(--admin-card-bg)", border: "2px solid var(--admin-border)", padding: "4rem", textAlign: "center", color: "var(--admin-text-muted)" }}>
          <span style={{ fontSize: "2.5rem" }}>📦</span>
          <p style={{ marginTop: "1rem", fontSize: "0.8rem" }}>No orders matching filters found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {orders.map((order: any) => {
            const isExpanded = selectedOrderId === String(order.id);
            return (
              <div
                key={order.id}
                style={{
                  background: "var(--admin-card-bg)",
                  border: isExpanded ? "2px solid var(--admin-accent)" : "2px solid var(--admin-border)",
                  boxShadow: "4px 4px 0px #111",
                  transition: "border-color 0.2s"
                }}
              >
                {/* Order Summary Row */}
                <div
                  onClick={() => toggleOrderSelect(String(order.id))}
                  style={{
                    padding: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1.5rem",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ color: "var(--admin-accent)", fontWeight: 700 }}>#{order.id}</span>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                        {order.customer_name || "Guest Customer"}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--admin-text-muted)", marginTop: "0.1rem" }}>
                        {order.customer_phone} · {order.delivery_area || "Nairobi"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", textAlign: "right" }}>
                        KES {Number(order.total_kes).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--admin-text-muted)", textAlign: "right", marginTop: "0.1rem" }}>
                        {order.items.length} product{order.items.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                      <span className={`status-pill ${order.status}`} style={{ cursor: "default" }}>
                        {order.status.replace("_", " ")}
                      </span>
                      
                      {/* Status Update Quick Dropdown */}
                      <Form method="post" style={{ display: "inline" }}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <select
                          name="status"
                          value={order.status}
                          onChange={(e) => e.target.form?.requestSubmit()}
                          style={{
                            background: "var(--admin-dark-gray)",
                            border: "1px solid var(--admin-border)",
                            color: "#fff",
                            fontSize: "0.65rem",
                            padding: "0.2rem",
                            fontFamily: "inherit",
                            outline: "none"
                          }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </Form>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div style={{ borderTop: "2px solid var(--admin-border)", padding: "1.5rem", background: "var(--admin-bg)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                      
                      {/* Customer Info */}
                      <div>
                        <h4 style={{ fontSize: "0.7rem", color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                          Customer & Delivery Details
                        </h4>
                        <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: "0.3rem 0", color: "var(--admin-text-muted)" }}>Email:</td>
                              <td style={{ padding: "0.3rem 0", color: "#fff" }}>{order.customer_email || "—"}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "0.3rem 0", color: "var(--admin-text-muted)" }}>Payment Method:</td>
                              <td style={{ padding: "0.3rem 0", color: "#fff", textTransform: "uppercase" }}>{order.payment_method?.replace("_", " ") || "—"}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "0.3rem 0", color: "var(--admin-text-muted)" }}>Delivery Area:</td>
                              <td style={{ padding: "0.3rem 0", color: "#fff" }}>{order.delivery_area || "—"}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "0.3rem 0", color: "var(--admin-text-muted)" }}>Notes:</td>
                              <td style={{ padding: "0.3rem 0", color: "#fff", fontStyle: "italic" }}>{order.notes || "No special instructions"}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "0.3rem 0", color: "var(--admin-text-muted)" }}>Placed At:</td>
                              <td style={{ padding: "0.3rem 0", color: "#fff" }}>{new Date(order.created_at).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Items Details */}
                      <div>
                        <h4 style={{ fontSize: "0.7rem", color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                          Ordered Items
                        </h4>
                        <div style={{ border: "1px solid var(--admin-border)", padding: "0.5rem" }}>
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.75rem",
                                padding: "0.4rem 0",
                                borderBottom: idx < order.items.length - 1 ? "1px solid var(--admin-border)" : "none"
                              }}
                            >
                              <span>
                                {item.product_name} <strong style={{ color: "var(--admin-accent)" }}>x{item.qty}</strong>
                              </span>
                              <span style={{ fontFamily: "monospace", color: "#fff" }}>
                                KES {Number(item.total_price).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary Pricing */}
                        <div style={{ marginTop: "1rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "right" }}>
                          <div>
                            <span style={{ color: "var(--admin-text-muted)" }}>Subtotal:</span>
                            <span style={{ marginLeft: "1rem", color: "#fff" }}>KES {Number(order.subtotal_kes).toLocaleString()}</span>
                          </div>
                          <div>
                            <span style={{ color: "var(--admin-text-muted)" }}>Delivery Fee:</span>
                            <span style={{ marginLeft: "1rem", color: "#fff" }}>KES {Number(order.delivery_fee_kes).toLocaleString()}</span>
                          </div>
                          <div style={{ borderTop: "1px dashed var(--admin-border)", paddingTop: "0.4rem", marginTop: "0.2rem", fontSize: "0.85rem", fontWeight: 700 }}>
                            <span style={{ color: "var(--admin-text-muted)" }}>Total Paid:</span>
                            <span style={{ marginLeft: "1rem", color: "var(--admin-accent)" }}>KES {Number(order.total_kes).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
