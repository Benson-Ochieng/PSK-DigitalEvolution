import { useState, useMemo } from "react";
import { useLoaderData, useSearchParams, Link } from "react-router";
import { db } from "~/lib/db.server";

interface CustomerItem {
  id: string;
  name: string;
  username: string;
  lastActive: string;
  dateRegistered: string; // "—" if not registered
  email: string;
  ordersCount: number;
  totalSpend: number;
  aov: number;
  country: string;
  city: string;
  region: string;
  postalCode: string;
}

const SEED_CUSTOMERS: CustomerItem[] = [
  {
    id: "c-1",
    name: "MERYL AWINO",
    username: "",
    lastActive: "2026-06-05",
    dateRegistered: "",
    email: "AWINOALUODO@GMAIL.COM",
    ordersCount: 1,
    totalSpend: 10695,
    aov: 10695,
    country: "KE",
    city: "WESTLANDS",
    region: "KE30",
    postalCode: ""
  },
  {
    id: "c-2",
    name: "Grace Njuguna",
    username: "grace.wanjiku",
    lastActive: "2026-06-05",
    dateRegistered: "2025-06-07",
    email: "gnjuguna520@gmail.com",
    ordersCount: 3,
    totalSpend: 34885,
    aov: 11628.33,
    country: "KE",
    city: "KAHAWA WEST",
    region: "KE30",
    postalCode: ""
  },
  {
    id: "c-3",
    name: "Victor Okoth",
    username: "victorokoth893",
    lastActive: "2026-06-05",
    dateRegistered: "2026-05-27",
    email: "victorokoth893@gmail.com",
    ordersCount: 1,
    totalSpend: 17520,
    aov: 17520,
    country: "KE",
    city: "NGANDO",
    region: "KE30",
    postalCode: ""
  },
  {
    id: "c-4",
    name: "Simon Bob",
    username: "symonbob35",
    lastActive: "2026-06-05",
    dateRegistered: "",
    email: "symonbob35@gmail.com",
    ordersCount: 3,
    totalSpend: 2790,
    aov: 930,
    country: "KE",
    city: "RUIRU",
    region: "KE13",
    postalCode: ""
  },
  {
    id: "c-5",
    name: "NELSON ORINA",
    username: "doctornelson5",
    lastActive: "2026-06-05",
    dateRegistered: "2026-06-02",
    email: "doctornelson5@gmail.com",
    ordersCount: 1,
    totalSpend: 8495,
    aov: 8495,
    country: "KE",
    city: "SECTION 58,KABACHIA",
    region: "KE31",
    postalCode: ""
  },
  {
    id: "c-6",
    name: "",
    username: "faiarsilviu",
    lastActive: "2026-06-05",
    dateRegistered: "2026-06-05",
    email: "faiarsilviu@gmail.com",
    ordersCount: 0,
    totalSpend: 0,
    aov: 0,
    country: "",
    city: "",
    region: "",
    postalCode: ""
  },
  {
    id: "c-7",
    name: "Dereck Obote",
    username: "dereck.obote",
    lastActive: "2026-06-04",
    dateRegistered: "2026-05-31",
    email: "obotedereck@gmail.com",
    ordersCount: 2,
    totalSpend: 77990,
    aov: 38995,
    country: "KE",
    city: "UMOJA II",
    region: "KE30",
    postalCode: ""
  },
  {
    id: "c-8",
    name: "Hardeep S Sokhi",
    username: "",
    lastActive: "2026-06-04",
    dateRegistered: "",
    email: "hardeepssokhi@gmail.com",
    ordersCount: 1,
    totalSpend: 20995,
    aov: 20995,
    country: "KE",
    city: "SPRING VALLEY",
    region: "KE30",
    postalCode: ""
  },
  {
    id: "c-9",
    name: "",
    username: "christopherjackson509fc17",
    lastActive: "2026-06-04",
    dateRegistered: "2026-06-04",
    email: "christopherjackson509fc17@gsasearchenginerankervps.com",
    ordersCount: 0,
    totalSpend: 0,
    aov: 0,
    country: "",
    city: "",
    region: "",
    postalCode: ""
  },
  {
    id: "c-10",
    name: "Mary Kinyanjui",
    username: "",
    lastActive: "2026-06-04",
    dateRegistered: "",
    email: "kinyanjui816@gmail.com",
    ordersCount: 1,
    totalSpend: 10695,
    aov: 10695,
    country: "KE",
    city: "JUJA",
    region: "KE30",
    postalCode: ""
  },
  {
    id: "c-11",
    name: "",
    username: "m.e.l.i.s.s.a.1.29.0.09",
    lastActive: "2026-06-04",
    dateRegistered: "2026-06-04",
    email: "m.e.l.i.s.s.a.1.29.0.09@gmail.com",
    ordersCount: 0,
    totalSpend: 0,
    aov: 0,
    country: "",
    city: "",
    region: "",
    postalCode: ""
  },
  {
    id: "c-12",
    name: "",
    username: "randymwale",
    lastActive: "2025-09-19",
    dateRegistered: "2025-09-19",
    email: "randymwale@gmail.com",
    ordersCount: 1,
    totalSpend: 55490,
    aov: 55490,
    country: "KE",
    city: "KINOO",
    region: "KE30",
    postalCode: ""
  },
  {
    id: "c-13",
    name: "PATRICK KIPNGETICH RONO RONO",
    username: "patrick kipngetich rono.rono",
    lastActive: "2026-06-04",
    dateRegistered: "",
    email: "kipngetichpatrick10@gmail.com",
    ordersCount: 1,
    totalSpend: 13995,
    aov: 13995,
    country: "KE",
    city: "ATHI RIVER",
    region: "KE30",
    postalCode: ""
  }
];

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  await requireAdminUser(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const filter = url.searchParams.get("filter") || "all";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("perPage") || "20", 10);
  const sortKey = (url.searchParams.get("sortKey") || "lastActive") as keyof CustomerItem;
  const sortDir = (url.searchParams.get("sortDir") || "desc") as "asc" | "desc";
  const isDownload = url.searchParams.get("download") === "csv";

  // Fetch database orders and users for server-side aggregation
  const orders = await db.order.findMany();
  const users = await db.user.findMany();

  // Aggregate customer dataset on the server
  const customerMap = new Map<string, CustomerItem>();
  SEED_CUSTOMERS.forEach(c => customerMap.set(c.email.toLowerCase(), { ...c }));

  users.forEach((u: any) => {
    if (u.role === "customer" && u.email) {
      const emailLower = u.email.toLowerCase();
      if (customerMap.has(emailLower)) {
        const existing = customerMap.get(emailLower)!;
        existing.username = u.username || existing.username;
        existing.name = u.name || existing.name;
        if (u.createdAt) existing.dateRegistered = u.createdAt;
      } else {
        customerMap.set(emailLower, {
          id: `db-${u.id}`,
          name: u.name || "",
          username: u.username || "",
          lastActive: u.createdAt || new Date().toISOString().split("T")[0],
          dateRegistered: u.createdAt || new Date().toISOString().split("T")[0],
          email: u.email,
          ordersCount: 0,
          totalSpend: 0,
          aov: 0,
          country: "KE",
          city: "Nairobi",
          region: "KE30",
          postalCode: ""
        });
      }
    }
  });

  orders.forEach((o: any) => {
    if (o.billing && o.billing.email) {
      const emailLower = o.billing.email.toLowerCase();
      if (customerMap.has(emailLower)) {
        const customer = customerMap.get(emailLower)!;
        customer.ordersCount += 1;
        customer.totalSpend += (o.total || 0);
        customer.aov = customer.ordersCount > 0 ? customer.totalSpend / customer.ordersCount : 0;

        const orderDateParsed = o.date ? new Date(o.date) : null;
        const orderTime = orderDateParsed && !isNaN(orderDateParsed.getTime()) ? orderDateParsed.getTime() : 0;

        let lastActiveTime = 0;
        if (customer.lastActive) {
          const parsed = new Date(customer.lastActive);
          if (!isNaN(parsed.getTime())) lastActiveTime = parsed.getTime();
        }

        if (orderTime > lastActiveTime && o.date) {
          customer.lastActive = o.date;
        }

        if (o.billing.city && !customer.city) {
          customer.city = o.billing.city.toUpperCase();
        }
        if (o.billing.name && !customer.name) {
          customer.name = o.billing.name.toUpperCase();
        }
      } else {
        const total = o.total || 0;
        const orderDateStr = o.date || new Date().toISOString().split("T")[0];
        customerMap.set(emailLower, {
          id: `ord-${o.id}`,
          name: o.billing.name ? o.billing.name.toUpperCase() : "",
          username: "",
          lastActive: orderDateStr,
          dateRegistered: "",
          email: o.billing.email,
          ordersCount: 1,
          totalSpend: total,
          aov: total,
          country: "KE",
          city: o.billing.city ? o.billing.city.toUpperCase() : "NAIROBI",
          region: "KE30",
          postalCode: ""
        });
      }
    }
  });

  let allCustomers = Array.from(customerMap.values());

  // Filter
  if (filter === "active") {
    allCustomers = allCustomers.filter(c => c.ordersCount > 0);
  } else if (filter === "registered") {
    allCustomers = allCustomers.filter(c => Boolean(c.dateRegistered));
  }

  if (search) {
    const term = search.toLowerCase();
    allCustomers = allCustomers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.username.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  }

  // Sort
  allCustomers.sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];

    if (typeof valA === "number" && typeof valB === "number") {
      return sortDir === "asc" ? valA - valB : valB - valA;
    }

    const strA = String(valA || "").toLowerCase();
    const strB = String(valB || "").toLowerCase();
    return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });



  const totalCustomersCount = allCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomersCount / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const paginatedCustomers = allCustomers.slice(start, start + perPage);

  return {
    customers: paginatedCustomers,
    totalCustomersCount,
    page: safePage,
    perPage,
    totalPages,
    search,
    filter,
    sortKey,
    sortDir,
  };
}

