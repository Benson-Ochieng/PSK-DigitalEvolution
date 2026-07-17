import { data, redirect, Outlet, NavLink, Form, useLoaderData } from "react-router";
import type { Route } from "./+types/admin";
import { checkAdminBranch } from "../lib/sessions.server";
import "../admin.css";

export async function loader({ request }: Route.LoaderArgs) {
  checkAdminBranch();
  
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/admin/, "");
  return redirect(`/store_backend${subpath}`);
}

export async function action({ request }: Route.ActionArgs) {
  return redirect("/store_backend");
}

export default function AdminLayout() {
  useLoaderData<typeof loader>();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <NavLink to="/admin" className="admin-sidebar-logo" end>
            PET FOOD <span>BAG.</span>
          </NavLink>
          <span className="admin-sidebar-badge">Control Panel</span>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="admin-sidebar-menu">
            <li className="admin-sidebar-item">
              <NavLink to="/admin" end className={({ isActive }) => isActive ? "active" : ""}>
                📊 Overview
              </NavLink>
            </li>
            <li className="admin-sidebar-item">
              <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "active" : ""}>
                📦 Orders
              </NavLink>
            </li>
            <li className="admin-sidebar-item">
              <NavLink to="/admin/products" className={({ isActive }) => isActive ? "active" : ""}>
                🛒 Products
              </NavLink>
            </li>
            <li className="admin-sidebar-item">
              <NavLink to="/admin/prices" className={({ isActive }) => isActive ? "active" : ""}>
                🏷 Price Intel
              </NavLink>
            </li>
            <li className="admin-sidebar-item">
              <NavLink to="/admin/blogs" className={({ isActive }) => isActive ? "active" : ""}>
                📝 Blog Posts
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <Form method="post">
            <input type="hidden" name="intent" value="logout" />
            <button type="submit" className="logout-btn">
              🚪 Logout Admin
            </button>
          </Form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--admin-text-muted)" }}>SERVER STATUS:</span>
            <span className="status-pill delivered" style={{ fontSize: "0.55rem" }}>ONLINE</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
