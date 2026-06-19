import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.products";
import { query, withTransaction } from "../db.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Manage Products — Pet Food Bag Admin" }];
}

export async function loader() {
  const { rows } = await query(`
    SELECT p.*, bbp.price AS our_price 
    FROM products p 
    LEFT JOIN store_prices bbp ON bbp.product_id = p.id AND bbp.store_name = 'Pet Food Bag'
    ORDER BY p.name
  `);
  return { products: rows };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "delete") {
    const id = formData.get("id");
    if (!id) return { error: "ID is required for deletion" };
    
    await query("DELETE FROM products WHERE id = $1", [id]);
    return { success: true };
  }

  // Common properties
  const name = formData.get("name")?.toString();
  const brand = formData.get("brand")?.toString() || null;
  const weight_kg = formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null;
  const animal_type = formData.get("animal_type")?.toString() || "dog";
  const food_type = formData.get("food_type")?.toString() || "dry";
  const image_url = formData.get("image_url")?.toString() || null;
  const description = formData.get("description")?.toString() || null;
  const key_ingredients = formData.get("key_ingredients")?.toString() || null;
  const feeding_guide = formData.get("feeding_guide")?.toString() || null;
  const replaces_brand = formData.get("replaces_brand")?.toString() || null;
  const replaces_reason = formData.get("replaces_reason")?.toString() || null;
  
  const nutrition_protein = formData.get("nutrition_protein") ? Number(formData.get("nutrition_protein")) : null;
  const nutrition_fat = formData.get("nutrition_fat") ? Number(formData.get("nutrition_fat")) : null;
  const nutrition_fibre = formData.get("nutrition_fibre") ? Number(formData.get("nutrition_fibre")) : null;
  const nutrition_moisture = formData.get("nutrition_moisture") ? Number(formData.get("nutrition_moisture")) : null;
  const price = formData.get("price") ? Number(formData.get("price")) : null;

  if (!name) {
    return { error: "Product Name is required" };
  }

  try {
    if (intent === "create") {
      await withTransaction(async (client) => {
        // 1. Insert product
        const res = await client.query(
          `INSERT INTO products 
            (name, brand, weight_kg, animal_type, food_type, image_url, description, 
             key_ingredients, feeding_guide, replaces_brand, replaces_reason, 
             nutrition_protein, nutrition_fat, nutrition_fibre, nutrition_moisture)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id`,
          [name, brand, weight_kg, animal_type, food_type, image_url, description,
           key_ingredients, feeding_guide, replaces_brand, replaces_reason,
           nutrition_protein, nutrition_fat, nutrition_fibre, nutrition_moisture]
        );
        const productId = res.rows[0].id;

        // 2. Set default store price for Pet Food Bag
        if (price !== null) {
          await client.query(
            `INSERT INTO store_prices (product_id, store_name, price, product_url, in_stock)
             VALUES ($1, 'Pet Food Bag', $2, $3, true)`,
            [productId, price, `https://petfoodbag.co.ke/shop/${productId}`]
          );
        }
      });
      return { success: true };
    }

    if (intent === "update") {
      const id = formData.get("id");
      if (!id) return { error: "ID is required for updating" };

      await withTransaction(async (client) => {
        // 1. Update product
        await client.query(
          `UPDATE products SET
            name = $1, brand = $2, weight_kg = $3, animal_type = $4, food_type = $5,
            image_url = $6, description = $7, key_ingredients = $8, feeding_guide = $9,
            replaces_brand = $10, replaces_reason = $11, nutrition_protein = $12,
            nutrition_fat = $13, nutrition_fibre = $14, nutrition_moisture = $15
           WHERE id = $16`,
          [name, brand, weight_kg, animal_type, food_type, image_url, description,
           key_ingredients, feeding_guide, replaces_brand, replaces_reason,
           nutrition_protein, nutrition_fat, nutrition_fibre, nutrition_moisture, id]
        );

        // 2. Update price in store_prices (Upsert format)
        if (price !== null) {
          const checkPrice = await client.query(
            `SELECT id FROM store_prices WHERE product_id = $1 AND store_name = 'Pet Food Bag'`,
            [id]
          );

          if (checkPrice.rows.length > 0) {
            await client.query(
              `UPDATE store_prices SET price = $1, last_updated = NOW()
               WHERE product_id = $2 AND store_name = 'Pet Food Bag'`,
              [price, id]
            );
          } else {
            await client.query(
              `INSERT INTO store_prices (product_id, store_name, price, product_url, in_stock)
               VALUES ($1, 'Pet Food Bag', $2, $3, true)`,
              [id, price, `https://petfoodbag.co.ke/shop/${id}`]
            );
          }
        }
      });
      return { success: true };
    }
  } catch (err: any) {
    console.error("Product action error:", err);
    return { error: err.message || "Operation failed" };
  }

  return {};
}

