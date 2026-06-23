import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin.blogs";
import { query } from "../db.server";

export function meta() {
  return [{ title: "Manage Blog Posts — PetStore Kenya Admin" }];
}

export async function loader() {
  const { rows } = await query("SELECT * FROM blog_posts ORDER BY published_at DESC");
  return { posts: rows };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "delete") {
    const id = formData.get("id");
    if (!id) return { error: "ID is required for deletion" };
    
    await query("DELETE FROM blog_posts WHERE id = $1", [id]);
    return { success: true };
  }

  // Common details
  const title = formData.get("title")?.toString();
  const slug = formData.get("slug")?.toString();
  const content = formData.get("content")?.toString();
  const excerpt = formData.get("excerpt")?.toString() || null;
  const image_url = formData.get("image_url")?.toString() || null;
  const published_at = formData.get("published_at")?.toString() || new Date().toISOString();

  if (!title || !slug || !content) {
    return { error: "Title, Slug, and Content are required fields" };
  }

  try {
    if (intent === "create") {
      await query(
        `INSERT INTO blog_posts (title, slug, content, excerpt, image_url, published_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [title, slug, content, excerpt, image_url, published_at]
      );
      return { success: true };
    }

    if (intent === "update") {
      const id = formData.get("id");
      if (!id) return { error: "ID is required for updating" };

      await query(
        `UPDATE blog_posts SET
           title = $1, slug = $2, content = $3, excerpt = $4, image_url = $5, published_at = $6
         WHERE id = $7`,
        [title, slug, content, excerpt, image_url, published_at, id]
      );
      return { success: true };
    }
  } catch (err: any) {
    console.error("Blog action error:", err);
    return { error: err.message || "Operation failed" };
  }

  return {};
}

export default function AdminBlogs() {
  const { posts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // State to manage edit vs add mode
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function startEdit(post: any) {
    setEditingPost(post);
    setIsAdding(false);
    document.getElementById("blog-form-container")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelForm() {
    setEditingPost(null);
    setIsAdding(false);
  }

  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#fff" }}>📝 Blog Posts & Education</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: "0.25rem" }}>
            Manage articles, guides, and educational content on the store
          </p>
        </div>

        {!isAdding && !editingPost && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-admin-primary"
          >
            ➕ Add Blog Post
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

      {/* Form Section */}
      {(isAdding || editingPost) && (
        <div id="blog-form-container" style={{ background: "var(--admin-card-bg)", border: "2px solid var(--admin-accent)", padding: "1.5rem", marginBottom: "2rem", boxShadow: "4px 4px 0px #111" }}>
          <h2 style={{ fontSize: "0.95rem", color: "#fff", marginBottom: "1.25rem", borderBottom: "1px solid var(--admin-border)", paddingBottom: "0.5rem" }}>
            {isAdding ? "➕ Add New Blog Post" : `✏️ Edit: ${editingPost.title}`}
          </h2>

          <Form method="post" onSubmit={cancelForm}>
            <input type="hidden" name="intent" value={isAdding ? "create" : "update"} />
            {editingPost && <input type="hidden" name="id" value={editingPost.id} />}

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                <div className="form-group">
                  <label htmlFor="title">Post Title *</label>
                  <input type="text" id="title" name="title" defaultValue={editingPost?.title || ""} required className="form-control" />
                </div>
                <div className="form-group">
                  <label htmlFor="slug">Slug (URL Part) *</label>
                  <input type="text" id="slug" name="slug" defaultValue={editingPost?.slug || ""} required className="form-control" placeholder="e.g. essential-dog-care" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                <div className="form-group">
                  <label htmlFor="image_url">Image URL</label>
                  <input type="text" id="image_url" name="image_url" defaultValue={editingPost?.image_url || ""} className="form-control" placeholder="/images/puppy-150x150.webp" />
                </div>
                <div className="form-group">
                  <label htmlFor="published_at">Publish Date</label>
                  <input 
                    type="datetime-local" 
                    id="published_at" 
                    name="published_at" 
                    defaultValue={editingPost?.published_at ? new Date(editingPost.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)} 
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="excerpt">Excerpt / Short Summary (Intro description)</label>
                <textarea id="excerpt" name="excerpt" defaultValue={editingPost?.excerpt || ""} className="form-control" style={{ height: "60px", resize: "vertical" }} />
              </div>

              <div className="form-group">
                <label htmlFor="content">Full Article Content *</label>
                <textarea id="content" name="content" defaultValue={editingPost?.content || ""} required className="form-control" style={{ height: "180px", resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
              <button type="button" onClick={cancelForm} className="btn-admin-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-admin-primary">
                {isSubmitting ? "Saving..." : "Save Blog Post"}
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* Blogs Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Slug</th>
              <th>Publish Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--admin-text-muted)" }}>
                  No posts yet. Click "Add Blog Post" to write your first article!
                </td>
              </tr>
            ) : (
              posts.map((post: any) => (
                <tr key={post.id}>
                  <td style={{ width: "50px", padding: "0.5rem" }}>
                    <div style={{ width: "40px", height: "40px", background: "#fff", border: "1px solid var(--admin-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      <img 
                        src={post.image_url || "/images/puppy-150x150.webp"} 
                        alt="" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        onError={(e) => {
                          e.currentTarget.src = "/images/puppy-150x150.webp";
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: "#fff" }}>{post.title}</td>
                  <td style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{post.slug}</td>
                  <td>{new Date(post.published_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => startEdit(post)}
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
                        if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
                          e.preventDefault();
                        }
                      }}>
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={post.id} />
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