export default function VpBackendCustomers() {
  const {
    customers,
    totalCustomersCount,
    page: currentPage,
    perPage: itemsPerPage,
    totalPages,
    search: searchFromLoader,
    filter: filterFromLoader,
    sortKey,
    sortDir
  } = useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();

  // Local UI state for search input text
  const [searchInputText, setSearchInputText] = useState(searchFromLoader);

  // Alert banner state
  const [showAlert, setShowAlert] = useState(true);

  // Screen Options state (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(itemsPerPage);

  // Columns visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    username: true,
    lastActive: true,
    dateRegistered: true,
    email: true,
    orders: true,
    totalSpend: true,
    aov: true,
    country: true,
    city: true,
    region: true,
    postalCode: true
  });

  const updateParam = (updates: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  };

  const handleSort = (key: keyof CustomerItem) => {
    const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : (key === "lastActive" || key === "ordersCount" || key === "totalSpend" || key === "aov" ? "desc" : "asc");
    updateParam({ sortKey: key, sortDir: nextDir, page: 1 });
  };

  const renderSortIndicator = (key: keyof CustomerItem) => {
    if (sortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  const formatKsh = (num: number) => {
    return "KSh " + num.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleDownloadCSV = () => {
    const currentUrl = new URL(window.location.href);
    const exportUrl = new URL("/api/export-customers", window.location.origin);
    currentUrl.searchParams.forEach((val, key) => {
      if (key !== "page" && key !== "perPage") {
        exportUrl.searchParams.set(key, val);
      }
    });
    window.location.href = exportUrl.toString();
  };

  return (
    <div className="customers-view" style={{ position: "relative" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .customers-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 16px;
        }

        .customers-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .customers-activity-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .customers-activity-link:hover {
          color: #00ccff;
        }

        /* Screen Options styling (WordPress standard) */
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
          right: 40px;
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
          max-height: 600px;
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
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
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

        .customers-alert {
          background: rgba(0, 204, 255, 0.05);
          border: 1px solid rgba(0, 204, 255, 0.2);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .customers-alert-content {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .customers-alert-link {
          color: #00ccff;
          text-decoration: underline;
          font-weight: 500;
        }

        .customers-alert-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        .customers-alert-close:hover {
          color: #fff;
        }

        .customers-controls-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .show-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin-right: 12px;
        }

        .controls-row-layout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .controls-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 280px;
        }

        .customers-search-wrapper {
          position: relative;
          width: 100%;
          max-width: 450px;
        }

        .customers-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.35);
          font-size: 14px;
        }

        .customers-search-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px 12px 8px 36px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .customers-search-input:focus {
          border-color: #00ccff;
        }

        .customers-action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .customers-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .customers-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .customer-link {
          color: #00ccff;
          text-decoration: none;
        }

        .customer-link:hover {
          text-decoration: underline;
        }
      ` }} />

      {/* Screen Options Drawer (WordPress standard) */}
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
        <div className={`screen-options-drawer ${showOptions ? "open" : ""}`}>
          <div className="screen-options-title">Columns</div>
          <div className="checkbox-group-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.name}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, name: e.target.checked })}
              />
              Name
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.username}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, username: e.target.checked })}
              />
              Username
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.lastActive}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, lastActive: e.target.checked })}
              />
              Last Active
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.dateRegistered}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, dateRegistered: e.target.checked })}
              />
              Date Registered
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.email}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, email: e.target.checked })}
              />
              Email
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.orders}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, orders: e.target.checked })}
              />
              Orders
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.totalSpend}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, totalSpend: e.target.checked })}
              />
              Total Spend
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.aov}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, aov: e.target.checked })}
              />
              AOV
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.country}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, country: e.target.checked })}
              />
              Country / Region
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.city}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, city: e.target.checked })}
              />
              City
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.region}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, region: e.target.checked })}
              />
              Region
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visibleColumns.postalCode}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, postalCode: e.target.checked })}
              />
              Postal Code
            </label>
          </div>

          <div className="screen-options-title" style={{ marginTop: "24px" }}>Pagination</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>Number of items per page:</span>
            <input
              type="number"
              className="admin-input"
              style={{ width: "80px", background: "rgba(0,0,0,0.3)", padding: "6px 10px", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px" }}
              value={tempItemsPerPage}
              min={1}
              max={100}
              onChange={(e) => setTempItemsPerPage(Math.max(1, Number(e.target.value)))}
            />
            <button
              className="customers-action-btn"
              style={{ padding: "6px 16px", fontSize: "12px", background: "#00ccff", color: "#000", fontWeight: "bold" }}
              onClick={() => {
                updateParam({ perPage: tempItemsPerPage, page: 1 });
                setShowOptions(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Header Title Row */}
      <div className="customers-header-row">
        <h1 className="customers-title">
          <span>👥</span> Customers
        </h1>
        <Link to="/store_backend/history" className="customers-activity-link">
          <span>🔔</span> Activity
        </Link>
      </div>

      {showAlert && (
        <div className="customers-alert">
          <div className="customers-alert-content">
            Analytics now supports scheduled updates, providing improved performance. Enable it in{" "}
            <Link to="/store_backend/analytics?view=settings" className="customers-alert-link">
              Settings
            </Link>
            .
          </div>
          <button className="customers-alert-close" onClick={() => setShowAlert(false)}>
            ×
          </button>
        </div>
      )}

      {/* Filter and controls toolbar */}
      <div className="customers-controls-card">
        <div style={{ marginBottom: "16px" }}>
          <span className="show-label">Show:</span>
          <select
            className="admin-select"
            style={{ width: "auto", minWidth: "220px", background: "rgba(0,0,0,0.3)", height: "36px", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0 10px" }}
            value={filterFromLoader}
            onChange={(e) => updateParam({ filter: e.target.value, page: 1 })}
          >
            <option value="all">All Customers</option>
            <option value="active">Active Customers (with orders)</option>
            <option value="registered">Registered Members</option>
          </select>
        </div>

        <div className="controls-row-layout">
          <div className="controls-left-group">
            <div className="customers-search-wrapper">
              <span className="customers-search-icon">🔍</span>
              <input
                type="text"
                className="customers-search-input"
                placeholder="Search customers by name, username, email or location..."
                value={searchInputText}
                onChange={(e) => setSearchInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateParam({ search: searchInputText, page: 1 });
                  }
                }}
                onBlur={() => {
                  if (searchInputText !== searchFromLoader) {
                    updateParam({ search: searchInputText, page: 1 });
                  }
                }}
              />
            </div>
            {searchFromLoader && (
              <button
                className="customers-action-btn"
                onClick={() => {
                  setSearchInputText("");
                  updateParam({ search: null, page: 1 });
                }}
                style={{ fontSize: "12px", padding: "6px 10px" }}
              >
                Clear Search
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="customers-action-btn"
              onClick={handleDownloadCSV}
              title="Export list to CSV"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Customers List Table Card */}
      <div className="customers-table-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.7)" }}>
            Showing {totalCustomersCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalCustomersCount)} of {totalCustomersCount} customer{totalCustomersCount === 1 ? "" : "s"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTempItemsPerPage(val);
                updateParam({ perPage: val, page: 1 });
              }}
              style={{ background: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "4px 8px", color: "#fff", fontSize: "12px" }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                {visibleColumns.name && (
                  <th onClick={() => handleSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Name {renderSortIndicator("name")}
                  </th>
                )}
                {visibleColumns.username && (
                  <th onClick={() => handleSort("username")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Username {renderSortIndicator("username")}
                  </th>
                )}
                {visibleColumns.lastActive && (
                  <th onClick={() => handleSort("lastActive")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Last Active {renderSortIndicator("lastActive")}
                  </th>
                )}
                {visibleColumns.dateRegistered && (
                  <th onClick={() => handleSort("dateRegistered")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Date Registered {renderSortIndicator("dateRegistered")}
                  </th>
                )}
                {visibleColumns.email && (
                  <th onClick={() => handleSort("email")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Email {renderSortIndicator("email")}
                  </th>
                )}
                {visibleColumns.orders && (
                  <th
                    onClick={() => handleSort("ordersCount")}
                    style={{ cursor: "pointer", userSelect: "none", textAlign: "right" }}
                  >
                    Orders {renderSortIndicator("ordersCount")}
                  </th>
                )}
                {visibleColumns.totalSpend && (
                  <th
                    onClick={() => handleSort("totalSpend")}
                    style={{ cursor: "pointer", userSelect: "none", textAlign: "right" }}
                  >
                    Total Spend {renderSortIndicator("totalSpend")}
                  </th>
                )}
                {visibleColumns.aov && (
                  <th
                    onClick={() => handleSort("aov")}
                    style={{ cursor: "pointer", userSelect: "none", textAlign: "right" }}
                  >
                    AOV {renderSortIndicator("aov")}
                  </th>
                )}
                {visibleColumns.country && (
                  <th onClick={() => handleSort("country")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Country / Region {renderSortIndicator("country")}
                  </th>
                )}
                {visibleColumns.city && (
                  <th onClick={() => handleSort("city")} style={{ cursor: "pointer", userSelect: "none" }}>
                    City {renderSortIndicator("city")}
                  </th>
                )}
                {visibleColumns.region && (
                  <th onClick={() => handleSort("region")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Region {renderSortIndicator("region")}
                  </th>
                )}
                {visibleColumns.postalCode && (
                  <th onClick={() => handleSort("postalCode")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Postal Code {renderSortIndicator("postalCode")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={Object.values(visibleColumns).filter(Boolean).length}
                    style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.4)" }}
                  >
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    {visibleColumns.name && (
                      <td style={{ fontWeight: "600", color: "#fff", textTransform: "capitalize" }}>
                        {customer.name ? (
                          <span className="customer-link" style={{ cursor: "default" }}>{customer.name}</span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.username && (
                      <td>
                        {customer.username ? (
                          <span style={{ color: "rgba(255,255,255,0.7)" }}>{customer.username}</span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.lastActive && (
                      <td style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        {formatDate(customer.lastActive)}
                      </td>
                    )}
                    {visibleColumns.dateRegistered && (
                      <td style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        {formatDate(customer.dateRegistered)}
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td>
                        <a
                          href={`mailto:${customer.email}`}
                          className="customer-link"
                          style={{ fontSize: "12px", fontFamily: "monospace" }}
                        >
                          {customer.email.toLowerCase()}
                        </a>
                      </td>
                    )}
                    {visibleColumns.orders && (
                      <td style={{ textAlign: "right", fontWeight: "600", color: "#00ccff" }}>
                        {customer.ordersCount}
                      </td>
                    )}
                    {visibleColumns.totalSpend && (
                      <td style={{ textAlign: "right", fontWeight: "600", color: "#2ed573" }}>
                        {formatKsh(customer.totalSpend)}
                      </td>
                    )}
                    {visibleColumns.aov && (
                      <td style={{ textAlign: "right", fontWeight: "500", color: "#ffa502" }}>
                        {formatKsh(customer.aov)}
                      </td>
                    )}
                    {visibleColumns.country && (
                      <td style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        {customer.country || <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}
                      </td>
                    )}
                    {visibleColumns.city && (
                      <td style={{ textTransform: "capitalize", color: "rgba(255, 255, 255, 0.85)" }}>
                        {customer.city ? customer.city.toLowerCase() : <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}
                      </td>
                    )}
                    {visibleColumns.region && (
                      <td style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        {customer.region || <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}
                      </td>
                    )}
                    {visibleColumns.postalCode && (
                      <td style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        {customer.postalCode || <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar Footer */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", flexWrap: "wrap", gap: "16px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              Page {currentPage} of {totalPages} ({totalCustomersCount} total customer{totalCustomersCount === 1 ? "" : "s"})
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => updateParam({ page: 1 })}
                className="customers-action-btn"
                style={{ padding: "4px 8px", fontSize: "12px", opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                title="First Page"
              >
                «
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => updateParam({ page: Math.max(1, currentPage - 1) })}
                className="customers-action-btn"
                style={{ padding: "4px 10px", fontSize: "12px", opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              >
                ◀ Prev
              </button>

              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", padding: "0 8px" }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => updateParam({ page: Math.min(totalPages, currentPage + 1) })}
                className="customers-action-btn"
                style={{ padding: "4px 10px", fontSize: "12px", opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              >
                Next ▶
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => updateParam({ page: totalPages })}
                className="customers-action-btn"
                style={{ padding: "4px 8px", fontSize: "12px", opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
