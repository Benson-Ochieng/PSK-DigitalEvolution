import { useState, useEffect } from "react";
import { Form, useLoaderData, useSearchParams, redirect, Link } from "react-router";
import { query } from "~/db.server";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const { rows } = await query("SELECT id, question, answer, sort_order FROM faqs ORDER BY sort_order ASC, id ASC");

  const url = new URL(request.url);
  const editId = url.searchParams.get("id");
  let editFaq = null;
  if (editId) {
    const faqId = parseInt(editId, 10);
    if (!isNaN(faqId)) {
      editFaq = rows.find(f => f.id === faqId) || null;
    }
  }

  return { faqs: rows, editFaq, currentUser };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "add_faq" || intent === "save_faq_details") {
    const id = formData.get("id")?.toString() || "";
    const question = formData.get("question")?.toString() || "";
    const answer = formData.get("answer")?.toString() || "";
    const sortOrderVal = formData.get("sort_order")?.toString() || "0";
    const sortOrder = parseInt(sortOrderVal, 10) || 0;

    if (!question || !answer) {
      return { error: "Question and Answer are required." };
    }

    if (intent === "add_faq") {
      await query(
        "INSERT INTO faqs (question, answer, sort_order) VALUES ($1, $2, $3)",
        [question, answer, sortOrder]
      );

      try {
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(currentUser.name, "FAQ Created", `Created FAQ: "${question}"`, "❓");
      } catch (e) { }
    } else {
      const faqId = parseInt(id, 10);
      if (!isNaN(faqId)) {
        await query(
          "UPDATE faqs SET question = $1, answer = $2, sort_order = $3 WHERE id = $4",
          [question, answer, sortOrder, faqId]
        );

        try {
          const { logHistoryEvent } = await import("~/lib/content.server");
          logHistoryEvent(currentUser.name, "FAQ Updated", `Updated FAQ: "${question}"`, "❓");
        } catch (e) { }
      }
    }
    return redirect("/store_backend/faqs");
  }

  if (intent === "delete_faq") {
    const id = formData.get("id")?.toString() || "";
    const faqId = parseInt(id, 10);
    if (!isNaN(faqId)) {
      const { rows } = await query("SELECT question FROM faqs WHERE id = $1", [faqId]);
      if (rows.length > 0) {
        await query("DELETE FROM faqs WHERE id = $1", [faqId]);

        try {
          const { logHistoryEvent } = await import("~/lib/content.server");
          logHistoryEvent(currentUser.name, "FAQ Deleted", `Deleted FAQ: "${rows[0].question}"`, "🗑️");
        } catch (e) { }
      }
    }
    return { success: true };
  }

  return null;
}

