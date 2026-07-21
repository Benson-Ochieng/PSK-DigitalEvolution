import { useState, useMemo } from "react";
import { useLoaderData, useSearchParams, Link } from "react-router";
import { db } from "~/lib/db.server";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  await requireAdminUser(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  // Get orders to dynamically aggregate customer spends if any
  const orders = await db.order.findMany();
  const users = await db.user.findMany();

  return { orders, users, search };
}

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

export default function VpBackendCustomers() {
  const { orders, users, search: loaderSearch } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  // Alert banner state
  const [showAlert, setShowAlert] = useState(true);

  // Show Filter Dropdown
  const [showFilter, setShowFilter] = useState("all");

  // Screen Options state (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Initial seed list from WooCommerce customers screenshot
  const seedCustomers: CustomerItem[] = useMemo(() => [
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
      lastActive: "2026-06-04",
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
  ], []);

  // Compute final customers list dynamically by merging database orders and user accounts
  const finalCustomers = useMemo(() => {
    // Start with seed list
    const customerMap = new Map<string, CustomerItem>();
    seedCustomers.forEach(c => customerMap.set(c.email.toLowerCase(), { ...c }));

    // Merge registered database customers
    users.forEach((u: any) => {
      if (u.role === "customer" && u.email) {
        const emailLower = u.email.toLowerCase();
        if (customerMap.has(emailLower)) {
          const existing = customerMap.get(emailLower)!;
          existing.username = u.username || existing.username;
          existing.name = u.name || existing.name;
          if (u.createdAt) {
            existing.dateRegistered = u.createdAt;
          }
        } else {
          customerMap.set(emailLower, {
            id: `db-${u.id}`,
            name: u.name || "",
            username: u.username || "",
            lastActive: u.createdAt || new Date().toISOString().split("T")[0],
            dateRegistered: u.createdAt || new Date().toISOString().split("T")[0],
            email: u.email,
            ordersCount: u.ordersCount || 0,
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

    // Extract stats dynamically from live database orders
    orders.forEach((o: any) => {
      if (o.billing && o.billing.email) {
        const emailLower = o.billing.email.toLowerCase();
        if (customerMap.has(emailLower)) {
          const customer = customerMap.get(emailLower)!;
          customer.ordersCount += 1;
          customer.totalSpend += o.total;
          customer.aov = customer.ordersCount > 0 ? customer.totalSpend / customer.ordersCount : 0;

          // Robust date parsing and comparison
          const orderDateParsed = o.date ? new Date(o.date) : null;
          const orderTime = orderDateParsed && !isNaN(orderDateParsed.getTime()) ? orderDateParsed.getTime() : 0;

          let lastActiveTime = 0;
          if (customer.lastActive) {
            const parsed = new Date(customer.lastActive);
            if (!isNaN(parsed.getTime())) {
              lastActiveTime = parsed.getTime();
            }
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
          // New customer from order
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

    return Array.from(customerMap.values());
  }, [seedCustomers, orders, users]);

  // Search and Filter logic
  const filteredCustomers = useMemo(() => {
    return finalCustomers.filter(c => {
      // Dropdown filter: all, active, registered
      if (showFilter === "active" && c.ordersCount === 0) return false;
      if (showFilter === "registered" && !c.dateRegistered) return false;

      // Text search
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.username.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term)
      );
    });
  }, [finalCustomers, search, showFilter]);

  // Sorting
  const [sortKey, setSortKey] = useState<keyof CustomerItem>("lastActive");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA || "").toLowerCase();
      const strB = String(valB || "").toLowerCase();
      return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredCustomers, sortKey, sortDirection]);

  // Pagination slicing
  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedCustomers.length / itemsPerPage)), [sortedCustomers.length, itemsPerPage]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedCustomers.slice(start, start + itemsPerPage);
  }, [sortedCustomers, currentPage, itemsPerPage]);

  const handleSort = (key: keyof CustomerItem) => {
    setCurrentPage(1);
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "lastActive" || key === "ordersCount" || key === "totalSpend" || key === "aov" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (key: keyof CustomerItem) => {
    if (sortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  // Format currencies
  const formatKsh = (num: number) => {
    return "KSh " + num.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Date formatter
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // CSV Export utility
  const handleDownloadCSV = () => {
    const headers = ["Name", "Username", "Last Active", "Date Registered", "Email", "Orders", "Total Spend", "AOV", "Country/Region", "City", "Region", "Postal Code"];
    const rows = sortedCustomers.map(c => [
      c.name,
      c.username,
      c.lastActive,
      c.dateRegistered || "—",
      c.email,
      c.ordersCount,
      c.totalSpend,
      c.aov,
      c.country || "—",
      c.city || "—",
      c.region || "—",
      c.postalCode || "—"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set("search", val);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
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
          transition: max-height 0.35s ease, padding 0.35s ease;
        }

        .screen-options-drawer.open {
          max-height: 300px;
          padding: 24px 40px;
        }

        .screen-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .checkbox-label-admin {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
        }

        .checkbox-label-admin input {
          width: 14px;
          height: 14px;
          cursor: pointer;
        }

        /* Banner alert styles */
        .customers-alert {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-left: 4px solid #00ccff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: slideIn 0.3s ease;
        }

        .customers-alert-content {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
        }

        .customers-alert-link {
          color: #00ccff;
          text-decoration: underline;
          cursor: pointer;
        }

        .customers-alert-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 18px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .customers-alert-close:hover {
          color: #fff;
        }

        /* Search and controls block */
        .customers-controls-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .show-label {
          font-size: 11px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
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
          flex-grow: 1;
          max-width: 600px;
        }

        .customers-search-wrapper {
          position: relative;
          flex-grow: 1;
          display: flex;
          align-items: center;
        }

        .customers-search-icon {
          position: absolute;
          left: 12px;
          color: rgba(255, 255, 255, 0.35);
          font-size: 14px;
        }

        .customers-search-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 8px 12px 8px 36px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: all 0.3s ease;
        }

        .customers-search-input:focus {
          border-color: #00ccff;
          box-shadow: 0 0 8px rgba(0, 204, 255, 0.15);
        }

        .customers-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .customers-action-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* Table Card Container */
        .customers-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          box-shadow: 0 4px 25px rgba(0,0,0,0.25);
          padding: 24px;
        }

        .customer-link {
          color: #00ccff;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .customer-link:hover {
          text-decoration: underline;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />

      {/* Screen Options Drawer */}
      <div className="screen-options-container">
        <div className="screen-options-wrapper">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="screen-options-toggle-btn"
          >
            Screen Options {showOptions ? "▲" : "▼"}
          </button>
        </div>

        <div className={`screen-options-drawer ${showOptions ? "open" : ""}`}>
          <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>
            Columns Visibility
          </h4>
          <div className="screen-options-grid">
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.name}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, name: e.target.checked }))}
              />
              Name
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.username}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, username: e.target.checked }))}
              />
              Username
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.lastActive}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, lastActive: e.target.checked }))}
              />
              Last Active
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.dateRegistered}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, dateRegistered: e.target.checked }))}
              />
              Date Registered
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.email}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, email: e.target.checked }))}
              />
              Email
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.orders}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, orders: e.target.checked }))}
              />
              Orders
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.totalSpend}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, totalSpend: e.target.checked }))}
              />
              Total Spend
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.aov}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, aov: e.target.checked }))}
              />
              AOV
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.country}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, country: e.target.checked }))}
              />
              Country / Region
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.city}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, city: e.target.checked }))}
              />
              City
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.region}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, region: e.target.checked }))}
              />
              Region
            </label>
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={visibleColumns.postalCode}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, postalCode: e.target.checked }))}
              />
              Postal Code
            </label>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Pagination Limit:</span>
            <input
              type="number"
              min="1"
              max="500"
              value={tempItemsPerPage}
              onChange={(e) => setTempItemsPerPage(Number(e.target.value))}
              style={{ width: "70px", background: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "4px 8px", color: "#fff", fontSize: "12px" }}
            />
            <button
              type="button"
              onClick={() => {
                const val = Math.max(1, tempItemsPerPage);
                setItemsPerPage(val);
                setCurrentPage(1);
                setShowOptions(false);
              }}
              className="customers-action-btn"
              style={{ padding: "4px 12px", fontSize: "12px", background: "#7c3aed", borderColor: "#7c3aed" }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

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
            style={{ width: "auto", minWidth: "220px", background: "rgba(0,0,0,0.3)", height: "36px" }}
            value={showFilter}
            onChange={(e) => {
              setShowFilter(e.target.value);
              setCurrentPage(1);
            }}
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
                value={search}
                onChange={handleSearchChange}
              />
            </div>
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
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Customers List Table Card */}
      <div className="customers-table-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.7)" }}>
            Showing {sortedCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, sortedCustomers.length)} of {sortedCustomers.length} customer{sortedCustomers.length === 1 ? "" : "s"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                setItemsPerPage(val);
                setTempItemsPerPage(val);
                setCurrentPage(1);
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
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={Object.values(visibleColumns).filter(Boolean).length}
                    style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.4)" }}
                  >
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
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
              Page {currentPage} of {totalPages} ({sortedCustomers.length} total customers)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="customers-action-btn"
                style={{ padding: "4px 8px", fontSize: "12px", opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                title="First Page"
              >
                «
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="customers-action-btn"
                style={{ padding: "4px 10px", fontSize: "12px", opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              >
                Next ▶
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
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
