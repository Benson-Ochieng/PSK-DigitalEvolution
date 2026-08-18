import { useState } from "react";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router";
import { getEmailLogs, getEmailStats, deleteEmailLog, clearEmailLogs, type EmailLog } from "~/lib/email-log.server";
import { sendTestEmail, sendCustomEmail } from "~/lib/notification.server";

export async function loader() {
  const logs = getEmailLogs();
  const stats = getEmailStats();
  return { logs, stats };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "send_test") {
    const toEmail = formData.get("toEmail")?.toString().trim();
    if (!toEmail) {
      return { error: "Please enter a valid recipient email address." };
    }
    const result = await sendTestEmail(toEmail);
    if (result.success) {
      return { success: result.message };
    } else {
      return { error: result.message };
    }
  }

  if (intent === "resend") {
    const logId = formData.get("logId")?.toString();
    const logs = getEmailLogs();
    const target = logs.find(l => l.id === logId);
    if (!target) {
      return { error: "Email log record not found." };
    }

    const success = await sendCustomEmail({
      to: target.to,
      subject: target.subject,
      html: target.bodyHtml || target.bodyText || "",
      text: target.bodyText || target.subject,
      purpose: target.purpose
    });

    if (success) {
      return { success: `Email re-dispatched successfully to ${target.to}` };
    } else {
      return { error: `Failed to re-dispatch email to ${target.to}. Check SMTP configuration.` };
    }
  }

  if (intent === "delete") {
    const logId = formData.get("logId")?.toString();
    if (logId) {
      deleteEmailLog(logId);
      return { success: "Email log entry deleted." };
    }
  }

  if (intent === "clear_all") {
    clearEmailLogs();
    return { success: "All email logs have been cleared." };
  }

  return null;
}

