import { useState } from "react";
import { Form, useLoaderData, useSearchParams, redirect } from "react-router";
import fs from "fs";
import path from "path";
import { getHistoryEvents, logHistoryEvent, clearHistoryEvents } from "~/lib/content.server";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  // Load all users from the database for the "By User" filter dropdown
  const { db } = await import("~/lib/db.server");
  const allDbUsers = await db.user.findMany();

  // Load events
  let events = getHistoryEvents();

  // Seed events if empty to demonstrate functionality
  if (events.length === 0) {
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const historyFilePath = path.join(CONTENT_DIR, "history.json");
    
    events = [
      {
        id: "evt-seed1",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        user: "System Admin",
        action: "User Logged In",
        details: "Successfully signed into the administration panel",
        icon: "🔑"
      },
      {
        id: "evt-seed2",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        user: "Shop Manager",
        action: "Product Quick-Edited",
        details: 'Quick edited product "Cool-Pods" (Price: KSh 525, Stock: instock)',
        icon: "📦"
      },
      {
        id: "evt-seed3",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        user: "System Admin",
        action: "Page Created",
        details: 'Created new page "Terms and Conditions"',
        icon: "📄"
      },
      {
        id: "evt-seed4",
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        user: "System Admin",
        action: "Product Created",
        details: 'Created new product "55\\" 4K Frameless QLED Vidaa TV" (SKU: VP55Q)',
        icon: "📦"
      }
    ];

    try {
      if (!fs.existsSync(CONTENT_DIR)) {
        fs.mkdirSync(CONTENT_DIR, { recursive: true });
      }
      fs.writeFileSync(historyFilePath, JSON.stringify(events, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to seed initial history events:", e);
    }
  }

  // Load Settings
  const CONTENT_DIR = path.join(process.cwd(), "content");
  const settingsPath = path.join(CONTENT_DIR, "history_settings.json");
  let settings = {
    logLogins: true,
    logProducts: true,
    logPages: true,
    logCoupons: true,
    logRetention: 1000
  };

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch (e) {}
  }

  // Build comprehensive user list: DB users + any extra names found only in events
  const dbUserNames = allDbUsers.map((u: any) => u.name);
  const eventUserNames = events.map((e: any) => e.user);
  const allUserNames = Array.from(new Set([...dbUserNames, ...eventUserNames])).sort();

  return { events, currentUser, settings, allUserNames };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "clear_logs") {
    clearHistoryEvents();
    // Log the clear action as the first entry
    logHistoryEvent(currentUser.name, "Logs Cleared", "Cleared all system activity history logs", "🗑️");
    return { success: true, message: "Logs cleared successfully" };
  }

  if (intent === "save_settings") {
    const logLogins = formData.get("logLogins") === "true";
    const logProducts = formData.get("logProducts") === "true";
    const logPages = formData.get("logPages") === "true";
    const logCoupons = formData.get("logCoupons") === "true";
    const logRetention = Number(formData.get("logRetention") || 1000);

    const updatedSettings = {
      logLogins,
      logProducts,
      logPages,
      logCoupons,
      logRetention
    };

    try {
      const CONTENT_DIR = path.join(process.cwd(), "content");
      fs.writeFileSync(
        path.join(CONTENT_DIR, "history_settings.json"),
        JSON.stringify(updatedSettings, null, 2),
        "utf-8"
      );
      logHistoryEvent(currentUser.name, "Settings Updated", "Updated history log configurations", "⚙️");
    } catch (e) {
      console.error("Failed to save history settings:", e);
    }

    return { success: true, message: "Settings saved successfully" };
  }

  return null;
}

