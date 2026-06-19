import { useLoaderData } from "react-router";
import type { Route } from "./+types/admin.prices";
import { query } from "../db.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Price Intelligence — Pet Food Bag Admin" }];
}

export async function loader() {
  const { rows } = await query(`
    SELECT
      p.id, p.name, p.brand, p.animal_type, p.food_type, p.weight_kg,
      json_object_agg(sp.store_name, json_build_object(
        'price', sp.price,
        'in_stock', sp.in_stock,
        'last_updated', sp.last_updated,
        'url', sp.product_url
      )) AS store_data
    FROM products p
    JOIN store_prices sp ON sp.product_id = p.id
    GROUP BY p.id, p.name, p.brand, p.animal_type, p.food_type, p.weight_kg
    ORDER BY p.animal_type, p.name
  `);
  return { products: rows };
}

export default function AdminPrices() {
  const { products } = useLoaderData<typeof loader>() as any;

  // Dynamically get all unique stores across all products
  const uniqueStores = new Set<string>();
  products.forEach((p: any) => {
    if (p.store_data) {
      Object.keys(p.store_data).forEach(k => uniqueStores.add(k));
    }
  });
  uniqueStores.delete("Pet Food Bag");
  const STORES = ["Pet Food Bag", ...Array.from(uniqueStores).sort()];

  const alertCount = products.filter((p: any) => {
    const bbp = p.store_data?.["Pet Food Bag"]?.price;
    return STORES.slice(1).some(s => {
      const comp = p.store_data?.[s]?.price;
      return comp && bbp && Number(comp) < Number(bbp);
    });
  }).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#fff" }}>🏷️ Price Intelligence</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "0.25rem" }}>
            Monitor and benchmark prices against competitors
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "1.5rem", background: "var(--admin-card-bg)", padding: "0.75rem 1.5rem", border: "2px solid var(--admin-border)" }}>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--admin-accent)", lineHeight: 1 }}>{alertCount}</div>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--admin-text-muted)", marginTop: "0.2rem" }}>Price Alerts</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--admin-border)", paddingLeft: "1.5rem" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{products.length}</div>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--admin-text-muted)", marginTop: "0.2rem" }}>Products</div>
          </div>
        </div>
      </div>

      {alertCount > 0 && (
        <div style={{ background: "rgba(200,16,46,0.1)", border: "2px solid var(--admin-accent)", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.75rem", color: "#f87171" }}>
          ⚠️ {alertCount} product{alertCount !== 1 ? "s have" : " has"} a competitor priced below Pet Food Bag. Consider reducing prices to maintain price leadership.
        </div>
      )}

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ textAlign: "center" }}>Category</th>
              {STORES.map(s => (
                <th key={s} style={{ textAlign: "right", color: s === "Pet Food Bag" ? "var(--admin-accent)" : "inherit" }}>
                  {s === "Pet Food Bag" ? "🏷 Our Price" : s}
                </th>
              ))}
              <th style={{ textAlign: "right" }}>Margin vs Comp</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => {
              const bbp = p.store_data?.["Pet Food Bag"];
              const cheapestComp = STORES.slice(1)
                .map(s => p.store_data?.[s])
                .filter(Boolean)
                .reduce((min: any, c: any) => (!min || Number(c.price) < Number(min.price) ? c : min), null);
              const isAlert = cheapestComp && bbp && Number(cheapestComp.price) < Number(bbp.price);
              const margin = cheapestComp && bbp ? Math.round(Number(cheapestComp.price) - Number(bbp.price)) : null;
              const marginPct = cheapestComp && bbp ? Math.round(((Number(cheapestComp.price) - Number(bbp.price)) / Number(cheapestComp.price)) * 100) : null;

              return (
                <tr key={p.id} style={{ background: isAlert ? "rgba(200,16,46,0.04)" : "transparent" }}>
                  <td style={{ fontWeight: 600 }}>
                    {isAlert && <span style={{ color: "var(--admin-accent)", marginRight: "0.4rem" }}>⚠️</span>}
                    <span style={{ color: "#fff" }}>{p.name}</span>
                    <span style={{ color: "var(--admin-text-muted)", marginLeft: "0.5rem", fontSize: "0.7rem" }}>{p.brand}</span>
                    {p.weight_kg && <span style={{ color: "var(--admin-text-muted)", marginLeft: "0.4rem", fontSize: "0.65rem" }}>({p.weight_kg}kg)</span>}
                  </td>
                  <td style={{ textAlign: "center", textTransform: "uppercase", fontSize: "0.7rem" }}>
                    {p.animal_type === "cat" ? "🐈" : "🐕"} {p.food_type}
                  </td>
                  {STORES.map(s => {
                    const d = p.store_data?.[s];
                    return (
                      <td key={s} style={{ textAlign: "right", fontWeight: s === "Pet Food Bag" ? 700 : 400 }}>
                        {d ? (
                          <span style={{ color: s === "Pet Food Bag" ? "var(--admin-accent)" : (isAlert && d.price < bbp?.price ? "#f87171" : "inherit") }}>
                            KES {Number(d.price).toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ color: "var(--admin-text-muted)" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "right" }}>
                    {margin !== null && margin > 0 ? (
                      <span style={{ color: "var(--admin-success)", fontWeight: 700 }}>+{margin.toLocaleString()} ({marginPct}%)</span>
                    ) : margin !== null && margin <= 0 ? (
                      <span style={{ color: "var(--admin-accent)", fontWeight: 700 }}>⚠️ {margin.toLocaleString()}</span>
                    ) : <span style={{ color: "var(--admin-text-muted)" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
