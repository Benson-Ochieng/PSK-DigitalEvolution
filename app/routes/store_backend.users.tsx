import { useState, useMemo } from "react";
import { Form, useActionData, useLoaderData, useNavigation, useSearchParams, Link, redirect } from "react-router";
import { db } from "~/lib/db.server";
import type { User } from "~/lib/db.server";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  let users = await db.user.findMany();
  if (search) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    );
  }
  return { users, search, currentUser };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "create_user") {
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const username = formData.get("username")?.toString().trim();
    const role = formData.get("role")?.toString() as any;
    const password = formData.get("password")?.toString();

    if (!name || !email || !username || !role || !password) {
      return { error: "All fields are required to create a user." };
    }

    // Check if user already exists
    const existingEmail = await db.user.findUnique({ where: { email } });
    const existingUser = await db.user.findUnique({ where: { username } });
    if (existingEmail || existingUser) {
      return { error: "User with this username or email already exists." };
    }

    await db.user.create({
      name,
      email,
      username,
      role,
      status: "active",
      passwordHash: password,
    });

    return redirect("/store_backend/users?success=true");
  }

  if (intent === "edit_user") {
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const username = formData.get("username")?.toString().trim();
    const role = formData.get("role")?.toString() as any;
    const password = formData.get("password")?.toString();
    const status = formData.get("status")?.toString() as any;

    if (!id || !name || !email || !username || !role || !status) {
      return { error: "All fields except password are required." };
    }

    if (id === "u-admin" && role !== "administrator") {
      return { error: "Cannot demote the primary administrator." };
    }

    if (id === "u-admin" && status !== "active") {
      return { error: "Cannot suspend the primary administrator." };
    }

    // Check duplicate email or username
    const existingUsers = await db.user.findMany();
    const duplicate = existingUsers.find(
      (u) => (u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()) && u.id !== id
    );
    if (duplicate) {
      return { error: "Another user with this username or email already exists." };
    }

    const data: any = { name, email, username, role, status };
    if (password && password.trim() !== "") {
      data.passwordHash = password;
    }

    await db.user.update({ where: { id }, data });
    return redirect("/store_backend/users?success=true");
  }

  if (intent === "toggle_status") {
    const id = formData.get("id")?.toString();
    if (!id) return null;
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return null;

    if (id === "u-admin") {
      return { error: "Cannot suspend the primary administrator." };
    }

    const newStatus = user.status === "active" ? "suspended" : "active";
    await db.user.update({ where: { id }, data: { status: newStatus } });
    return { success: true };
  }

  if (intent === "reset_password") {
    const id = formData.get("id")?.toString();
    const newPassword = formData.get("newPassword")?.toString();
    if (!id || !newPassword) return null;

    await db.user.update({ where: { id }, data: { passwordHash: newPassword } });
    return { success: true };
  }

  if (intent === "update_profile") {
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!id || !name || !email) {
      return { error: "Name and email are required." };
    }

    const data: any = { name, email };
    if (password) {
      data.passwordHash = password;
    }

    await db.user.update({ where: { id }, data });
    return { success: true, profileUpdated: true };
  }

  if (intent === "delete_user") {
    const id = formData.get("id")?.toString();
    if (!id) return null;

    const { requireAdminUser } = await import("~/lib/sessions.server");
    const currentUser = await requireAdminUser(request);

    if (id === "u-admin" || id === "admin") {
      return { error: "Cannot delete the primary administrator account." };
    }

    if (id === currentUser.id) {
      return { error: "Cannot delete your own active session account." };
    }

    await db.user.delete({ where: { id } });
    return { success: true };
  }

  return null;
}