export default function VpBackendHistory() {
  const { events, currentUser, settings, allUserNames } = useLoaderData() as any;
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "log";

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateMode, setDateMode] = useState("all"); // "all", "single", "range"
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get unique actions for filter (still from events, since actions are event-specific)
  const uniqueActions = Array.from(new Set(events.map((e: any) => e.action)));

  // Date formatting helpers
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const getTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 600);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Filter logs
  const filteredEvents = events.filter((e: any) => {
    const matchesSearch =
      !searchQuery ||
      e.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUser = userFilter === "all" || e.user === userFilter;
    const matchesAction = actionFilter === "all" || e.action === actionFilter;

    // Date filtering logic
    let matchesDate = true;
    if (e.timestamp) {
      const eventDateStr = e.timestamp.split("T")[0]; // E.g., "2026-06-04"
      if (dateMode === "single") {
        matchesDate = !singleDate || eventDateStr === singleDate;
      } else if (dateMode === "range") {
        const matchesStart = !startDate || eventDateStr >= startDate;
        const matchesEnd = !endDate || eventDateStr <= endDate;
        matchesDate = matchesStart && matchesEnd;
      }
    }

    return matchesSearch && matchesUser && matchesAction && matchesDate;
  });

  // Calculate insights statistics
  const totalLogsCount = events.length;
  const userActionCounts = events.reduce((acc: any, curr: any) => {
    acc[curr.user] = (acc[curr.user] || 0) + 1;
    return acc;
  }, {});
  const mostActiveUser = Object.keys(userActionCounts).reduce((a, b) => userActionCounts[a] > userActionCounts[b] ? a : b, "N/A");
  const mostActiveUserCount = userActionCounts[mostActiveUser] || 0;

  const actionDistribution = events.reduce((acc: any, curr: any) => {
    acc[curr.action] = (acc[curr.action] || 0) + 1;
    return acc;
  }, {});

  // Generate exports data URIs
  const getCSVDataURI = () => {
    const header = ["Event ID", "Timestamp", "User", "Action", "Details"];
    const rows = events.map((e: any) => [
      e.id,
      e.timestamp,
      e.user,
      e.action,
      e.details.replace(/"/g, '""')
    ]);
    const csvContent = [header.join(","), ...rows.map((r: any) => r.map((val: any) => `"${val}"`).join(","))].join("\n");
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  };

  const getJSONDataURI = () => {
    return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(events, null, 2))}`;
  };

  return (
    <div className="history-page">
      <style dangerouslySetInnerHTML={{ __html: `
        .history-page {
          color: #f3f4f6;
          font-family: 'Poppins', sans-serif;
        }

        .history-tabs {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 24px;
          padding-bottom: 8px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 6px;
          text-decoration: none;
        }

        .tab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }

        .tab-btn.active {
          color: #ff4d62;
          background: rgba(255, 77, 98, 0.08);
          font-weight: 600;
        }

        /* Filter Controls */
        .history-filters {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-select, .search-input {
          background: #09090d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 6px;
          outline: none;
          min-width: 180px;
          transition: all 0.3s ease;
          color-scheme: dark;
        }

        .filter-select:focus, .search-input:focus {
          border-color: rgba(255, 77, 98, 0.4);
        }

        /* Event Timeline */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          transition: all 0.3s ease;
        }

        .timeline-card:hover {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .timeline-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .event-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .event-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-action {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .event-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .user-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 77, 98, 0.1);
          color: #ff4d62;
          border: 1px solid rgba(255, 77, 98, 0.2);
        }

        .user-tag.manager {
          background: rgba(0, 204, 255, 0.1);
          color: #00ccff;
          border-color: rgba(0, 204, 255, 0.2);
        }

        .timeline-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          min-width: 120px;
        }

        .time-ago {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        .time-precise {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Insights Cards */
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-title {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
        }

        .stat-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Settings CSS */
        .settings-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 24px;
          max-width: 600px;
        }

        .settings-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .settings-row:last-of-type {
          border-bottom: none;
        }

        .settings-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-label {
          font-weight: 600;
          font-size: 14px;
          color: #fff;
        }

        .settings-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #ff4d62;
        }

        input:focus + .slider {
          box-shadow: 0 0 1px #ff4d62;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .btn-primary {
          background: #ff4d62;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 77, 98, 0.2);
        }

        .btn-primary:hover {
          background: #472f8f;
          box-shadow: 0 4px 20px rgba(255, 77, 98, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-danger {
          background: rgba(255, 77, 98, 0.1);
          color: #ff4d62;
          border: 1px solid rgba(255, 77, 98, 0.3);
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-danger:hover {
          background: #ff4d62;
          color: #fff;
          box-shadow: 0 4px 15px rgba(255, 77, 98, 0.3);
        }
      ` }} />

      <div className="history-tabs">
        <a href="/store_backend/history?view=log" className={`tab-btn ${currentView === "log" ? "active" : ""}`}>
          📋 Event Log
        </a>
        <a href="/store_backend/history?view=insights" className={`tab-btn ${currentView === "insights" ? "active" : ""}`}>
          📊 History Insights
        </a>
        <a href="/store_backend/history?view=export" className={`tab-btn ${currentView === "export" ? "active" : ""}`}>
          💾 Export & Tools
        </a>
        <a href="/store_backend/history?view=settings" className={`tab-btn ${currentView === "settings" ? "active" : ""}`}>
          ⚙️ Settings
        </a>
      </div>

      {/* VIEW: EVENT LOG */}
      {currentView === "log" && (
        <div>
          <div className="history-filters">
            <div className="filter-group">
              <label>Search details</label>
              <input
                type="text"
                placeholder="Search event keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>By User</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Users</option>
                {allUserNames.map((u: any) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>By Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((a: any) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Date Filter</label>
              <select
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value)}
                className="filter-select"
                style={{ minWidth: "140px" }}
              >
                <option value="all">All Dates</option>
                <option value="single">Single Date</option>
                <option value="range">Date Range</option>
              </select>
            </div>

            {dateMode === "single" && (
              <div className="filter-group">
                <label>Select Date</label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="search-input"
                  style={{ minWidth: "150px" }}
                />
              </div>
            )}

            {dateMode === "range" && (
              <>
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="search-input"
                    style={{ minWidth: "150px" }}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="search-input"
                    style={{ minWidth: "150px" }}
                  />
                </div>
              </>
            )}

            {(dateMode !== "all" && (singleDate || startDate || endDate)) && (
              <button
                type="button"
                onClick={() => {
                  setSingleDate("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="btn-secondary"
                style={{ height: "38px", marginTop: "18px", fontSize: "12px", padding: "0 12px" }}
              >
                Clear Date
              </button>
            )}
          </div>

          <div className="timeline-container">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((e: any) => (
                <div className="timeline-card" key={e.id}>
                  <div className="timeline-left">
                    <div className="event-icon-wrapper">
                      {e.icon || "⏳"}
                    </div>
                    <div className="event-details">
                      <div className="event-action">
                        {e.action}
                        <span className={`user-tag ${e.user === "Shop Manager" ? "manager" : ""}`}>
                          {e.user}
                        </span>
                      </div>
                      <div className="event-desc">{e.details}</div>
                    </div>
                  </div>
                  <div className="timeline-right">
                    <span className="time-ago">{getTimeAgo(e.timestamp)}</span>
                    <span className="time-precise">{formatDateTime(e.timestamp)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                No events matched your filtering criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: INSIGHTS */}
      {currentView === "insights" && (
        <div>
          <div className="insights-grid">
            <div className="stat-card">
              <span className="stat-title">Total Audit Logs</span>
              <span className="stat-number">{totalLogsCount}</span>
              <span className="stat-meta">Recorded operations since seed</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Most Active Editor</span>
              <span className="stat-number" style={{ fontSize: "24px", wordBreak: "break-all" }}>{mostActiveUser}</span>
              <span className="stat-meta">{mostActiveUserCount} audit activities triggered</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Storage Persistence</span>
              <span className="stat-number">JSON</span>
              <span className="stat-meta">Preserved in content/history.json</span>
            </div>
          </div>

          <div className="stat-card" style={{ maxWidth: "600px" }}>
            <span className="stat-title" style={{ marginBottom: "16px", display: "block" }}>Action Breakdown</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Object.entries(actionDistribution).map(([action, count]: any) => {
                const percentage = Math.round((count / totalLogsCount) * 100);
                return (
                  <div key={action}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <span>{action}</span>
                      <span style={{ fontWeight: "600" }}>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${percentage}%`, height: "100%", background: "#ff4d62", borderRadius: "3px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: EXPORT */}
      {currentView === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="stat-card" style={{ maxWidth: "600px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", marginBottom: "8px" }}>Download System Audit Trail</h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
              Export all logged actions in either standard CSV format (importable into spreadsheet software like Microsoft Excel or Google Sheets) or raw JSON formats.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <a href={getCSVDataURI()} download={`history-log-${Date.now()}.csv`} className="btn-primary" style={{ textDecoration: "none", textAlign: "center" }}>
                📥 Download CSV Log
              </a>
              <a href={getJSONDataURI()} download={`history-log-${Date.now()}.json`} className="btn-secondary" style={{ textDecoration: "none", textAlign: "center" }}>
                📥 Download JSON
              </a>
            </div>
          </div>

          <div className="stat-card" style={{ maxWidth: "600px", border: "1px solid rgba(255, 77, 98, 0.15)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#ff4d62", marginBottom: "8px" }}>Reset Logs & Diagnostics</h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
              Caution: Permanently deletes all items from the persistent `content/history.json` storage file. This operation is not reversible.
            </p>
            <Form method="post" onSubmit={(e) => {
              if (!confirm("Are you absolutely sure you want to delete all historical logs? This cannot be undone.")) {
                e.preventDefault();
              }
            }}>
              <input type="hidden" name="intent" value="clear_logs" />
              <button type="submit" className="btn-danger">
                🗑️ Clear History Logs
              </button>
            </Form>
          </div>
        </div>
      )}

      {/* VIEW: SETTINGS */}
      {currentView === "settings" && (
        <div className="settings-card">
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", marginBottom: "16px" }}>Event Logging Config</h3>
          <Form method="post">
            <input type="hidden" name="intent" value="save_settings" />
            
            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">Log User Sign Ins</span>
                <span className="settings-desc">Record a timestamp and audit trail when users log in.</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="logLogins" value="true" defaultChecked={settings.logLogins} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">Log Product Modifications</span>
                <span className="settings-desc">Audit creations, edits, duplications, and deletion of products.</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="logProducts" value="true" defaultChecked={settings.logProducts} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">Log Pages Operations</span>
                <span className="settings-desc">Log creations, revisions, clone copies, and trashings of layout pages.</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="logPages" value="true" defaultChecked={settings.logPages} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">Log Coupon Console Activity</span>
                <span className="settings-desc">Audit promotion creations, activations, and discounts console edits.</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="logCoupons" value="true" defaultChecked={settings.logCoupons} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
              <div className="settings-info">
                <span className="settings-label">Audit retention limit</span>
                <span className="settings-desc">Specify maximum items count to keep in file memory (default: 1000 events).</span>
              </div>
              <input
                type="number"
                name="logRetention"
                defaultValue={settings.logRetention}
                style={{
                  background: "#09090d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  color: "#fff",
                  padding: "8px 12px",
                  fontSize: "13px",
                  width: "120px",
                  marginTop: "6px"
                }}
              />
            </div>

            <div style={{ marginTop: "24px" }}>
              <button type="submit" className="btn-primary">
                💾 Save Settings
              </button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