export default function VpBackendFaqs() {
  const { faqs, editFaq } = useLoaderData() as {
    faqs: Array<{ id: number; question: string; answer: string; sort_order: number }>;
    editFaq: { id: number; question: string; answer: string; sort_order: number } | null;
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "all";

  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(f =>
    !searchQuery ||
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number, question: string) => {
    if (!confirm(`Are you sure you want to permanently delete this FAQ: "${question}"?`)) return;
    const body = new FormData();
    body.append("intent", "delete_faq");
    body.append("id", String(id));
    await fetch(window.location.href, { method: "POST", body });
    window.location.reload();
  };

  return (
    <div className="faqs-admin-page">
      <style dangerouslySetInnerHTML={{
        __html: `
        .faqs-admin-page {
          color: #f3f4f6;
          font-family: 'Poppins', sans-serif;
        }

        .admin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .admin-title-wrap h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #ffffff 40%, #1e5da7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .btn-add-new {
          background: linear-gradient(135deg, #1E5DA7 0%, #a50011 100%);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-add-new:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 93, 167, 0.4);
        }

        .faqs-search-row {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .search-input {
          background: #09090d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 6px;
          outline: none;
          width: 320px;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #00ccff;
          box-shadow: 0 0 10px rgba(0, 204, 255, 0.15);
        }

        .faqs-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }

        .faqs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .faqs-table th {
          background: rgba(255, 255, 255, 0.03);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.4);
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .faqs-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 13px;
          vertical-align: middle;
        }

        .faqs-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        .faq-question-cell {
          font-weight: 600;
          color: #fff;
        }

        .row-actions {
          display: flex;
          gap: 12px;
          margin-top: 6px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .faqs-table tr:hover .row-actions {
          opacity: 1;
        }

        .action-link {
          font-size: 11px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 0;
          cursor: pointer;
          text-decoration: none;
        }

        .action-link:hover {
          color: #00ccff;
        }

        .action-link.delete-action:hover {
          color: #ff3333;
        }

        /* Form Styles */
        .editor-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 28px;
          max-width: 800px;
        }

        .form-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .form-row label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .form-input, .form-textarea {
          background: #09090d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 6px;
          outline: none;
          transition: all 0.3s ease;
        }

        .form-input:focus, .form-textarea:focus {
          border-color: #00ccff;
          box-shadow: 0 0 10px rgba(0, 204, 255, 0.15);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .btn-submit {
          background: #1e5da7;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-submit:hover {
          background: #15457a;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      ` }} />

      <div className="admin-header-row">
        <div className="admin-title-wrap">
          <h1>FAQs Management</h1>
        </div>
        {currentView === "all" && (
          <Link to="/store_backend/faqs?view=new" className="btn-add-new">
            + Add New FAQ
          </Link>
        )}
      </div>

      {currentView === "all" ? (
        <>
          <div className="faqs-search-row">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              Total: {filteredFaqs.length} FAQs
            </div>
          </div>

          <div className="faqs-table-card">
            <table className="faqs-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Order</th>
                  <th>Question</th>
                  <th>Answer Excerpt</th>
                  <th style={{ width: "100px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaqs.map(faq => (
                  <tr key={faq.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e5da7" }}>
                        {faq.sort_order}
                      </span>
                    </td>
                    <td>
                      <div className="faq-question-cell">{faq.question}</div>
                      <div className="row-actions">
                        <Link to={`/store_backend/faqs?view=edit&id=${faq.id}`} className="action-link">
                          Edit
                        </Link>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
                        <button
                          onClick={() => handleDelete(faq.id, faq.question)}
                          className="action-link delete-action"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", maxHeight: "40px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        to={`/store_backend/faqs?view=edit&id=${faq.id}`}
                        style={{ textDecoration: "none", color: "#00ccff", fontWeight: 600, fontSize: "12px" }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredFaqs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                      No FAQs found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="editor-container">
          <Form method="post">
            <input type="hidden" name="intent" value={currentView === "new" ? "add_faq" : "save_faq_details"} />
            {currentView === "edit" && editFaq && (
              <input type="hidden" name="id" value={editFaq.id} />
            )}

            <div className="form-row">
              <label htmlFor="question">Question</label>
              <input
                type="text"
                id="question"
                name="question"
                required
                defaultValue={currentView === "edit" && editFaq ? editFaq.question : ""}
                className="form-input"
                placeholder="e.g. What is your return policy?"
              />
            </div>

            <div className="form-row">
              <label htmlFor="answer">Answer (HTML supported)</label>
              <textarea
                id="answer"
                name="answer"
                required
                rows={10}
                defaultValue={currentView === "edit" && editFaq ? editFaq.answer : ""}
                className="form-textarea"
                placeholder="<p>State the answer here. You can use standard HTML markup tags like <p>, <strong>, and <a>.</p>"
              />
            </div>

            <div className="form-row" style={{ width: "200px" }}>
              <label htmlFor="sort_order">Sort Order (Ascending)</label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                required
                defaultValue={currentView === "edit" && editFaq ? editFaq.sort_order : 0}
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {currentView === "new" ? "Create FAQ" : "Save Changes"}
              </button>
              <Link to="/store_backend/faqs" className="btn-cancel">
                Cancel
              </Link>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