export default function StoreBackendEmails() {
  const { logs, stats } = useLoaderData() as { logs: EmailLog[]; stats: any };
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isSubmitting = navigation.state === "submitting";

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("ben@granularit.com");
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(() => {
    const previewId = searchParams.get("preview");
    if (previewId) {
      return logs.find(l => l.id === previewId) || null;
    }
    return null;
  });
  const [previewTab, setPreviewTab] = useState<"html" | "text" | "headers">("html");

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
    if (purposeFilter !== "ALL" && log.purpose !== purposeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTo = log.to.toLowerCase().includes(q);
      const matchSub = log.subject.toLowerCase().includes(q);
      const matchFrom = log.from.toLowerCase().includes(q);
      const matchPurpose = log.purpose?.toLowerCase().includes(q);
      if (!matchTo && !matchSub && !matchFrom && !matchPurpose) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "To", "From", "Subject", "Purpose", "Transport", "Status", "Message ID"];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.to.replace(/"/g, '""')}"`,
      `"${l.from.replace(/"/g, '""')}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      l.purpose || "General",
      l.transport,
      l.status,
      l.messageId || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `psk_email_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="email-logs-page animate-fade-in" style={{ padding: "0 4px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .email-logs-page {
          color: #f3f4f6;
          font-family: 'Poppins', sans-serif;
        }

        .stats-grid-emails {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .email-stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .email-stat-card::after {
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

        .email-stat-card.total::after { background: #00ccff; }
        .email-stat-card.delivered::after { background: #2ed573; }
        .email-stat-card.failed::after { background: #ff4d62; }
        .email-stat-card.transport::after { background: #a855f7; }

        .toolbar-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .input-dark {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          padding: 8px 14px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .input-dark:focus {
          border-color: #00ccff;
        }

        .btn-primary-glow {
          background: linear-gradient(135deg, #1E5DA7 0%, #00ccff 100%);
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(0, 204, 255, 0.2);
          transition: all 0.2s ease;
        }

        .btn-primary-glow:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 204, 255, 0.35);
        }

        .btn-secondary-dark {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-secondary-dark:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-card {
          background: #0f1015;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          overflow: hidden;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .badge-status {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
        }
        .badge-status.delivered, .badge-status.sent {
          background: rgba(46, 213, 115, 0.15);
          color: #2ed573;
          border: 1px solid rgba(46, 213, 115, 0.3);
        }
        .badge-status.failed {
          background: rgba(255, 77, 98, 0.15);
          color: #ff4d62;
          border: 1px solid rgba(255, 77, 98, 0.3);
        }

        .action-icon-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        .action-icon-btn:hover {
          color: #00ccff;
          background: rgba(0, 204, 255, 0.1);
        }
      ` }} />

      {/* Header Notification Banners */}
      {actionData?.success && (
        <div style={{ background: "rgba(46, 213, 115, 0.15)", border: "1px solid rgba(46, 213, 115, 0.3)", color: "#2ed573", padding: "12px 20px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
          <span>✓</span>
          <span>{actionData.success}</span>
        </div>
      )}

      {actionData?.error && (
        <div style={{ background: "rgba(255, 77, 98, 0.15)", border: "1px solid rgba(255, 77, 98, 0.3)", color: "#ff4d62", padding: "12px 20px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
          <span>⚠️</span>
          <span>{actionData.error}</span>
        </div>
      )}

      {/* Page Title & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px 0", color: "#fff" }}>
            Email Logs & Delivery Console
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255, 255, 255, 0.5)" }}>
            Monitor and audit all outbound email notifications, 2FA OTP codes, and order communications in real-time.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            className="btn-primary-glow"
            onClick={() => setTestModalOpen(true)}
          >
            <span>✉️</span> Send Test Email
          </button>

          <button
            type="button"
            className="btn-secondary-dark"
            onClick={handleExportCSV}
          >
            <span>⬇</span> Export CSV
          </button>

          {logs.length > 0 && (
            <Form method="post" onSubmit={(e) => { if (!confirm("Are you sure you want to clear all email logs? This cannot be undone.")) e.preventDefault(); }}>
              <input type="hidden" name="intent" value="clear_all" />
              <button
                type="submit"
                className="btn-secondary-dark"
                style={{ color: "#ff4d62", borderColor: "rgba(255, 77, 98, 0.3)" }}
              >
                <span>🗑️</span> Clear Logs
              </button>
            </Form>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid-emails">
        <div className="email-stat-card total">
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>
            Total Dispatched
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>
            {stats.totalSent}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            Lifetime recorded emails
          </div>
        </div>

        <div className="email-stat-card delivered">
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>
            Delivery Success Rate
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#2ed573", marginBottom: "4px" }}>
            {stats.deliveryRate}%
          </div>
          <div style={{ fontSize: "12px", color: "#2ed573" }}>
            ✓ {stats.delivered} delivered successfully
          </div>
        </div>

        <div className="email-stat-card failed">
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>
            Delivery Issues / Bounced
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: stats.failed > 0 ? "#ff4d62" : "#fff", marginBottom: "4px" }}>
            {stats.failed}
          </div>
          <div style={{ fontSize: "12px", color: stats.failed > 0 ? "#ff4d62" : "rgba(255,255,255,0.5)" }}>
            {stats.failed > 0 ? "Requires investigation" : "Zero delivery errors"}
          </div>
        </div>

        <div className="email-stat-card transport">
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>
            Active Mail Transport
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#00ccff", marginBottom: "4px" }}>
            Google SMTP
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
            smtp.gmail.com:465 (TLS/SSL)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar-box">
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              className="input-dark"
              style={{ width: "100%", paddingLeft: "36px" }}
              placeholder="Search recipient, subject, purpose..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
              🔍
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>Status:</label>
            <select
              className="input-dark"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>Purpose:</label>
            <select
              className="input-dark"
              value={purposeFilter}
              onChange={(e) => { setPurposeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Purposes</option>
              <option value="2FA Security Verification">2FA Verification</option>
              <option value="Order Notification">Order Notification</option>
              <option value="System Test">System Test</option>
              <option value="Password Reset">Password Reset</option>
              <option value="Customer Notice">Customer Notice</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
          Showing <strong>{paginatedLogs.length}</strong> of <strong>{filteredLogs.length}</strong> logs
        </div>
      </div>

      {/* Main Email Logs Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dispatched At</th>
                <th>Recipient (To)</th>
                <th>Subject & Purpose</th>
                <th>Transport</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "rgba(255, 255, 255, 0.4)" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>📬</div>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#fff", marginBottom: "4px" }}>No Email Logs Found</div>
                    <div style={{ fontSize: "13px" }}>No outgoing email dispatches matched your current filters.</div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: "600", color: "#fff" }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>
                        {new Date(log.timestamp).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>

                    {/* Recipient */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(0, 204, 255, 0.2), rgba(30, 93, 167, 0.2))", color: "#00ccff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", border: "1px solid rgba(0, 204, 255, 0.3)" }}>
                          {(log.to || "E").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div style={{ fontWeight: "600", color: "#fff", fontSize: "13px" }}>{log.to}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>From: {log.from}</div>
                        </div>
                      </div>
                    </td>

                    {/* Subject & Purpose */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "13px", color: "#f3f4f6", fontWeight: "500" }}>{log.subject}</span>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", color: "#00ccff", background: "rgba(0, 204, 255, 0.1)", border: "1px solid rgba(0, 204, 255, 0.2)", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                            {log.purpose || "General"}
                          </span>
                          {log.messageId && (
                            <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "monospace" }}>
                              {log.messageId.slice(0, 18)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Transport */}
                    <td style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span>⚡</span>
                        <span>{log.transport || "Google SMTP"}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge-status ${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                      {log.error && (
                        <div style={{ fontSize: "10px", color: "#ff4d62", marginTop: "2px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.error}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="action-icon-btn"
                          title="Preview Email"
                          onClick={() => { setPreviewLog(log); setPreviewTab("html"); }}
                        >
                          👁️
                        </button>

                        <Form method="post" onSubmit={(e) => { if (!confirm(`Resend this email to ${log.to}?`)) e.preventDefault(); }}>
                          <input type="hidden" name="intent" value="resend" />
                          <input type="hidden" name="logId" value={log.id} />
                          <button
                            type="submit"
                            className="action-icon-btn"
                            title="Resend Email"
                            disabled={isSubmitting}
                          >
                            🔄
                          </button>
                        </Form>

                        <Form method="post" onSubmit={(e) => { if (!confirm("Delete this email log record?")) e.preventDefault(); }}>
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="logId" value={log.id} />
                          <button
                            type="submit"
                            className="action-icon-btn"
                            style={{ color: "#ff4d62" }}
                            title="Delete Log"
                          >
                            🗑️
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
            <div>
              Showing {((validPage - 1) * itemsPerPage) + 1}–{Math.min(validPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                disabled={validPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="btn-secondary-dark"
                style={{ padding: "4px 10px", fontSize: "12px", opacity: validPage <= 1 ? 0.35 : 1, cursor: validPage <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <span style={{ padding: "0 6px", color: "#fff", fontSize: "12px" }}>
                Page {validPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="btn-secondary-dark"
                style={{ padding: "4px 10px", fontSize: "12px", opacity: validPage >= totalPages ? 0.35 : 1, cursor: validPage >= totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Send Test Email Modal */}
      {testModalOpen && (
        <div className="modal-overlay" onClick={() => setTestModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>✉️</span>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff" }}>Send Test Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <Form method="post" onSubmit={() => setTestModalOpen(false)}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>
                  This will dispatch a live diagnostic test message via <strong>Google SMTP (smtp.gmail.com:465)</strong> to verify your mail delivery configuration.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#fff" }}>Recipient Email Address</label>
                  <input
                    type="email"
                    name="toEmail"
                    required
                    className="input-dark"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="e.g. ben@granularit.com"
                  />
                </div>

                <div style={{ background: "rgba(0, 204, 255, 0.05)", border: "1px solid rgba(0, 204, 255, 0.2)", borderRadius: "8px", padding: "12px 16px", fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
                  <div><strong>From:</strong> &quot;PSK - Digital Evolution System&quot; &lt;ben@granularit.com&gt;</div>
                  <div style={{ marginTop: "4px" }}><strong>Transport:</strong> Google SMTP SSL (Port 465)</div>
                </div>

                <input type="hidden" name="intent" value="send_test" />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary-dark"
                  onClick={() => setTestModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Dispatching..." : "Send Test Now 🚀"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewLog && (
        <div className="modal-overlay" onClick={() => setPreviewLog(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#fff" }}>Email Details & Content Inspector</h3>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Log ID: {previewLog.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLog(null)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.3)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", padding: "0 24px" }}>
              <button
                type="button"
                onClick={() => setPreviewTab("html")}
                style={{
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: previewTab === "html" ? "2px solid #00ccff" : "2px solid transparent",
                  color: previewTab === "html" ? "#00ccff" : "rgba(255,255,255,0.6)",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Rendered HTML Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("text")}
                style={{
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: previewTab === "text" ? "2px solid #00ccff" : "2px solid transparent",
                  color: previewTab === "text" ? "#00ccff" : "rgba(255,255,255,0.6)",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Plain Text View
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("headers")}
                style={{
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: previewTab === "headers" ? "2px solid #00ccff" : "2px solid transparent",
                  color: previewTab === "headers" ? "#00ccff" : "rgba(255,255,255,0.6)",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Header & Metadata
              </button>
            </div>

            <div className="modal-body">
              {/* Common Header Info */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", fontSize: "13px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>To:</span>
                  <span style={{ fontWeight: "600", color: "#fff" }}>{previewLog.to}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>From:</span>
                  <span style={{ color: "#f3f4f6" }}>{previewLog.from}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Subject:</span>
                  <span style={{ fontWeight: "600", color: "#00ccff" }}>{previewLog.subject}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Status:</span>
                  <div>
                    <span className={`badge-status ${previewLog.status.toLowerCase()}`}>
                      {previewLog.status}
                    </span>
                    <span style={{ marginLeft: "10px", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                      via {previewLog.transport} at {new Date(previewLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab Contents */}
              {previewTab === "html" && (
                <div style={{ background: "#ffffff", borderRadius: "8px", padding: "16px", color: "#1e293b", minHeight: "240px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1)" }}>
                  {previewLog.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: previewLog.bodyHtml }} />
                  ) : (
                    <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", color: "#334155" }}>
                      {previewLog.bodyText || "No HTML content available."}
                    </div>
                  )}
                </div>
              )}

              {previewTab === "text" && (
                <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "16px", fontFamily: "monospace", fontSize: "13px", color: "#e2e8f0", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                  {previewLog.bodyText || "No plain text content available."}
                </div>
              )}

              {previewTab === "headers" && (
                <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "16px", fontFamily: "monospace", fontSize: "12px", color: "#38bdf8", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div><strong>Log ID:</strong> {previewLog.id}</div>
                  <div><strong>Dispatched Timestamp:</strong> {previewLog.timestamp}</div>
                  <div><strong>Purpose:</strong> {previewLog.purpose || "General"}</div>
                  <div><strong>Transport Provider:</strong> {previewLog.transport}</div>
                  <div><strong>SMTP Message ID:</strong> {previewLog.messageId || "N/A"}</div>
                  <div><strong>Delivery Status:</strong> {previewLog.status}</div>
                  {previewLog.error && <div style={{ color: "#ff4d62" }}><strong>Error Details:</strong> {previewLog.error}</div>}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Form method="post" onSubmit={() => setPreviewLog(null)}>
                <input type="hidden" name="intent" value="resend" />
                <input type="hidden" name="logId" value={previewLog.id} />
                <button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={isSubmitting}
                >
                  🔄 Resend Email
                </button>
              </Form>

              <button
                type="button"
                className="btn-secondary-dark"
                onClick={() => setPreviewLog(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