export default function AdminProducts() {
  const { products } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // State to manage edit vs add mode
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function startEdit(p: any) {
    setEditingProduct(p);
    setIsAdding(false);
    // Scroll to form smoothly
    document.getElementById("product-form-container")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelForm() {
    setEditingProduct(null);
    setIsAdding(false);
  }

  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#fff" }}>🛒 Product Inventory</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "0.25rem" }}>
            Add new products or edit metadata for existing ones
          </p>
        </div>

        {!isAdding && !editingProduct && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-admin-primary"
          >
            ➕ Add Product
          </button>
        )}
      </div>

      {actionData?.error && (
        <div style={{ background: "rgba(200,16,46,0.1)", border: "2px solid var(--admin-accent)", color: "#f87171", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
          ⚠️ {actionData.error}
        </div>
      )}

      {actionData?.success && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "2px solid var(--admin-success)", color: "#34d399", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
          ✓ Action completed successfully!
        </div>
      )}

      {/* Form Section (Rendered when Adding or Editing) */}
      {(isAdding || editingProduct) && (
        <div id="product-form-container" style={{ background: "var(--admin-card-bg)", border: "2px solid var(--admin-accent)", padding: "1.5rem", marginBottom: "2rem", boxShadow: "4px 4px 0px #111" }}>
          <h2 style={{ fontSize: "0.95rem", color: "#fff", marginBottom: "1.25rem", borderBottom: "1px solid var(--admin-border)", paddingBottom: "0.5rem" }}>
            {isAdding ? "➕ Add New Product" : `✏️ Edit: ${editingProduct.name}`}
          </h2>

          <Form method="post" onSubmit={cancelForm}>
            <input type="hidden" name="intent" value={isAdding ? "create" : "update"} />
            {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              
              {/* Left Column (Primary Details) */}
              <div>
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input type="text" id="name" name="name" defaultValue={editingProduct?.name || ""} required className="form-control" />
                </div>
                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input type="text" id="brand" name="brand" defaultValue={editingProduct?.brand || ""} className="form-control" />
                </div>
                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label htmlFor="weight_kg">Weight (kg)</label>
                    <input type="number" step="0.01" id="weight_kg" name="weight_kg" defaultValue={editingProduct?.weight_kg || ""} className="form-control" />
                  </div>
                  <div>
                    <label htmlFor="price">Our Price (KES) *</label>
                    <input type="number" id="price" name="price" defaultValue={editingProduct?.our_price || ""} required className="form-control" />
                  </div>
                </div>
                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label htmlFor="animal_type">Animal Type</label>
                    <select id="animal_type" name="animal_type" defaultValue={editingProduct?.animal_type || "dog"} className="form-control">
                      <option value="dog">🐕 Dog</option>
                      <option value="cat">🐈 Cat</option>
                      <option value="rabbit">🐇 Rabbit</option>
                      <option value="bird">🦜 Bird</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="food_type">Food Type</label>
                    <select id="food_type" name="food_type" defaultValue={editingProduct?.food_type || "dry"} className="form-control">
                      <option value="dry">Dry</option>
                      <option value="wet">Wet</option>
                      <option value="treat">Treat</option>
                      <option value="supplement">Supplement</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="image_url">Image URL</label>
                  <input type="text" id="image_url" name="image_url" defaultValue={editingProduct?.image_url || ""} className="form-control" placeholder="https://..." />
                </div>
              </div>

              {/* Middle Column (Descriptions & Guides) */}
              <div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" name="description" defaultValue={editingProduct?.description || ""} className="form-control" style={{ height: "60px", resize: "vertical" }} />
                </div>
                <div className="form-group">
                  <label htmlFor="key_ingredients">Key Ingredients</label>
                  <textarea id="key_ingredients" name="key_ingredients" defaultValue={editingProduct?.key_ingredients || ""} className="form-control" style={{ height: "60px", resize: "vertical" }} />
                </div>
                <div className="form-group">
                  <label htmlFor="feeding_guide">Feeding Guide</label>
                  <textarea id="feeding_guide" name="feeding_guide" defaultValue={editingProduct?.feeding_guide || ""} className="form-control" style={{ height: "60px", resize: "vertical" }} />
                </div>
              </div>

              {/* Right Column (Nutrition & Comparisons) */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div className="form-group">
                    <label htmlFor="nutrition_protein">Protein %</label>
                    <input type="number" step="0.1" id="nutrition_protein" name="nutrition_protein" defaultValue={editingProduct?.nutrition_protein || ""} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="nutrition_fat">Fat %</label>
                    <input type="number" step="0.1" id="nutrition_fat" name="nutrition_fat" defaultValue={editingProduct?.nutrition_fat || ""} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="nutrition_fibre">Fibre %</label>
                    <input type="number" step="0.1" id="nutrition_fibre" name="nutrition_fibre" defaultValue={editingProduct?.nutrition_fibre || ""} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="nutrition_moisture">Moisture %</label>
                    <input type="number" step="0.1" id="nutrition_moisture" name="nutrition_moisture" defaultValue={editingProduct?.nutrition_moisture || ""} className="form-control" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="replaces_brand">Alternative to Imported Brand</label>
                  <input type="text" id="replaces_brand" name="replaces_brand" defaultValue={editingProduct?.replaces_brand || ""} className="form-control" placeholder="e.g. Royal Canin Adult" />
                </div>
                <div className="form-group">
                  <label htmlFor="replaces_reason">Why this replaces it?</label>
                  <textarea id="replaces_reason" name="replaces_reason" defaultValue={editingProduct?.replaces_reason || ""} className="form-control" style={{ height: "45px", resize: "vertical" }} placeholder="e.g. 50% cheaper, locally sourced..." />
                </div>
              </div>

            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
              <button type="button" onClick={cancelForm} className="btn-admin-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-admin-primary">
                {isSubmitting ? "Saving..." : "Save Product"}
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* Product Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Weight</th>
              <th>Price</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id}>
                <td style={{ width: "50px", padding: "0.5rem" }}>
                  <div style={{ width: "40px", height: "40px", background: "#fff", border: "1px solid var(--admin-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: "1.2rem" }}>{p.animal_type === "cat" ? "🐈" : "🐕"}</span>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 600, color: "#fff" }}>{p.name}</td>
                <td>{p.brand || <span style={{ color: "var(--admin-text-muted)" }}>—</span>}</td>
                <td style={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                  {p.animal_type} / {p.food_type}
                </td>
                <td>{p.weight_kg ? `${p.weight_kg} kg` : <span style={{ color: "var(--admin-text-muted)" }}>—</span>}</td>
                <td style={{ fontWeight: 700, color: "var(--admin-accent)" }}>
                  {p.our_price ? `KES ${Number(p.our_price).toLocaleString()}` : <span style={{ color: "var(--admin-text-muted)" }}>—</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => startEdit(p)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.7rem",
                        background: "none",
                        border: "1px solid var(--admin-border)",
                        color: "var(--admin-text)",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>

                    <Form method="post" style={{ display: "inline" }} onSubmit={(e) => {
                      if (!confirm(`Are you sure you want to delete "${p.name}"? This action is irreversible.`)) {
                        e.preventDefault();
                      }
                    }}>
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        style={{
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.7rem",
                          background: "none",
                          border: "1px solid var(--admin-accent)",
                          color: "var(--admin-accent)",
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </Form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
