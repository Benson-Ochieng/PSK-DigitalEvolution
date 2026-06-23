import { useState, useEffect, useRef } from "react";
import { Form, Link, Outlet, redirect, useLoaderData, useLocation } from "react-router";
import type { User } from "~/lib/db.server";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser, checkAdminBranch } = await import("~/lib/sessions.server");
  checkAdminBranch();
  
  const user = await requireAdminUser(request);
  const { getAllReviews } = await import("~/lib/content.server");
  const { db } = await import("~/lib/db.server");
  const reviewsCount = getAllReviews().length;
  const ordersCount = (await db.order.findMany()).length;
  return { user, reviewsCount, ordersCount };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  if (formData.get("intent") === "logout") {
    const { logout } = await import("~/lib/sessions.server");
    return logout(request);
  }
  return null;
}

export default function VpBackendLayout() {
  const { user, reviewsCount, ordersCount } = useLoaderData() as { user: User; reviewsCount: number; ordersCount: number };
  const location = useLocation();

  const [productsOpen, setProductsOpen] = useState(
    location.pathname.startsWith("/store_backend/products")
  );
  const [productsHovered, setProductsHovered] = useState(false);
  const [pagesHovered, setPagesHovered] = useState(false);
  const [usersHovered, setUsersHovered] = useState(false);
  const [downloadsHovered, setDownloadsHovered] = useState(false);
  const [historyHovered, setHistoryHovered] = useState(false);
  const [postsHovered, setPostsHovered] = useState(false);
  const [mediaHovered, setMediaHovered] = useState(false);
  const [analyticsHovered, setAnalyticsHovered] = useState(false);
  const [commerceHovered, setCommerceHovered] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsHovered, setSettingsHovered] = useState(false);

  const hoverTimeouts = useRef<Record<string, any>>({});

  const handleHoverStart = (menuKey: string, setter: (val: boolean) => void) => {
    if (hoverTimeouts.current[menuKey]) {
      clearTimeout(hoverTimeouts.current[menuKey]);
    }
    hoverTimeouts.current[menuKey] = setTimeout(() => {
      setter(true);
    }, 150);
  };

  const handleHoverEnd = (menuKey: string, setter: (val: boolean) => void) => {
    if (hoverTimeouts.current[menuKey]) {
      clearTimeout(hoverTimeouts.current[menuKey]);
    }
    hoverTimeouts.current[menuKey] = setTimeout(() => {
      setter(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(hoverTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vp_sidebar_collapsed");
      if (stored === "true") {
        setSidebarCollapsed(true);
      }
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("vp_sidebar_collapsed", String(nextState));
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/store_backend", icon: "📊" },
    { label: "Simple History", path: "/store_backend/history", icon: "⏳" },
    { label: "Media Library", path: "/store_backend/media", icon: "🖼️" },
    { label: "Posts", path: "/store_backend/posts", icon: "📝" },
    { label: "Products", path: "/store_backend/products", icon: "📦" },
    { label: "Analytics", path: "/store_backend/analytics", icon: "📈" },
    { label: "Pages", path: "/store_backend/pages", icon: "📄" },
    { label: "Comments", path: "/store_backend/comments", icon: "💬" },
    { label: "Manuals & Drivers", path: "/store_backend/downloads", icon: "📥" },
    { label: "User Directory", path: "/store_backend/users", icon: "👥" },
    { label: "Live Orders", path: "/store_backend/orders", icon: "🛒" },
    { label: "Coupon Console", path: "/store_backend/coupons", icon: "🎫" },
    { label: "Settings", path: "/store_backend/settings", icon: "⚙️" },
  ];

  return (
    <div className={`admin-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-layout {
          min-height: 100vh;
          background: #0d0d12;
          color: #f3f4f6;
          font-family: 'Poppins', sans-serif;
          display: grid;
          grid-template-columns: 280px 1fr;
          overflow: hidden;
          transition: grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .admin-layout.sidebar-collapsed {
          grid-template-columns: 70px 1fr !important;
        }

        .admin-layout.sidebar-collapsed .admin-sidebar {
          padding: 24px 8px !important;
          align-items: center !important;
        }

        .admin-layout.sidebar-collapsed .brand-logo-text,
        .admin-layout.sidebar-collapsed .brand-badge,
        .admin-layout.sidebar-collapsed .sidebar-profile,
        .admin-layout.sidebar-collapsed .nav-label,
        .admin-layout.sidebar-collapsed .chevron-icon,
        .admin-layout.sidebar-collapsed .submenu-container,
        .admin-layout.sidebar-collapsed .logout-text {
          display: none !important;
        }

        .admin-layout.sidebar-collapsed .sidebar-brand {
          justify-content: center !important;
          padding-bottom: 16px !important;
          margin-bottom: 16px !important;
        }

        .admin-layout.sidebar-collapsed .nav-item {
          justify-content: center !important;
          padding: 12px 0 !important;
          width: 100% !important;
          gap: 0 !important;
        }

        .admin-layout.sidebar-collapsed .nav-item div {
          gap: 0 !important;
        }

        .admin-layout.sidebar-collapsed .btn-logout {
          padding: 10px 0 !important;
          justify-content: center !important;
          border: none !important;
        }

        .collapse-icon-wrapper {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #3b82f6;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .btn-collapse-sidebar:hover .collapse-icon-wrapper {
          background: #2563eb;
          transform: scale(1.1);
        }

        /* Sidebar styling */
        .admin-sidebar {
          background: #07070a;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        /* Clean custom scrollbar for sidebar */
        .admin-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        .admin-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
        }
        .admin-sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 24px;
        }

        .brand-logo-text {
          font-weight: 800;
          font-size: 20px;
          letter-spacing: 1.5px;
          background: linear-gradient(135deg, #ffffff 40%, #ff7b8b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-badge {
          background: #472f8f;
          color: #fff;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        /* User Profile in Sidebar */
        .sidebar-profile {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .profile-name {
          font-weight: 600;
          font-size: 14px;
          color: #fff;
        }

        .profile-email {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          word-break: break-all;
        }

        .profile-role-badge {
          align-self: flex-start;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-role-badge.administrator {
          background: rgba(71, 47, 143, 0.15);
          color: #ff4d62;
          border: 1.5px solid rgba(71, 47, 143, 0.35);
        }

        .profile-role-badge.shop_manager {
          background: rgba(0, 204, 255, 0.15);
          color: #00ccff;
          border: 1.5px solid rgba(0, 204, 255, 0.35);
        }

        /* Header User Menu & Dropdown */
        .header-user-menu {
          position: relative;
          display: inline-block;
          cursor: pointer;
        }

        .header-user-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #f3f4f6;
          font-weight: 500;
          font-size: 13px;
          transition: all 0.3s ease;
        }

        .header-user-menu:hover .header-user-trigger {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .user-avatar-small {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff4d62 0%, #472f8f 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }

        /* Dropdown positioning */
        .header-user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          background: #09090d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .header-user-menu:hover .header-user-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-profile-info {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 16px;
        }

        .user-avatar-large {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          background: linear-gradient(135deg, #ff4d62 0%, #472f8f 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 28px;
          box-shadow: 0 4px 12px rgba(71, 47, 143, 0.2);
        }

        .dropdown-text-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dropdown-user-name {
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          text-align: left;
        }

        .dropdown-user-email {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          word-break: break-all;
          margin-bottom: 6px;
          text-align: left;
        }

        .dropdown-edit-link {
          font-size: 12px;
          color: #00ccff;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
          text-align: left;
        }

        .dropdown-edit-link:hover {
          color: #0099ff;
          text-decoration: underline;
        }

        .dropdown-actions {
          display: flex;
          flex-direction: column;
        }

        .logout-form-header {
          width: 100%;
        }

        .btn-logout-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(71, 47, 143, 0.1);
          border: 1px solid rgba(71, 47, 143, 0.3);
          color: #ff4d62;
          padding: 8px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-logout-header:hover {
          background: #472f8f;
          border-color: #472f8f;
          color: #fff;
        }

        /* Navigation menu */
        .sidebar-nav {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .nav-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(71, 47, 143, 0.15) 0%, rgba(7, 7, 10, 0) 100%);
          border-left: 3px solid #472f8f;
          padding-left: 13px; /* subtract 3px for alignment */
        }

        /* Logout button */
        .logout-form {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 16px;
          margin-top: auto;
        }

        .btn-logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: transparent;
          border: 1px solid rgba(71, 47, 143, 0.3);
          color: #ff4d62;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-logout:hover {
          background: rgba(71, 47, 143, 0.1);
          border-color: #472f8f;
          color: #fff;
        }

        /* Main area styling */
        .admin-main {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow-y: auto;
        }

        .admin-header {
          background: #09090d;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 20px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title-section h1 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }

        .header-meta-section {
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .storefront-button {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px 16px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .storefront-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
          transform: translateY(-1px);
        }

        .storefront-button:active {
          transform: translateY(0);
        }

        .storefront-btn-logo {
          height: 16px;
          width: auto;
          object-fit: contain;
          filter: brightness(1);
          transition: filter 0.3s ease;
        }

        .storefront-button:hover .storefront-btn-logo {
          filter: brightness(1.2);
        }

        .storefront-button .arrow-icon {
          font-size: 11px;
          opacity: 0.6;
          transition: transform 0.3s ease;
        }

        .storefront-button:hover .arrow-icon {
          opacity: 1;
          transform: translate(2px, -2px);
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(46, 213, 115, 0.1);
          color: #2ed573;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #2ed573;
          border-radius: 50%;
          box-shadow: 0 0 8px #2ed573;
          animation: pulse-dot 1.5s infinite;
        }

        @keyframes pulse-dot {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        /* Content container */
        .admin-content-viewport {
          padding: 40px;
          flex-grow: 1;
          position: relative;
        }

        /* Common reusable styles for dashboards */
        .dashboard-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .dashboard-grid-2 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .dashboard-grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .admin-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .admin-card:hover {
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
        }

        .admin-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .admin-card-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-stat {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
        }

        .card-trend {
          font-size: 12px;
          font-weight: 600;
          margin-top: 6px;
        }

        .trend-up { color: #2ed573; }
        .trend-down { color: #ff4d62; }

        /* Tables & Lists */
        .admin-table-wrapper {
          overflow-x: auto;
          margin-top: 16px;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .admin-table th {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }

        .admin-table td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.85);
          vertical-align: middle;
        }

        .admin-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        /* Forms */
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .admin-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 6px;
        }

        .admin-input, .admin-select, .admin-textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 10px 12px;
          color: #fff;
          font-size: 13px;
          transition: all 0.3s ease;
          outline: none;
        }

        .admin-input:focus, .admin-select:focus, .admin-textarea:focus {
          border-color: #00ccff;
          box-shadow: 0 0 10px rgba(0, 204, 255, 0.15);
        }

        .btn-action-primary {
          background: linear-gradient(135deg, #472f8f 0%, #a50011 100%);
          border: none;
          color: #fff;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-action-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(71, 47, 143, 0.4);
        }

        .btn-action-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-action-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        /* Status colors */
        .status-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .status-badge.processing {
          background: rgba(255, 159, 67, 0.15);
          color: #ff9f43;
          border: 1px solid rgba(255, 159, 67, 0.3);
        }

        .status-badge.completed {
          background: rgba(46, 213, 115, 0.15);
          color: #2ed573;
          border: 1px solid rgba(46, 213, 115, 0.3);
        }

        .status-badge.pending_payment {
          background: rgba(0, 204, 255, 0.15);
          color: #00ccff;
          border: 1px solid rgba(0, 204, 255, 0.3);
        }

        .status-badge.failed, .status-badge.cancelled {
          background: rgba(255, 77, 98, 0.15);
          color: #ff4d62;
          border: 1px solid rgba(255, 77, 98, 0.3);
        }

        /* Search inputs */
        .search-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 6px 14px;
          width: 100%;
          max-width: 360px;
        }

        .search-input-wrapper input {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 13px;
          outline: none;
          width: 100%;
        }

        /* Submenu container with premium animation */
        .submenu-container {
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin-top 0.3s ease;
          padding-left: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-left: 1px solid rgba(255, 255, 255, 0.05);
          margin-left: 23px; /* aligns nicely with icon */
        }

        .submenu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          font-size: 13px;
          font-weight: 400;
          transition: all 0.2s ease;
        }

        .submenu-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
          padding-left: 18px; /* subtle slide effect on hover */
        }

        .submenu-item.active {
          color: #ff4d62;
          font-weight: 600;
          background: rgba(255, 77, 98, 0.05);
        }

        .submenu-badge {
          background: #2563eb;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
        }

        .menu-parent {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .chevron-icon {
          font-size: 8px;
          transition: transform 0.3s ease;
          color: rgba(255, 255, 255, 0.4);
          margin-right: 4px;
        }

        .chevron-icon.rotated {
          transform: rotate(90deg);
        }

        @media (max-width: 768px) {
          .admin-layout {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
          .admin-sidebar {
            height: auto;
            position: relative;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding: 20px;
          }
          .sidebar-brand {
            margin-bottom: 16px;
            padding-bottom: 16px;
          }
          .sidebar-profile {
            margin-bottom: 16px;
          }
          .sidebar-nav {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
          }
          .nav-item {
            padding: 8px 12px;
            font-size: 13px;
            white-space: nowrap;
          }
          .logout-form {
            border-top: none;
            padding-top: 0;
            margin-top: 16px;
            width: 100%;
          }
          .btn-logout {
            padding: 8px 12px;
          }
          .admin-header {
            padding: 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .admin-content-viewport {
            padding: 20px;
          }
        }
      ` }} />

      <aside className="admin-sidebar">
        <div>
          <div className="sidebar-brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
            <span className="brand-badge nav-label">Admin</span>
          </div>



          <nav className="sidebar-nav">
            {/* Dashboard */}
            <Link
              to="/store_backend"
              className={`nav-item ${location.pathname === "/store_backend" ? "active" : ""}`}
            >
              <span style={{ fontSize: "16px" }}>📊</span>
              <span className="nav-label">Dashboard</span>
            </Link>

            {/* Simple History Collapsible Submenu */}
            <div
              onMouseEnter={() => handleHoverStart("history", setHistoryHovered)}
              onMouseLeave={() => handleHoverEnd("history", setHistoryHovered)}
            >
              <Link
                to="/store_backend/history"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/history") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>⏳</span>
                  <span className="nav-label">Simple History</span>
                </div>
                <span className={`chevron-icon ${historyHovered || location.pathname.startsWith("/store_backend/history") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (historyHovered || location.pathname.startsWith("/store_backend/history")) ? "180px" : "0px",
                  opacity: (historyHovered || location.pathname.startsWith("/store_backend/history")) ? 1 : 0,
                  marginTop: (historyHovered || location.pathname.startsWith("/store_backend/history")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/history"
                  className={`submenu-item ${(location.pathname === "/store_backend/history" && (!location.search || location.search.includes("view=log") || !location.search.includes("view="))) ? "active" : ""}`}
                >
                  Event Log
                </Link>
                <Link
                  to="/store_backend/history?view=insights"
                  className={`submenu-item ${location.search.includes("view=insights") ? "active" : ""}`}
                >
                  History Insights
                </Link>
                <Link
                  to="/store_backend/history?view=export"
                  className={`submenu-item ${location.search.includes("view=export") ? "active" : ""}`}
                >
                  Export & Tools
                </Link>
                <Link
                  to="/store_backend/history?view=settings"
                  className={`submenu-item ${location.search.includes("view=settings") ? "active" : ""}`}
                >
                  Settings
                </Link>
              </div>
            </div>

            {/* PSK Commerce Collapsible Submenu */}
            <div
              onMouseEnter={() => handleHoverStart("commerce", setCommerceHovered)}
              onMouseLeave={() => handleHoverEnd("commerce", setCommerceHovered)}
            >
              <Link
                to="/store_backend/orders"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/orders") || location.pathname.startsWith("/store_backend/coupons") || location.pathname.startsWith("/store_backend/customers") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>🛍️</span>
                  <span className="nav-label">PSK Commerce</span>
                </div>
                <span className={`chevron-icon ${commerceHovered || location.pathname.startsWith("/store_backend/orders") || location.pathname.startsWith("/store_backend/coupons") || location.pathname.startsWith("/store_backend/customers") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (commerceHovered || location.pathname.startsWith("/store_backend/orders") || location.pathname.startsWith("/store_backend/coupons") || location.pathname.startsWith("/store_backend/customers")) ? "380px" : "0px",
                  opacity: (commerceHovered || location.pathname.startsWith("/store_backend/orders") || location.pathname.startsWith("/store_backend/coupons") || location.pathname.startsWith("/store_backend/customers")) ? 1 : 0,
                  marginTop: (commerceHovered || location.pathname.startsWith("/store_backend/orders") || location.pathname.startsWith("/store_backend/coupons") || location.pathname.startsWith("/store_backend/customers")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend"
                  className={`submenu-item ${location.pathname === "/store_backend" ? "active" : ""}`}
                >
                  Home
                </Link>
                <Link
                  to="/store_backend/orders"
                  className={`submenu-item ${location.pathname.startsWith("/store_backend/orders") ? "active" : ""}`}
                  style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
                >
                  <span>Orders</span>
                  {ordersCount > 0 && <span className="submenu-badge">{ordersCount}</span>}
                </Link>
                <Link
                  to="/store_backend/customers"
                  className={`submenu-item ${location.pathname.startsWith("/store_backend/customers") ? "active" : ""}`}
                >
                  Customers
                </Link>
                <Link
                  to="/store_backend/coupons"
                  className={`submenu-item ${location.pathname.startsWith("/store_backend/coupons") ? "active" : ""}`}
                >
                  Coupons
                </Link>
                <Link
                  to="/store_backend/analytics?view=overview"
                  className={`submenu-item ${location.pathname.startsWith("/store_backend/analytics") && (location.search.includes("view=overview") || !location.search.includes("view=")) ? "active" : ""}`}
                >
                  Reports
                </Link>
                <Link
                  to="/store_backend/analytics?view=settings"
                  className={`submenu-item ${location.search.includes("view=settings") && location.pathname.startsWith("/store_backend/analytics") ? "active" : ""}`}
                >
                  Settings
                </Link>
                <Link
                  to="/store_backend/analytics?view=stock"
                  className={`submenu-item ${location.search.includes("view=stock") && location.pathname.startsWith("/store_backend/analytics") ? "active" : ""}`}
                >
                  Status
                </Link>
              </div>
            </div>

            {/* Collapsible Media Menu */}
            <div
              onMouseEnter={() => handleHoverStart("media", setMediaHovered)}
              onMouseLeave={() => handleHoverEnd("media", setMediaHovered)}
            >
              <Link
                to="/store_backend/media"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/media") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>🖼️</span>
                  <span className="nav-label">Media</span>
                </div>
                <span className={`chevron-icon ${mediaHovered || location.pathname.startsWith("/store_backend/media") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (mediaHovered || location.pathname.startsWith("/store_backend/media")) ? "120px" : "0px",
                  opacity: (mediaHovered || location.pathname.startsWith("/store_backend/media")) ? 1 : 0,
                  marginTop: (mediaHovered || location.pathname.startsWith("/store_backend/media")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/media"
                  className={`submenu-item ${(location.pathname === "/store_backend/media" && !location.search.includes("action=upload")) ? "active" : ""}`}
                >
                  Library
                </Link>
                <Link
                  to="/store_backend/media?action=upload"
                  className={`submenu-item ${location.search.includes("action=upload") ? "active" : ""}`}
                >
                  Add Media File
                </Link>
              </div>
            </div>

            {/* Collapsible Posts Menu */}
            <div
              onMouseEnter={() => handleHoverStart("posts", setPostsHovered)}
              onMouseLeave={() => handleHoverEnd("posts", setPostsHovered)}
            >
              <Link
                to="/store_backend/posts?view=all"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/posts") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>📝</span>
                  <span className="nav-label">Posts</span>
                </div>
                <span className={`chevron-icon ${postsHovered || location.pathname.startsWith("/store_backend/posts") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (postsHovered || location.pathname.startsWith("/store_backend/posts")) ? "180px" : "0px",
                  opacity: (postsHovered || location.pathname.startsWith("/store_backend/posts")) ? 1 : 0,
                  marginTop: (postsHovered || location.pathname.startsWith("/store_backend/posts")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/posts?view=all"
                  className={`submenu-item ${(location.pathname === "/store_backend/posts" && (location.search.includes("view=all") || !location.search.includes("view="))) ? "active" : ""}`}
                >
                  All Posts
                </Link>
                <Link
                  to="/store_backend/posts?view=new"
                  className={`submenu-item ${location.search.includes("view=new") ? "active" : ""}`}
                >
                  Add Post
                </Link>
                <Link
                  to="/store_backend/posts?view=categories"
                  className={`submenu-item ${location.search.includes("view=categories") ? "active" : ""}`}
                >
                  Categories
                </Link>
                <Link
                  to="/store_backend/posts?view=tags"
                  className={`submenu-item ${location.search.includes("view=tags") ? "active" : ""}`}
                >
                  Tags
                </Link>
              </div>
            </div>

            {/* Collapsible Products Menu */}
            <div
              onMouseEnter={() => handleHoverStart("products", setProductsHovered)}
              onMouseLeave={() => handleHoverEnd("products", setProductsHovered)}
            >
              <Link
                to="/store_backend/products"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/products") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>📦</span>
                  <span className="nav-label">Products</span>
                </div>
                <span className={`chevron-icon ${productsHovered || location.pathname.startsWith("/store_backend/products") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (productsHovered || location.pathname.startsWith("/store_backend/products")) ? "320px" : "0px",
                  opacity: (productsHovered || location.pathname.startsWith("/store_backend/products")) ? 1 : 0,
                  marginTop: (productsHovered || location.pathname.startsWith("/store_backend/products")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/products"
                  className={`submenu-item ${location.pathname === "/store_backend/products" && !location.search.includes("view=") ? "active" : ""}`}
                >
                  All Products
                </Link>
                <Link
                  to="/store_backend/products?view=new"
                  className={`submenu-item ${location.search.includes("view=new") ? "active" : ""}`}
                >
                  Add new product
                </Link>
                <Link
                  to="/store_backend/products?view=brands"
                  className={`submenu-item ${location.search.includes("view=brands") ? "active" : ""}`}
                >
                  Brands
                </Link>
                <Link
                  to="/store_backend/products?view=categories"
                  className={`submenu-item ${location.search.includes("view=categories") ? "active" : ""}`}
                >
                  Categories
                </Link>
                <Link
                  to="/store_backend/products?view=tags"
                  className={`submenu-item ${location.search.includes("view=tags") ? "active" : ""}`}
                >
                  Tags
                </Link>
                <Link
                  to="/store_backend/products?view=attributes"
                  className={`submenu-item ${location.search.includes("view=attributes") ? "active" : ""}`}
                >
                  Attributes
                </Link>
                <Link
                  to="/store_backend/products?view=reviews"
                  className={`submenu-item ${location.search.includes("view=reviews") ? "active" : ""}`}
                  style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
                >
                  <span>Reviews</span>
                  <span className="submenu-badge">{reviewsCount}</span>
                </Link>
              </div>
            </div>

            {/* Collapsible Analytics Menu */}
            <div
              onMouseEnter={() => handleHoverStart("analytics", setAnalyticsHovered)}
              onMouseLeave={() => handleHoverEnd("analytics", setAnalyticsHovered)}
            >
              <Link
                to="/store_backend/analytics"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/analytics") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>📊</span>
                  <span className="nav-label">Analytics</span>
                </div>
                <span className={`chevron-icon ${analyticsHovered || location.pathname.startsWith("/store_backend/analytics") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (analyticsHovered || location.pathname.startsWith("/store_backend/analytics")) ? "380px" : "0px",
                  opacity: (analyticsHovered || location.pathname.startsWith("/store_backend/analytics")) ? 1 : 0,
                  marginTop: (analyticsHovered || location.pathname.startsWith("/store_backend/analytics")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/analytics"
                  className={`submenu-item ${(location.pathname === "/store_backend/analytics" && (!location.search || location.search.includes("view=overview") || !location.search.includes("view="))) ? "active" : ""}`}
                >
                  Overview
                </Link>
                <Link
                  to="/store_backend/analytics?view=products"
                  className={`submenu-item ${location.search.includes("view=products") ? "active" : ""}`}
                >
                  Products
                </Link>
                <Link
                  to="/store_backend/analytics?view=revenue"
                  className={`submenu-item ${location.search.includes("view=revenue") ? "active" : ""}`}
                >
                  Revenue
                </Link>
                <Link
                  to="/store_backend/analytics?view=orders"
                  className={`submenu-item ${location.search.includes("view=orders") ? "active" : ""}`}
                >
                  Orders
                </Link>
                <Link
                  to="/store_backend/analytics?view=variations"
                  className={`submenu-item ${location.search.includes("view=variations") ? "active" : ""}`}
                >
                  Variations
                </Link>
                <Link
                  to="/store_backend/analytics?view=categories"
                  className={`submenu-item ${location.search.includes("view=categories") ? "active" : ""}`}
                >
                  Categories
                </Link>
                <Link
                  to="/store_backend/analytics?view=coupons"
                  className={`submenu-item ${location.search.includes("view=coupons") ? "active" : ""}`}
                >
                  Coupons
                </Link>
                <Link
                  to="/store_backend/analytics?view=taxes"
                  className={`submenu-item ${location.search.includes("view=taxes") ? "active" : ""}`}
                >
                  Taxes
                </Link>
                <Link
                  to="/store_backend/analytics?view=downloads"
                  className={`submenu-item ${location.search.includes("view=downloads") ? "active" : ""}`}
                >
                  Downloads
                </Link>
                <Link
                  to="/store_backend/analytics?view=stock"
                  className={`submenu-item ${location.search.includes("view=stock") ? "active" : ""}`}
                >
                  Stock
                </Link>
                <Link
                  to="/store_backend/analytics?view=settings"
                  className={`submenu-item ${location.search.includes("view=settings") ? "active" : ""}`}
                >
                  Settings
                </Link>
              </div>
            </div>

            {/* Collapsible Pages Menu */}
            <div
              onMouseEnter={() => handleHoverStart("pages", setPagesHovered)}
              onMouseLeave={() => handleHoverEnd("pages", setPagesHovered)}
            >
              <Link
                to="/store_backend/pages"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/pages") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>📄</span>
                  <span className="nav-label">Pages</span>
                </div>
                <span className={`chevron-icon ${pagesHovered || location.pathname.startsWith("/store_backend/pages") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (pagesHovered || location.pathname.startsWith("/store_backend/pages")) ? "150px" : "0px",
                  opacity: (pagesHovered || location.pathname.startsWith("/store_backend/pages")) ? 1 : 0,
                  marginTop: (pagesHovered || location.pathname.startsWith("/store_backend/pages")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/pages"
                  className={`submenu-item ${(location.pathname === "/store_backend/pages" && (!location.search || location.search.includes("view=all") || !location.search.includes("view="))) ? "active" : ""}`}
                >
                  All Pages
                </Link>
                <Link
                  to="/store_backend/pages?view=new"
                  className={`submenu-item ${location.search.includes("view=new") ? "active" : ""}`}
                >
                  Add Page
                </Link>
              </div>
            </div>

            {/* Comments Menu Item */}
            <Link
              to="/store_backend/comments"
              className={`nav-item ${location.pathname.startsWith("/store_backend/comments") ? "active" : ""}`}
            >
              <span style={{ fontSize: "16px" }}>💬</span>
              <span className="nav-label">Comments</span>
            </Link>

            {/* Collapsible Manuals & Drivers Menu */}
            <div
              onMouseEnter={() => handleHoverStart("downloads", setDownloadsHovered)}
              onMouseLeave={() => handleHoverEnd("downloads", setDownloadsHovered)}
            >
              <Link
                to="/store_backend/downloads"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/downloads") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>📥</span>
                  <span className="nav-label">Manuals & Drivers</span>
                </div>
                <span className={`chevron-icon ${downloadsHovered || location.pathname.startsWith("/store_backend/downloads") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (downloadsHovered || location.pathname.startsWith("/store_backend/downloads")) ? "120px" : "0px",
                  opacity: (downloadsHovered || location.pathname.startsWith("/store_backend/downloads")) ? 1 : 0,
                  marginTop: (downloadsHovered || location.pathname.startsWith("/store_backend/downloads")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/downloads"
                  className={`submenu-item ${(location.pathname === "/store_backend/downloads" && (!location.search || !location.search.includes("view=categories"))) ? "active" : ""}`}
                >
                  All Manuals
                </Link>
                <Link
                  to="/store_backend/downloads?view=categories"
                  className={`submenu-item ${location.search.includes("view=categories") ? "active" : ""}`}
                >
                  Categories
                </Link>
              </div>
            </div>

            {/* Collapsible Users Menu */}
            <div
              onMouseEnter={() => handleHoverStart("users", setUsersHovered)}
              onMouseLeave={() => handleHoverEnd("users", setUsersHovered)}
            >
              <Link
                to="/store_backend/users"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/users") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>👥</span>
                  <span className="nav-label">Users</span>
                </div>
                <span className={`chevron-icon ${usersHovered || location.pathname.startsWith("/store_backend/users") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (usersHovered || location.pathname.startsWith("/store_backend/users")) ? "150px" : "0px",
                  opacity: (usersHovered || location.pathname.startsWith("/store_backend/users")) ? 1 : 0,
                  marginTop: (usersHovered || location.pathname.startsWith("/store_backend/users")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/users"
                  className={`submenu-item ${(location.pathname === "/store_backend/users" && (!location.search || location.search.includes("view=all") || !location.search.includes("view="))) ? "active" : ""}`}
                >
                  All Users
                </Link>
                <Link
                  to="/store_backend/users?view=new"
                  className={`submenu-item ${location.search.includes("view=new") ? "active" : ""}`}
                >
                  Add User
                </Link>
                <Link
                  to="/store_backend/users?view=profile"
                  className={`submenu-item ${location.search.includes("view=profile") ? "active" : ""}`}
                >
                  Profile
                </Link>
              </div>
            </div>


            {/* Collapsible Settings Menu */}
            <div
              onMouseEnter={() => handleHoverStart("settings", setSettingsHovered)}
              onMouseLeave={() => handleHoverEnd("settings", setSettingsHovered)}
            >
              <Link
                to="/store_backend/settings"
                className={`nav-item menu-parent ${location.pathname.startsWith("/store_backend/settings") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>⚙️</span>
                  <span className="nav-label">Settings</span>
                </div>
                <span className={`chevron-icon ${settingsHovered || location.pathname.startsWith("/store_backend/settings") ? "rotated" : ""}`}>▶</span>
              </Link>

              <div
                className="submenu-container"
                style={{
                  maxHeight: (settingsHovered || location.pathname.startsWith("/store_backend/settings")) ? "100px" : "0px",
                  opacity: (settingsHovered || location.pathname.startsWith("/store_backend/settings")) ? 1 : 0,
                  marginTop: (settingsHovered || location.pathname.startsWith("/store_backend/settings")) ? "4px" : "0px",
                }}
              >
                <Link
                  to="/store_backend/settings"
                  className={`submenu-item ${location.pathname === "/store_backend/settings" ? "active" : ""}`}
                >
                  General
                </Link>
              </div>
            </div>


            {/* Collapse Sidebar Button */}
            <button
              onClick={toggleSidebar}
              className="nav-item btn-collapse-sidebar"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "rgba(255, 255, 255, 0.6)"
              }}
            >
              <span className="collapse-icon-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sidebarCollapsed ? (
                    <path d="M9 18l6-6-6-6" />
                  ) : (
                    <path d="M15 18l-6-6 6-6" />
                  )}
                </svg>
              </span>
              <span className="nav-label">Collapse Menu</span>
            </button>

          </nav>
        </div>


      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-title-section">
            <h1>
              {navItems.find((n) => location.pathname === n.path || (n.path !== "/store_backend" && location.pathname.startsWith(n.path)))?.label || "Console"}
            </h1>
          </div>
          <div className="header-meta-section">
            <Link to="/" className="storefront-button" target="_blank" rel="noopener noreferrer">
              <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" className="storefront-btn-logo" style={{ height: "24px", width: "auto" }} />
              <span>Visit Store</span>
              <span className="arrow-icon">↗</span>
            </Link>
            <span>|</span>
            <div className="status-pill">
              <span className="status-dot"></span>
              Secure Connection Active
            </div>
            <span>|</span>
            <span>v2.4.0-prod</span>
            <span>|</span>
            <div className="header-user-menu">
              <div className="header-user-trigger">
                <span>Greetings, {user.name}</span>
                <span className="user-avatar-small">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="header-user-dropdown">
                <div className="dropdown-profile-info">
                  <div className="user-avatar-large">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="dropdown-text-info">
                    <span className="dropdown-user-name">{user.name}</span>
                    <span className="dropdown-user-email">{user.email}</span>
                    <Link to="/store_backend/users?view=profile" className="dropdown-edit-link">
                      Edit Profile
                    </Link>
                    <Link to="/my-account" className="dropdown-edit-link" style={{ color: "#a855f7", marginTop: "4px" }}>
                      Storefront Account
                    </Link>
                  </div>
                </div>
                <div className="dropdown-actions">
                  <Form method="post" className="logout-form-header">
                    <input type="hidden" name="intent" value="logout" />
                    <button type="submit" className="btn-logout-header">
                      🚪 Log Out
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content-viewport">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
