import { useState } from "react";
import { Form, useLoaderData, useNavigation, useActionData, useSearchParams } from "react-router";
import fs from "fs";
import path from "path";
import { 
  getAllManuals, 
  saveAllManuals, 
  type ManualItem, 
  getAllManualCategories, 
  saveAllManualCategories, 
  type ManualCategory 
} from "~/lib/content.server";

// Simple slugify function
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")          // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start of text
    .replace(/-+$/, "");            // Trim - from end of text
}

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  await requireAdminUser(request);

  const manuals = getAllManuals();
  const categories = getAllManualCategories();
  return { manuals, categories };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  // Category Management Actions
  if (intent === "add_category") {
    const name = formData.get("name")?.toString().trim();
    if (!name) return { error: "Category Name is required." };
    const slug = slugify(name);

    const categories = getAllManualCategories();
    if (categories.some(c => c.slug === slug)) {
      return { error: `Category with slug "${slug}" already exists.` };
    }

    const newCat: ManualCategory = {
      id: `cat_${Date.now()}`,
      name,
      slug
    };
    categories.push(newCat);
    saveAllManualCategories(categories);
    return { success: `Successfully created category "${name}".` };
  }

  if (intent === "edit_category") {
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    if (!id || !name) return { error: "ID and Name are required for editing category." };
    const slug = slugify(name);

    const categories = getAllManualCategories();
    const catIndex = categories.findIndex(c => c.id === id);
    if (catIndex === -1) return { error: "Category not found." };

    const oldSlug = categories[catIndex].slug;
    categories[catIndex].name = name;
    categories[catIndex].slug = slug;

    // Update manuals category associations if slug changed
    if (oldSlug !== slug) {
      const manuals = getAllManuals();
      let updatedCount = 0;
      manuals.forEach(m => {
        if (m.category === oldSlug) {
          m.category = slug;
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        saveAllManuals(manuals);
      }
    }

    saveAllManualCategories(categories);
    return { success: `Successfully updated category to "${name}".` };
  }

  if (intent === "delete_category") {
    const id = formData.get("id")?.toString();
    if (!id) return { error: "Category ID is required." };

    const categories = getAllManualCategories();
    const targetCat = categories.find(c => c.id === id);
    if (!targetCat) return { error: "Category not found." };

    const updatedCats = categories.filter(c => c.id !== id);
    saveAllManualCategories(updatedCats);

    return { success: `Successfully deleted category "${targetCat.name}".` };
  }

  // Manual Management Actions
  if (intent === "upload") {
    const title = formData.get("title")?.toString().trim();
    const category = formData.get("category")?.toString();
    const thumbnail = formData.get("thumbnail")?.toString().trim() || "";
    const pdfFile = formData.get("pdfFile") as File;

    if (!title || !category) {
      return { error: "Title and Category are required." };
    }

    if (!pdfFile || pdfFile.size === 0 || !pdfFile.name) {
      return { error: "A valid PDF file must be selected." };
    }

    const ext = path.extname(pdfFile.name).toLowerCase();
    if (ext !== ".pdf") {
      return { error: "Only PDF files are allowed." };
    }

    try {
      const downloadsDir = path.join(process.cwd(), "public", "assets", "downloads");
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const baseName = path.basename(pdfFile.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${Date.now()}-${baseName}.pdf`;
      const filePath = path.join(downloadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      const manuals = getAllManuals();
      const newManual: ManualItem = {
        id: `man_${Date.now()}`,
        title,
        category,
        fileUrl: `/assets/downloads/${filename}`,
        fileName: filename,
        date: new Date().toISOString(),
        thumbnail: thumbnail || undefined
      };

      manuals.unshift(newManual);
      saveAllManuals(manuals);

      return { success: `Successfully uploaded and registered manual "${title}".` };
    } catch (err) {
      console.error("Manual upload failed:", err);
      return { error: "Failed to upload manual file." };
    }
  }

  if (intent === "edit") {
    const id = formData.get("id")?.toString();
    const title = formData.get("title")?.toString().trim();
    const category = formData.get("category")?.toString();
    const thumbnail = formData.get("thumbnail")?.toString().trim() || "";

    if (!id || !title || !category) {
      return { error: "ID, Title and Category are required for editing." };
    }

    try {
      const manuals = getAllManuals();
      const index = manuals.findIndex(m => m.id === id);
      if (index !== -1) {
        manuals[index].title = title;
        manuals[index].category = category;
        manuals[index].thumbnail = thumbnail || undefined;
        saveAllManuals(manuals);
        return { success: `Successfully updated manual.` };
      }
      return { error: "Manual not found." };
    } catch (err) {
      console.error("Manual edit failed:", err);
      return { error: "Failed to update manual." };
    }
  }

  if (intent === "delete") {
    const id = formData.get("id")?.toString();
    if (!id) return { error: "Manual ID is required." };

    try {
      const manuals = getAllManuals();
      const targetManual = manuals.find(m => m.id === id);

      if (!targetManual) {
        return { error: "Manual not found." };
      }

      if (targetManual.fileName) {
        const filePath = path.join(process.cwd(), "public", "assets", "downloads", targetManual.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const updatedManuals = manuals.filter(m => m.id !== id);
      saveAllManuals(updatedManuals);

      return { success: `Successfully deleted manual.` };
    } catch (err) {
      console.error("Manual delete failed:", err);
      return { error: "Failed to delete manual." };
    }
  }

  return null;
}

export default function DownloadsAdminRoute() {
  const { manuals, categories } = useLoaderData() as { manuals: ManualItem[]; categories: ManualCategory[] };
  const actionData = useActionData() as { error?: string; success?: string } | undefined;
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const view = searchParams.get("view") || "list";
  const isSubmitting = navigation.state === "submitting";

  // Search & Filter state for manuals view
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Edit State for manuals view
  const [editingManual, setEditingManual] = useState<ManualItem | null>(null);

  // Edit State for categories view
  const [editingCategory, setEditingCategory] = useState<ManualCategory | null>(null);

  const filteredManuals = manuals.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (categorySlug: string) => {
    switch (categorySlug) {
      case "televisions":
        return { bg: "rgba(37, 99, 235, 0.15)", text: "#60a5fa", border: "rgba(37, 99, 235, 0.3)" };
      case "sound-bar":
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
      case "vibe-series":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      case "accessories":
        return { bg: "rgba(139, 92, 246, 0.15)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.3)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.15)", text: "#9ca3af", border: "rgba(107, 114, 128, 0.3)" };
    }
  };

  const getCategoryLabel = (categorySlug: string) => {
    const found = categories.find(c => c.slug === categorySlug);
    return found ? found.name : categorySlug;
  };

  return (
    <div className="downloads-admin-console">
      <style dangerouslySetInnerHTML={{
        __html: `
        .downloads-admin-console {
          color: #f3f4f6;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .view-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .notice-banner {
          padding: 14px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid;
        }

        .notice-banner.success {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .notice-banner.error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .console-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 992px) {
          .console-grid {
            grid-template-columns: 1fr;
          }
        }

        .upload-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
        }

        .upload-card h3 {
          font-size: 18px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
          color: #fff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 12px;
        }

        .form-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
        }

        .form-control {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 10px 14px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .btn-submit {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: none;
          color: #fff;
          font-weight: 600;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .list-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
        }

        .toolbar-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (max-width: 576px) {
          .toolbar-row {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .search-wrapper {
          position: relative;
          flex-grow: 1;
          max-width: 400px;
        }

        .search-wrapper input {
          width: 100%;
          padding-left: 36px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
        }

        .filter-select {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 10px 14px;
          color: #fff;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .manuals-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .manuals-table th {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }

        .manuals-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: middle;
        }

        .manuals-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        .badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid;
        }

        .manual-title-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .preview-thumb {
          width: 48px;
          height: 48px;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
        }

        .preview-thumb-placeholder {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          font-size: 18px;
        }

        .manual-title {
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }

        .manual-file-link {
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s ease;
        }

        .manual-file-link:hover {
          color: #60a5fa;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .btn-action {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .btn-action.edit:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }

        .btn-action.delete:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
        }
      `}} />

      <div className="view-header">
        <h2>{view === "categories" ? "Downloads Categories" : "Downloads Registry"}</h2>
      </div>

      {actionData?.success && (
        <div className="notice-banner success">
          <span>✅</span>
          <span>{actionData.success}</span>
        </div>
      )}

      {actionData?.error && (
        <div className="notice-banner error">
          <span>⚠️</span>
          <span>{actionData.error}</span>
        </div>
      )}

      {view === "categories" ? (
        // Categories View Layout
        <div className="console-grid">
          {/* Add/Edit Category Sidebar */}
          <div className="upload-card">
            <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>
            {editingCategory ? (
              <Form method="post">
                <input type="hidden" name="intent" value="edit_category" />
                <input type="hidden" name="id" value={editingCategory.id} />

                <div className="form-group">
                  <label htmlFor="edit-cat-name">Category Name</label>
                  <input
                    type="text"
                    id="edit-cat-name"
                    name="name"
                    className="form-control"
                    defaultValue={editingCategory.name}
                    placeholder="e.g. Vision Plus TVs"
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn-submit" style={{ flexGrow: 1 }} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="form-control"
                    style={{ cursor: "pointer", background: "transparent" }}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="intent" value="add_category" />

                <div className="form-group">
                  <label htmlFor="cat-name">Category Name</label>
                  <input
                    type="text"
                    id="cat-name"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Smart Projectors"
                    required
                  />
                </div>

                <button type="submit" className="btn-submit" style={{ width: "100%" }} disabled={isSubmitting}>
                  ➕ {isSubmitting ? "Adding..." : "Add Category"}
                </button>
              </Form>
            )}
          </div>

          {/* Categories List */}
          <div className="list-card">
            <div style={{ overflowX: "auto" }}>
              <table className="manuals-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Slug Identifier</th>
                    <th>Associated Manuals</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => {
                    const count = manuals.filter(m => m.category === cat.slug).length;
                    return (
                      <tr key={cat.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "#fff" }}>{cat.name}</div>
                        </td>
                        <td>
                          <code style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                            {cat.slug}
                          </code>
                        </td>
                        <td style={{ color: "rgba(255,255,255,0.5)" }}>
                          {count} manuals
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              type="button"
                              className="btn-action edit"
                              onClick={() => setEditingCategory(cat)}
                            >
                              ✏️ Edit
                            </button>
                            <Form method="post" style={{ display: "inline" }} onSubmit={(e) => {
                              if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                                e.preventDefault();
                              }
                            }}>
                              <input type="hidden" name="intent" value="delete_category" />
                              <input type="hidden" name="id" value={cat.id} />
                              <button type="submit" className="btn-action delete">
                                🗑️ Delete
                              </button>
                            </Form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="no-data">
                        No categories found. Add one on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Manuals View Layout (Default View)
        <div className="console-grid">
          {/* Upload/Edit sidebar form */}
          <div className="upload-card">
            <h3>{editingManual ? "Edit Manual Details" : "Upload New Manual/Driver"}</h3>
            
            {editingManual ? (
              <Form method="post">
                <input type="hidden" name="intent" value="edit" />
                <input type="hidden" name="id" value={editingManual.id} />

                <div className="form-group">
                  <label htmlFor="edit-title">Manual/Driver Title</label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    className="form-control"
                    defaultValue={editingManual.title}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-category">Target Category</label>
                  <select
                    id="edit-category"
                    name="category"
                    className="form-control"
                    defaultValue={editingManual.category}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-thumbnail">Product Image URL</label>
                  <input
                    type="text"
                    id="edit-thumbnail"
                    name="thumbnail"
                    className="form-control"
                    defaultValue={editingManual.thumbnail || ""}
                    placeholder="e.g. /assets/images/products/VP8832SW.jpg"
                  />
                  <small style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "11px" }}>
                    Leave blank to show a default PDF icon on the storefront.
                  </small>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn-submit" style={{ flexGrow: 1 }} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingManual(null)}
                    className="form-control"
                    style={{ cursor: "pointer", background: "transparent" }}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            ) : (
              <Form method="post" encType="multipart/form-data">
                <input type="hidden" name="intent" value="upload" />

                <div className="form-group">
                  <label htmlFor="title">Document Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-control"
                    placeholder="e.g. 55-inch 4K Frameless TV Specification"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Select Tab Category</label>
                  <select id="category" name="category" className="form-control" required>
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="thumbnail">Product Image URL</label>
                  <input
                    type="text"
                    id="thumbnail"
                    name="thumbnail"
                    className="form-control"
                    placeholder="e.g. /assets/images/products/VP8832SW.jpg"
                  />
                  <small style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "11px" }}>
                    Copy/paste thumbnail path from any product card.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="pdfFile">Choose PDF File</label>
                  <input
                    type="file"
                    id="pdfFile"
                    name="pdfFile"
                    accept=".pdf"
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn-submit" style={{ width: "100%" }} disabled={isSubmitting}>
                  📥 {isSubmitting ? "Uploading..." : "Upload Manual"}
                </button>
              </Form>
            )}
          </div>

          {/* Data List Panel */}
          <div className="list-card">
            <div className="toolbar-row">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search manuals by title or file name..."
                  className="form-control"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="manuals-table">
                <thead>
                  <tr>
                    <th>Title & File</th>
                    <th>Category</th>
                    <th>Date Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManuals.map(m => {
                    const badge = getCategoryBadgeColor(m.category);
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="manual-title-cell">
                            {m.thumbnail ? (
                              <img src={m.thumbnail} alt="" className="preview-thumb" />
                            ) : (
                              <div className="preview-thumb-placeholder">📄</div>
                            )}
                            <div>
                              <div className="manual-title">{m.title}</div>
                              <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="manual-file-link">
                                📎 {m.fileName}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}>
                            {getCategoryLabel(m.category)}
                          </span>
                        </td>
                        <td style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                          {new Date(m.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              type="button"
                              className="btn-action edit"
                              onClick={() => setEditingManual(m)}
                            >
                              ✏️ Edit
                            </button>
                            <Form method="post" style={{ display: "inline" }} onSubmit={(e) => {
                              if (!confirm("Are you sure you want to delete this manual?")) {
                                e.preventDefault();
                              }
                            }}>
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="id" value={m.id} />
                              <button type="submit" className="btn-action delete">
                                🗑️ Delete
                              </button>
                            </Form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredManuals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="no-data">
                        No manuals or drivers found matching the selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