export default function VpBackendUsers() {
  const { users, search, currentUser } = useLoaderData() as any;
  const actionData = useActionData() as { error?: string; success?: boolean; profileUpdated?: boolean } | undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "all";
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const editUserId = searchParams.get("id");
  const editUser = users.find((u: any) => u.id === editUserId);

  // Notification for bulk simulated actions
  const [notification, setNotification] = useState<string | null>(null);

  // Screen Options States (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showRole, setShowRole] = useState(true);
  const [showPosts, setShowPosts] = useState(true);
  const [showLastLogin, setShowLastLogin] = useState(true);
  const [showMetorik, setShowMetorik] = useState(true);

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter toolbar states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bulkAction, setBulkAction] = useState("");
  const [changeRoleTo, setChangeRoleTo] = useState("");
  const [filterByTag, setFilterByTag] = useState("");
  const [searchQuery, setSearchQuery] = useState(search || "");

  // Checkbox row selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Sorting states
  const [sortKey, setSortKey] = useState<"username" | "name" | "role" | "status" | "ordersCount" | "createdAt" | "posts" | "lastLogin">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: "username" | "name" | "role" | "status" | "ordersCount" | "createdAt" | "posts" | "lastLogin") => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "createdAt" || key === "ordersCount" || key === "posts" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (key: "username" | "name" | "role" | "status" | "ordersCount" | "createdAt" | "posts" | "lastLogin") => {
    if (sortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  // Process real database users and add standard fallback values for UI presentation fields
  const allUsers = useMemo(() => {
    return (users || []).map((u: any) => {
      const is2FA = ["admin", "manager", "Ben", "Jeff"].includes(u.username);
      return {
        ...u,
        twoFactor: u.twoFactor || (is2FA ? "Active" : "Inactive"),
        posts: u.posts !== undefined ? u.posts : (u.role === "administrator" ? 14 : (u.role === "shop_manager" ? 4 : 0)),
        lastLogin: u.lastLogin || (u.username === "admin" ? "2026-06-10 15:15" : "2026-06-10 12:30"),
        zohoTags: u.zohoTags || (u.role === "administrator" ? "admin-team, lead" : "synced"),
        metorik: u.metorik || "Synced",
        wordpress: u.wordpress || (u.username + "@wordpress.com"),
      };
    });
  }, [users]);

  // Filters logic
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u: any) => {
      // 1. Search Query
      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        const matches =
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.username.toLowerCase().includes(s);
        if (!matches) return false;
      }

      // 2. Status / Tabs Filter
      if (statusFilter !== "all") {
        if (statusFilter === "2fa_active") {
          if (u.twoFactor !== "Active") return false;
        } else if (statusFilter === "2fa_inactive") {
          if (u.twoFactor !== "Inactive") return false;
        } else {
          if (u.role !== statusFilter) return false;
        }
      }

      // 3. Tag Filter
      if (filterByTag) {
        if (filterByTag === "No tags") {
          if (u.zohoTags !== "No tags") return false;
        } else {
          if (!u.zohoTags.includes(filterByTag)) return false;
        }
      }

      return true;
    });
  }, [allUsers, searchQuery, statusFilter, filterByTag]);

  // Sorting logic
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a: any, b: any) => {
      let result = 0;
      if (sortKey === "username") {
        result = (a.username || "").localeCompare(b.username || "");
      } else if (sortKey === "name") {
        result = (a.name || "").localeCompare(b.name || "");
      } else if (sortKey === "role") {
        result = (a.role || "").localeCompare(b.role || "");
      } else if (sortKey === "status") {
        result = (a.status || "").localeCompare(b.status || "");
      } else if (sortKey === "ordersCount") {
        result = (a.ordersCount || 0) - (b.ordersCount || 0);
      } else if (sortKey === "posts") {
        result = (a.posts || 0) - (b.posts || 0);
      } else if (sortKey === "lastLogin") {
        result = (a.lastLogin || "").localeCompare(b.lastLogin || "");
      } else if (sortKey === "createdAt") {
        result = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredUsers, sortKey, sortDirection]);

  // Pagination slice
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  // Total role/2fa counts for tabs
  const countAll = allUsers.length;
  const countAdmin = allUsers.filter((u: any) => u.role === "administrator").length;
  const countEditor = allUsers.filter((u: any) => u.role === "editor").length;
  const countAuthor = allUsers.filter((u: any) => u.role === "author").length;
  const countContributor = allUsers.filter((u: any) => u.role === "contributor").length;
  const countSubscriber = allUsers.filter((u: any) => u.role === "subscriber").length;
  const countCustomer = allUsers.filter((u: any) => u.role === "customer").length;
  const countShopManager = allUsers.filter((u: any) => u.role === "shop_manager").length;
  const countSeoManager = allUsers.filter((u: any) => u.role === "seo_manager").length;
  const countSeoEditor = allUsers.filter((u: any) => u.role === "seo_editor").length;
  const count2FAActive = allUsers.filter((u: any) => u.twoFactor === "Active").length;
  const count2FAInactive = allUsers.filter((u: any) => u.twoFactor === "Inactive").length;

  // Reset page when filters change
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    setSelectedUserIds([]);
  };

  const handleApplyBulkAction = () => {
    if (selectedUserIds.length === 0) {
      alert("Please select at least one user first.");
      return;
    }
    if (!bulkAction) {
      alert("Please select a bulk action.");
      return;
    }
    setNotification(`Successfully executed bulk action "${bulkAction}" on ${selectedUserIds.length} users!`);
    setSelectedUserIds([]);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChangeRole = () => {
    if (selectedUserIds.length === 0) {
      alert("Please select at least one user first.");
      return;
    }
    if (!changeRoleTo) {
      alert("Please select a target role.");
      return;
    }
    setNotification(`Successfully changed role to "${changeRoleTo.replace('_', ' ')}" for ${selectedUserIds.length} users!`);
    setSelectedUserIds([]);
    setTimeout(() => setNotification(null), 4000);
  };

  // Modal State
  const [resettingPasswordUser, setResettingPasswordUser] = useState<any | null>(null);

  // Password visibility states
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  return (
    <div className="users-view">
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Screen Options styling */
        .screen-options-container {
          position: relative;
          margin-top: -40px;
          margin-left: -40px;
          margin-right: -40px;
          margin-bottom: 24px;
          z-index: 105;
        }

        .screen-options-wrapper {
          position: absolute;
          top: 0;
          right: 20px;
          z-index: 110;
          display: flex;
          gap: 2px;
        }

        .screen-options-toggle-btn {
          background: #111117;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-top: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 0 0 4px 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .screen-options-toggle-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .screen-options-drawer {
          background: #111117;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0px 40px;
          max-height: 0px;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, opacity 0.25s ease;
        }

        .screen-options-drawer.open {
          padding: 24px 40px;
          max-height: 500px;
          opacity: 1;
        }

        .screen-options-title {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 4px;
        }

        .checkbox-group-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          user-select: none;
          transition: color 0.2s ease;
        }

        .checkbox-label:hover {
          color: #fff;
        }

        .search-bar-row {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .user-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          box-shadow: 0 4px 25px rgba(0,0,0,0.25);
          padding: 24px;
        }

        .role-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .role-pill.administrator {
          background: rgba(71, 47, 143, 0.1);
          color: #ff4d62;
          border: 1px solid rgba(71, 47, 143, 0.25);
        }

        .role-pill.shop_manager {
          background: rgba(0, 204, 255, 0.1);
          color: #00ccff;
          border: 1px solid rgba(0, 204, 255, 0.25);
        }

        .role-pill.customer {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-flex-row {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-mini-action {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-mini-action:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .btn-mini-action.suspend {
          border-color: rgba(255, 77, 98, 0.3);
          color: #ff4d62;
        }

        .btn-mini-action.suspend:hover {
          background: rgba(255, 77, 98, 0.1);
          color: #ff4d62;
        }

        .btn-mini-action.activate {
          border-color: rgba(46, 213, 115, 0.3);
          color: #2ed573;
        }

        .btn-mini-action.activate:hover {
          background: rgba(46, 213, 115, 0.1);
          color: #2ed573;
        }

        .btn-mini-action.delete {
          border-color: rgba(255, 77, 98, 0.35);
          color: #ff4d62;
        }

        .btn-mini-action.delete:hover {
          background: #ff4d62;
          color: #fff;
          border-color: #ff4d62;
          box-shadow: 0 0 10px rgba(255, 77, 98, 0.45);
        }

        /* Glassmorphic Modals */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          background: #111119;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 12px;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 20px;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .modal-close-btn:hover {
          color: #ff4d62;
        }

        .directory-form-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          height: fit-content;
        }

        .form-group-admin {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .form-group-admin label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .form-group-admin input,
        .form-group-admin select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          color: #fff;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .form-group-admin input:focus,
        .form-group-admin select:focus {
          border-color: #00ccff;
        }

        .password-toggle-eye {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 2;
        }

        .password-toggle-eye:hover {
          color: #00ccff !important;
        }

        /* Natively contrast autofilled inputs */
        input:-webkit-autofill ~ .password-toggle-eye,
        input:autofill ~ .password-toggle-eye {
          color: #1e293b !important;
        }
      ` }} />

      {actionData?.error && (
        <div
          style={{
            background: "rgba(255,77,98,0.15)",
            border: "1px solid rgba(255,77,98,0.3)",
            color: "#ff4d62",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          {actionData.error}
        </div>
      )}

      {(actionData?.success || searchParams.get("success") === "true") && (
        <div
          style={{
            background: "rgba(46,213,115,0.15)",
            border: "1px solid rgba(46,213,115,0.3)",
            color: "#2ed573",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          {actionData?.profileUpdated ? "Profile updated successfully!" : "Operation completed successfully!"}
        </div>
      )}

      {/* VIEW: ALL USERS */}
      {currentView === "all" && (
        <>
          <div className="screen-options-container">
            <div className="screen-options-wrapper">
              <button
                type="button"
                className="screen-options-toggle-btn"
                onClick={() => setShowOptions(!showOptions)}
              >
                Screen Options {showOptions ? "▲" : "▼"}
              </button>
            </div>
            <div className={`screen-options-drawer ${showOptions ? "open" : ""}`} style={{ marginBottom: "24px" }}>
              <div className="screen-options-title">Columns</div>
              <div className="checkbox-group-grid">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                  />
                  Email
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showRole}
                    onChange={(e) => setShowRole(e.target.checked)}
                  />
                  Role
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPosts}
                    onChange={(e) => setShowPosts(e.target.checked)}
                  />
                  Posts
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showLastLogin}
                    onChange={(e) => setShowLastLogin(e.target.checked)}
                  />
                  Last Login
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showMetorik}
                    onChange={(e) => setShowMetorik(e.target.checked)}
                  />
                  Metorik
                </label>
              </div>

              <div className="screen-options-title" style={{ marginTop: "24px" }}>Pagination</div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>Number of items per page:</span>
                <input
                  type="number"
                  className="admin-input"
                  style={{ width: "80px", background: "rgba(0,0,0,0.3)", padding: "6px 10px" }}
                  value={tempItemsPerPage}
                  min={1}
                  max={100}
                  onChange={(e) => setTempItemsPerPage(Math.max(1, Number(e.target.value)))}
                />
                <button
                  className="btn-action-primary"
                  style={{ padding: "6px 16px", fontSize: "12px", height: "32px", display: "flex", alignItems: "center" }}
                  onClick={() => {
                    setItemsPerPage(tempItemsPerPage);
                    setCurrentPage(1);
                    setShowOptions(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Title and Action Buttons Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#fff", margin: 0 }}>Users</h2>
              <Link
                to="?view=new"
                className="btn-action-secondary"
                style={{
                  padding: "4px 12px",
                  fontSize: "12px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  borderColor: "rgba(0, 204, 255, 0.4)",
                  color: "#00ccff",
                  textDecoration: "none",
                  background: "rgba(0, 204, 255, 0.05)"
                }}
              >
                Add User
              </Link>
              <button
                type="button"
                className="btn-action-secondary"
                style={{ padding: "4px 12px", fontSize: "12px", height: "30px", display: "flex", alignItems: "center" }}
                onClick={() => alert("CSV Exporting ready")}
              >
                Export
              </button>
              <button
                type="button"
                className="btn-action-secondary"
                style={{ padding: "4px 12px", fontSize: "12px", height: "30px", display: "flex", alignItems: "center" }}
                onClick={() => alert("CSV Importing ready")}
              >
                Import
              </button>
            </div>
          </div>

          {/* Status links & Search box row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
            {/* Status links (WordPress style) */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "rgba(255,255,255,0.3)", flexWrap: "wrap" }}>
              {[
                { id: "all", label: `All` },
                { id: "administrator", label: `Administrator` },
                { id: "editor", label: `Editor` },
                { id: "author", label: `Author` },
                { id: "contributor", label: `Contributor` },
                { id: "subscriber", label: `Subscriber` },
                { id: "customer", label: `Customer` },
                { id: "shop_manager", label: `Shop manager` }
              ].map((tab, idx, arr) => (
                <span key={tab.id} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleStatusFilterChange(tab.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                      cursor: "pointer",
                      color: statusFilter === tab.id ? "#00ccff" : "rgba(255,255,255,0.7)",
                      fontWeight: statusFilter === tab.id ? "600" : "normal"
                    }}
                  >
                    {tab.label}
                  </button>
                  {idx < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>}
                </span>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                placeholder="Search Users..."
                className="admin-input"
                style={{ height: "32px", width: "200px", padding: "4px 10px", fontSize: "13px" }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button
                type="button"
                className="btn-action-secondary"
                style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer", borderColor: "rgba(255,255,255,0.15)" }}
              >
                Search Users
              </button>
            </div>
          </div>

          {/* Action toolbar row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            {/* Filters left */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <select
                className="admin-select"
                style={{ minWidth: "130px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">Bulk actions</option>
                <option value="suspend">Suspend</option>
                <option value="activate">Activate</option>
                <option value="delete">Delete</option>
              </select>
              <button
                type="button"
                className="btn-action-secondary"
                style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
                onClick={handleApplyBulkAction}
              >
                Apply
              </button>

              <select
                className="admin-select"
                style={{ minWidth: "150px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
                value={changeRoleTo}
                onChange={(e) => setChangeRoleTo(e.target.value)}
              >
                <option value="">Change role to...</option>
                <option value="administrator">Administrator</option>
                <option value="editor">Editor</option>
                <option value="author">Author</option>
                <option value="contributor">Contributor</option>
                <option value="subscriber">Subscriber</option>
                <option value="customer">Customer</option>
                <option value="shop_manager">Shop manager</option>
              </select>
              <button
                type="button"
                className="btn-action-secondary"
                style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
                onClick={handleChangeRole}
              >
                Change
              </button>

              <select
                className="admin-select"
                style={{ minWidth: "140px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
                value={filterByTag}
                onChange={(e) => {
                  setFilterByTag(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Filter By Tag</option>
                <option value="admin-team">admin-team</option>
                <option value="lead">lead</option>
                <option value="synced">synced</option>
                <option value="newsletter-sub">newsletter-sub</option>
                <option value="customer-sync">customer-sync</option>
                <option value="No tags">No tags</option>
              </select>
              <button
                type="button"
                className="btn-action-secondary"
                style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
                onClick={() => setCurrentPage(1)}
              >
                Filter
              </button>

              {/* Clear filters shortcut */}
              {(searchQuery || statusFilter !== "all" || filterByTag) && (
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ff4d62",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: "0 4px",
                    textDecoration: "underline"
                  }}
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setFilterByTag("");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Pagination controls right */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              <span>{filteredUsers.length.toLocaleString()} items</span>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ padding: "0 8px", height: "28px", display: "flex", alignItems: "center", fontSize: "11px" }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  «
                </button>
                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ padding: "0 8px", height: "28px", display: "flex", alignItems: "center", fontSize: "11px" }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  ‹
                </button>

                <input
                  type="number"
                  className="admin-input"
                  style={{ width: "45px", height: "28px", padding: "0", textAlign: "center", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
                  value={currentPage}
                  min={1}
                  max={totalPages || 1}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(totalPages || 1, Number(e.target.value)));
                    setCurrentPage(val);
                  }}
                />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>of {totalPages || 1}</span>

                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ padding: "0 8px", height: "28px", display: "flex", alignItems: "center", fontSize: "11px" }}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  ›
                </button>
                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ padding: "0 8px", height: "28px", display: "flex", alignItems: "center", fontSize: "11px" }}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  »
                </button>
              </div>
            </div>
          </div>

          {notification && (
            <div
              style={{
                background: "rgba(0, 204, 255, 0.15)",
                border: "1px solid rgba(0, 204, 255, 0.3)",
                color: "#00ccff",
                padding: "10px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                fontWeight: "600",
                textAlign: "center"
              }}
            >
              ℹ️ {notification}
            </div>
          )}

          <div className="user-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && paginatedUsers.every((u: any) => selectedUserIds.includes(u.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(paginatedUsers.map((u: any) => u.id));
                          } else {
                            setSelectedUserIds([]);
                          }
                        }}
                      />
                    </th>
                    <th onClick={() => handleSort("username")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Username {renderSortIndicator("username")}
                    </th>
                    <th onClick={() => handleSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Name
                    </th>
                    {showEmail && (
                      <th onClick={() => handleSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Email
                      </th>
                    )}
                    {showRole && (
                      <th onClick={() => handleSort("role")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Access Role {renderSortIndicator("role")}
                      </th>
                    )}
                    {showPosts && (
                      <th onClick={() => handleSort("posts")} style={{ cursor: "pointer", userSelect: "none", textAlign: "center" }}>
                        Posts {renderSortIndicator("posts")}
                      </th>
                    )}
                    {showLastLogin && (
                      <th onClick={() => handleSort("lastLogin")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Last Login {renderSortIndicator("lastLogin")}
                      </th>
                    )}
                    {showMetorik && (
                      <th style={{ userSelect: "none", textAlign: "center" }}>
                        Metorik
                      </th>
                    )}
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user: any) => (
                    <tr key={user.id}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, user.id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: "600", fontFamily: "monospace", color: "#fff" }}>
                        {user.username}
                      </td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#fff" }}>{user.name}</div>
                      </td>
                      {showEmail && (
                        <td>
                          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                            {user.email}
                          </div>
                        </td>
                      )}
                      {showRole && (
                        <td>
                          <span className={`role-pill ${user.role}`}>
                            {user.role.replace("_", " ")}
                          </span>
                        </td>
                      )}
                      {showPosts && (
                        <td style={{ fontWeight: "600", textAlign: "center", color: "#00ccff" }}>
                          {user.posts}
                        </td>
                      )}
                      {showLastLogin && (
                        <td style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                          {user.lastLogin}
                        </td>
                      )}
                      {showMetorik && (
                        <td style={{ textAlign: "center" }}>
                          <span className={`status-badge ${user.metorik === "Synced" ? "completed" : "processing"}`}>
                            {user.metorik}
                          </span>
                        </td>
                      )}
                      <td>
                        <div className="action-flex-row">
                          <Link
                            to={`/store_backend/users?view=edit&id=${user.id}`}
                            className="btn-mini-action"
                            style={{ textDecoration: "none" }}
                          >
                            Edit
                          </Link>

                          <button
                            className="btn-mini-action"
                            onClick={() => {
                              setResettingPasswordUser(user);
                            }}
                          >
                            Reset PW
                          </button>

                          {user.id !== "u-admin" && (
                            <Form method="post" onSubmit={(e) => {
                              if (!confirm(`Are you sure you want to ${user.status === "active" ? "suspend" : "activate"} this user account?`)) {
                                e.preventDefault();
                              }
                            }}>
                              <input type="hidden" name="intent" value="toggle_status" />
                              <input type="hidden" name="id" value={user.id} />
                              <button
                                type="submit"
                                className={`btn-mini-action ${user.status === "active" ? "suspend" : "activate"}`}
                              >
                                {user.status === "active" ? "Suspend" : "Activate"}
                              </button>
                            </Form>
                          )}

                          {user.id !== "u-admin" && user.id !== "admin" && user.id !== currentUser?.id && (
                            <Form method="post" onSubmit={(e) => {
                              if (!confirm(`WARNING: Are you sure you want to permanently delete the user account "${user.name || user.username}"? This action cannot be undone.`)) {
                                e.preventDefault();
                              }
                            }}>
                              <input type="hidden" name="intent" value="delete_user" />
                              <input type="hidden" name="id" value={user.id} />
                              <button
                                type="submit"
                                className="btn-mini-action delete"
                              >
                                Delete
                              </button>
                            </Form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW: ADD USER */}
      {currentView === "new" && (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Add New Secure Account</h2>
            <Link to="/store_backend/users" className="btn-action-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              ◀ Back to Directory
            </Link>
          </div>

          <div className="directory-form-card" style={{ width: "100%" }}>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="create_user" />

              <div className="form-group-admin">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Samuel Maina"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-admin">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="sam@petstore.co.ke"
                    required
                  />
                </div>
                <div className="form-group-admin">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="samuelm"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-admin">
                  <label>Access Permission Level</label>
                  <select name="role" required>
                    <option value="administrator">Administrator</option>
                    <option value="editor">Editor</option>
                    <option value="author">Author</option>
                    <option value="contributor">Contributor</option>
                    <option value="subscriber">Subscriber</option>
                    <option value="customer">Customer</option>
                    <option value="shop_manager">Shop manager</option>
                  </select>
                </div>
                <div className="form-group-admin">
                  <label>Temporary Password</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showNewUserPassword ? "text" : "password"}
                      name="password"
                      placeholder="Set temporary password"
                      required
                      style={{ width: "100%", paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      className="password-toggle-eye"
                      onClick={() => setShowNewUserPassword(prev => !prev)}
                      title={showNewUserPassword ? "Hide password" : "Show password"}
                    >
                      {showNewUserPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-action-primary" style={{ width: "100%", marginTop: "24px", height: "44px" }} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Provision User"}
              </button>
            </Form>
          </div>
        </div>
      )}

      {/* VIEW: EDIT USER */}
      {currentView === "edit" && editUser && (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Edit Account: {editUser.name}</h2>
            <Link to="/store_backend/users" className="btn-action-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              ◀ Back to Directory
            </Link>
          </div>

          <div className="directory-form-card" style={{ width: "100%" }}>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="edit_user" />
              <input type="hidden" name="id" value={editUser.id} />

              <div className="form-group-admin">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editUser.name}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-admin">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editUser.email}
                    required
                  />
                </div>
                <div className="form-group-admin">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={editUser.username}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-admin">
                  <label>Access Permission Level</label>
                  <select name="role" defaultValue={editUser.role} required>
                    <option value="administrator">Administrator</option>
                    <option value="editor">Editor</option>
                    <option value="author">Author</option>
                    <option value="contributor">Contributor</option>
                    <option value="subscriber">Subscriber</option>
                    <option value="customer">Customer</option>
                    <option value="shop_manager">Shop manager</option>
                  </select>
                </div>
                <div className="form-group-admin">
                  <label>Account Status</label>
                  <select name="status" defaultValue={editUser.status} required>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="form-group-admin" style={{ marginTop: "8px" }}>
                <label>Update Password (leave blank to keep current)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter new password to change"
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    className="password-toggle-eye"
                    onClick={() => setShowNewUserPassword(prev => !prev)}
                    title={showNewUserPassword ? "Hide password" : "Show password"}
                  >
                    {showNewUserPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-action-primary" style={{ width: "100%", marginTop: "24px", height: "44px" }} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save User Changes"}
              </button>
            </Form>
          </div>
        </div>
      )}

      {/* VIEW: PROFILE */}
      {currentView === "profile" && currentUser && (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>My Profile</h2>
            <Link to="/store_backend/users" className="btn-action-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              ◀ Back to Directory
            </Link>
          </div>

          <div className="directory-form-card" style={{ width: "100%" }}>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="update_profile" />
              <input type="hidden" name="id" value={currentUser.id} />

              <div className="form-group-admin">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={currentUser.name}
                  required
                />
              </div>

              <div className="form-group-admin">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={currentUser.email}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-admin">
                  <label>Username</label>
                  <input
                    type="text"
                    defaultValue={currentUser.username}
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  />
                </div>
                <div className="form-group-admin">
                  <label>Role</label>
                  <input
                    type="text"
                    defaultValue={currentUser.role.replace("_", " ").toUpperCase()}
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  />
                </div>
              </div>

              <div className="form-group-admin" style={{ marginTop: "8px" }}>
                <label>Change Password (leave blank to keep current)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showProfilePassword ? "text" : "password"}
                    name="password"
                    placeholder="New password"
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    className="password-toggle-eye"
                    onClick={() => setShowProfilePassword(prev => !prev)}
                    title={showProfilePassword ? "Hide password" : "Show password"}
                  >
                    {showProfilePassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-action-primary" style={{ width: "100%", marginTop: "24px", height: "44px" }} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Profile"}
              </button>
            </Form>
          </div>
        </div>
      )}

      {/* Reset Password Modal (Only for view === 'all') */}
      {resettingPasswordUser && currentView === "all" && (
        <div
          className="modal-overlay"
          onClick={() => setResettingPasswordUser(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
                Reset User Password
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setResettingPasswordUser(null)}
              >
                ×
              </button>
            </div>

            <Form
              method="post"
              onSubmit={() => {
                setTimeout(() => setResettingPasswordUser(null), 300);
              }}
            >
              <input type="hidden" name="intent" value="reset_password" />
              <input type="hidden" name="id" value={resettingPasswordUser.id} />

              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>
                  Provide a new password for account{" "}
                  <strong>{resettingPasswordUser.name}</strong> (
                  {resettingPasswordUser.username}). They will need this password to log in.
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label className="admin-label" htmlFor="newPassword">
                  New Password
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    className="admin-input"
                    type={showResetPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    placeholder="Enter new secure password"
                    required
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    className="password-toggle-eye"
                    onClick={() => setShowResetPassword(prev => !prev)}
                    title={showResetPassword ? "Hide password" : "Show password"}
                  >
                    {showResetPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setResettingPasswordUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
