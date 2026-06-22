import { useState, useEffect } from "react";
import { Form, useLoaderData, useNavigation, useSearchParams } from "react-router";
import { db } from "~/lib/db.server";
import type { Order, OrderStatus } from "~/lib/db.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const statusFilter = url.searchParams.get("status") || "";

  const allOrders = await db.order.findMany();

  // Robust sort: newest first by date, with numeric ID tiebreaker for equal dates
  const sortNewestFirst = (a: Order, b: Order) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (diff !== 0) return diff;
    // Tiebreaker: higher numeric ID = newer order
    const aNum = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
    const bNum = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
    return bNum - aNum;
  };

  allOrders.sort(sortNewestFirst);
  let orders = [...allOrders];

  if (search) {
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.billing.name.toLowerCase().includes(search.toLowerCase()) ||
        o.billing.phone.includes(search)
    );
  }

  if (statusFilter) {
    orders = orders.filter((o) => o.status === statusFilter);
  } else {
    orders = orders.filter((o) => o.status !== "TRASH");
  }

  // Sort newest first (with tiebreaker)
  orders.sort(sortNewestFirst);

  return { orders, allOrders, search, statusFilter };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "update_order") {
    const id = formData.get("id")?.toString();
    const status = formData.get("status")?.toString() as OrderStatus;
    const trackingNumber = formData.get("trackingNumber")?.toString().trim() || "";

    if (!id || !status) return null;

    const { updateOrderSafely, decrementOrderStockIfNeeded } = await import("~/lib/content.server");
    const updated = await updateOrderSafely(id, {
      status,
      paymentGatewayData: {
        trackingNumber,
      },
    });

    const successStatuses = ["COMPLETED", "PROCESSING", "PAID", "CONFIRMED", "SHIPPED"];
    if (successStatuses.includes(status)) {
      try {
        await decrementOrderStockIfNeeded(updated);
      } catch (err) {
        console.error("Error decrementing stock on order status update:", err);
      }
    }

    return { success: true };
  }

  if (intent === "bulk_action") {
    const actionType = formData.get("actionType")?.toString();
    const idsString = formData.get("ids")?.toString();
    if (!actionType || !idsString) return null;
    const ids = idsString.split(",");

    const { updateOrderSafely, decrementOrderStockIfNeeded } = await import("~/lib/content.server");

    for (const id of ids) {
      const existing = await db.order.findUnique({ where: { id } });
      if (!existing) continue;

      if (actionType === "trash") {
        await updateOrderSafely(id, { status: "TRASH" });
      } else if (actionType === "restore") {
        const updated = await updateOrderSafely(id, { status: "PROCESSING" });
        try {
          await decrementOrderStockIfNeeded(updated);
        } catch (err) {
          console.error("Error decrementing stock on order restore:", err);
        }
      } else if (actionType === "delete_permanently") {
        await db.order.delete({ where: { id } });
      } else if (actionType === "mark_exported" || actionType === "unmark_exported") {
        const exported = actionType === "mark_exported";
        await updateOrderSafely(id, {
          paymentGatewayData: {
            exported
          }
        });
      } else if (actionType.startsWith("status_")) {
        const status = actionType.substring("status_".length).toUpperCase() as OrderStatus;
        const updated = await updateOrderSafely(id, { status });
        const successStatuses = ["COMPLETED", "PROCESSING", "PAID", "CONFIRMED", "SHIPPED"];
        if (successStatuses.includes(status)) {
          try {
            await decrementOrderStockIfNeeded(updated);
          } catch (err) {
            console.error("Error decrementing stock on bulk status update:", err);
          }
        }
      }
    }
    return { success: true };
  }

  return null;
}

export default function VpBackendOrders() {
  const { orders, allOrders, search, statusFilter } = useLoaderData() as any;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isUpdating = navigation.state === "submitting";

  // Selection & bulk action states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Filter dropdown states
  const [tempMonth, setTempMonth] = useState("");
  const [tempChannel, setTempChannel] = useState("");
  const [tempCustomer, setTempCustomer] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  // Search input state
  const [searchText, setSearchText] = useState(search);

  // Sync search input state with loader param
  useEffect(() => {
    setSearchText(search);
  }, [search]);

  // Modal active order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sorting states
  const [sortKey, setSortKey] = useState<"id" | "date" | "total" | "status">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Screen Options States (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [showOrderIdColumn, setShowOrderIdColumn] = useState(true);
  const [showChannelColumn, setShowChannelColumn] = useState(true);
  const [showDateColumn, setShowDateColumn] = useState(true);
  const [showStatusColumn, setShowStatusColumn] = useState(true);
  const [showUpdateColumn, setShowUpdateColumn] = useState(true);
  const [showBillingColumn, setShowBillingColumn] = useState(true);
  const [showShipToColumn, setShowShipToColumn] = useState(true);
  const [showTotalColumn, setShowTotalColumn] = useState(true);
  const [showExportStatusColumn, setShowExportStatusColumn] = useState(true);
  const [showActionsColumn, setShowActionsColumn] = useState(true);
  const [showOriginColumn, setShowOriginColumn] = useState(true);
  const [showInvoiceColumn, setShowInvoiceColumn] = useState(true);
  const [showPackingSlipColumn, setShowPackingSlipColumn] = useState(true);

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page index & selection on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, statusFilter, selectedMonth, selectedChannel, selectedCustomer]);

  const handleSort = (key: "id" | "date" | "total" | "status") => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "date" || key === "total" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (key: "id" | "date" | "total" | "status") => {
    if (sortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  const sortedOrders = [...orders].sort((a: any, b: any) => {
    let result = 0;
    if (sortKey === "id") {
      result = (a.id || "").localeCompare(b.id || "");
    } else if (sortKey === "date") {
      result = new Date(a.date).getTime() - new Date(b.date).getTime();
      // Tiebreaker: higher numeric ID = newer order
      if (result === 0) {
        const aNum = parseInt((a.id || "").replace(/\D/g, ""), 10) || 0;
        const bNum = parseInt((b.id || "").replace(/\D/g, ""), 10) || 0;
        result = aNum - bNum;
      }
    } else if (sortKey === "total") {
      result = (a.total || 0) - (b.total || 0);
    } else if (sortKey === "status") {
      result = (a.status || "").localeCompare(b.status || "");
    }
    return sortDirection === "asc" ? result : -result;
  });

  // Client-side drop-down filters
  let finalOrders = [...sortedOrders];

  if (selectedMonth) {
    finalOrders = finalOrders.filter((o: any) => {
      if (!o.date) return false;
      const d = new Date(o.date);
      const monthYear = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      return monthYear === selectedMonth;
    });
  }

  if (selectedChannel) {
    finalOrders = finalOrders.filter(o => o.paymentMethod === selectedChannel);
  }

  if (selectedCustomer) {
    finalOrders = finalOrders.filter(o => o.billing.name === selectedCustomer);
  }

  const formatKsh = (num: number) => {
    return "KSh " + num.toLocaleString("en-KE");
  };

  // Pagination calculation based on finalOrders
  const totalItems = finalOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPageSafe = Math.min(currentPage, totalPages || 1);
  const paginatedOrders = finalOrders.slice(
    (currentPageSafe - 1) * itemsPerPage,
    currentPageSafe * itemsPerPage
  );

  const handleSearchSubmit = () => {
    const newParams = new URLSearchParams(searchParams);
    if (searchText) {
      newParams.set("search", searchText);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };

  // Detect if a date string has a time component (ISO format) vs old locale-only format
  const hasTimeComponent = (dateStr: string) => {
    // ISO strings contain "T" (e.g. "2026-06-11T13:05:44.000Z")
    return dateStr.includes("T") || dateStr.includes(":");
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return "—";
    // If the date is an old-format string with no time (e.g. "June 11, 2026"),
    // don't show misleading relative hours — just return empty so we show date only
    if (!hasTimeComponent(dateStr)) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return "";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  };

  const formatOrderDate = (dateStr: string) => {
    if (!dateStr) return "—";
    // Old format dates like "June 11, 2026" — return as-is
    if (!hasTimeComponent(dateStr)) return dateStr;
    // ISO dates — format nicely with time
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map(o => o.id));
    }
  };

  const handleBulkApply = async (actionType: string) => {
    if (selectedIds.length === 0) {
      alert("Please select at least one order.");
      return;
    }

    if (!actionType) {
      alert("Please select an action.");
      return;
    }

    // Client-side actions
    if (actionType === "export") {
      const selectedOrders = finalOrders.filter((o: any) => selectedIds.includes(o.id));
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Order ID,Date,Billing Name,Billing Phone,Billing Email,Payment Method,Total,Shipping,Status\n";
      selectedOrders.forEach((o: any) => {
        csvContent += `"${o.id}","${o.date}","${o.billing.name}","${o.billing.phone}","${o.billing.email}","${o.paymentMethod}",${o.total},${o.shipping},"${o.status}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `orders_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (actionType === "gen_invoice" || actionType === "merge_invoice") {
      const selectedOrders = finalOrders.filter((o: any) => selectedIds.includes(o.id));
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoices</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                .invoice { border: 1px solid #ccc; padding: 20px; margin-bottom: 40px; page-break-after: always; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; text-align: right; }
              </style>
            </head>
            <body>
              ${selectedOrders.map((o: any) => `
                <div class="invoice">
                  <div class="header">
                    <div>
                      <h2>VISION PLUS DIGITAL EVOLUTION</h2>
                      <p>Nairobi, Kenya</p>
                    </div>
                    <div style="text-align: right;">
                      <h1>INVOICE</h1>
                      <p>Order ID: <strong>#${o.id}</strong></p>
                      <p>Date: ${new Date(o.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div class="details">
                    <div>
                      <h3>Billing To:</h3>
                      <p><strong>${o.billing.name}</strong></p>
                      <p>Phone: ${o.billing.phone}</p>
                      <p>Email: ${o.billing.email}</p>
                    </div>
                    <div>
                      <h3>Payment Details:</h3>
                      <p>Method: ${o.paymentMethod}</p>
                      <p>Status: ${o.status}</p>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${o.items.map((item: any) => `
                        <tr>
                          <td>${item.name}</td>
                          <td>${item.quantity}</td>
                          <td>KSh ${item.price.toLocaleString()}</td>
                          <td>KSh ${(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" class="total-row">Shipping</td>
                        <td>KSh ${o.shipping.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="total-row">Grand Total</td>
                        <td style="color: #3c3482; font-size: 1.1em;">KSh ${o.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              `).join("")}
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      return;
    }

    if (actionType === "gen_packing" || actionType === "merge_packing") {
      const selectedOrders = finalOrders.filter((o: any) => selectedIds.includes(o.id));
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Packing Slips</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                .slip { border: 1px dashed #333; padding: 20px; margin-bottom: 40px; page-break-after: always; }
                .header { border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 20px; }
                .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f9f9f9; }
              </style>
            </head>
            <body>
              ${selectedOrders.map((o: any) => `
                <div class="slip">
                  <div class="header">
                    <h2>PACKING SLIP (DELIVERY NOTE)</h2>
                    <p>Order ID: <strong>#${o.id}</strong> | Date: ${new Date(o.date).toLocaleDateString()}</p>
                  </div>
                  <div class="details">
                    <div>
                      <h3>Deliver To:</h3>
                      <p><strong>${o.billing.name}</strong></p>
                      <p>Phone: ${o.billing.phone}</p>
                      <p>Email: ${o.billing.email}</p>
                    </div>
                    <div>
                      <h3>Shipping Method:</h3>
                      <p>Standard Courier Delivery</p>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Product SKU / Name</th>
                        <th>Qty Ordered</th>
                        <th>Qty Shipped</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${o.items.map((item: any) => `
                        <tr>
                          <td><strong>${item.sku || "N/A"}</strong> - ${item.name}</td>
                          <td>${item.quantity}</td>
                          <td>[   ]</td>
                          <td>Pending</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              `).join("")}
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      return;
    }

    if (actionType === "zip_invoice" || actionType === "zip_packing") {
      alert(`Downloading zip file for ${selectedIds.length} orders...`);
      return;
    }

    // Database actions: submit form
    const form = document.createElement("form");
    form.method = "POST";

    const intentInput = document.createElement("input");
    intentInput.type = "hidden";
    intentInput.name = "intent";
    intentInput.value = "bulk_action";
    form.appendChild(intentInput);

    const typeInput = document.createElement("input");
    typeInput.type = "hidden";
    typeInput.name = "actionType";
    typeInput.value = actionType;
    form.appendChild(typeInput);

    const idsInput = document.createElement("input");
    idsInput.type = "hidden";
    idsInput.name = "ids";
    idsInput.value = selectedIds.join(",");
    form.appendChild(idsInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Helper arrays for dropdown menus
  const activeOrdersForFilters = allOrders.filter((o: any) => o.status !== "TRASH");
  const getUniqueMonths = () => {
    const months = new Set<string>();
    activeOrdersForFilters.forEach((o: any) => {
      if (o.date) {
        const d = new Date(o.date);
        if (!isNaN(d.getTime())) {
          const monthYear = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          months.add(monthYear);
        }
      }
    });
    return Array.from(months);
  };

  const uniqueMonths = getUniqueMonths();
  const uniqueChannels = Array.from(new Set(activeOrdersForFilters.map((o: any) => o.paymentMethod).filter(Boolean))) as string[];
  const uniqueCustomers = Array.from(new Set(activeOrdersForFilters.map((o: any) => o.billing.name).filter(Boolean))) as string[];

  // Dynamic tabs for status filters
  const statuses = [
    { label: "All", value: "" },
    { label: "Pending payment", value: "PENDING_PAYMENT" },
    { label: "Processing", value: "PROCESSING" },
    { label: "On hold", value: "ON_HOLD" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Failed", value: "FAILED" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Paid", value: "PAID" },
    { label: "Shipped", value: "SHIPPED" },
    { label: "Refunded", value: "REFUNDED" },
    { label: "Draft", value: "DRAFT" },
    ...(allOrders.some((o: any) => o.status === "TRASH") ? [{ label: "Trash", value: "TRASH" }] : [])
  ];

  const getStatusCount = (statusValue: string) => {
    if (!statusValue) return allOrders.filter((o: any) => o.status !== "TRASH").length;
    return allOrders.filter((o: any) => o.status === statusValue).length;
  };

  const visibleColSpan = [
    true, // checkbox selection is always present
    showOrderIdColumn,
    showChannelColumn,
    showDateColumn,
    showStatusColumn,
    showUpdateColumn,
    showBillingColumn,
    showShipToColumn,
    showTotalColumn,
    showExportStatusColumn,
    showActionsColumn,
    showOriginColumn,
    showInvoiceColumn,
    showPackingSlipColumn
  ].filter(Boolean).length;

  return (
    <div className="orders-view">
      <style dangerouslySetInnerHTML={{
        __html: `
        .orders-view {
          padding-top: 40px;
        }
        .order-link-name {
          font-weight: 600;
          color: #00ccff;
          cursor: pointer;
          transition: color 0.15s ease;
          display: inline-block;
          text-decoration: none;
        }
        .order-link-name:hover {
          color: #00e5ff;
          text-decoration: underline;
        }
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
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 4px;
        }

        .checkbox-group-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
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

        .checkbox-label input {
          cursor: pointer;
          accent-color: #00ccff;
        }

        .btn-apply-options {
          background: #00ccff;
          color: #000;
          border: none;
          padding: 8px 18px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-apply-options:hover {
          background: #00b3db;
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

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-grow: 1;
        }

        .orders-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          box-shadow: 0 4px 25px rgba(0,0,0,0.25);
          padding: 24px;
        }

        .btn-details {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-details:hover {
          background: rgba(0, 204, 255, 0.1);
          border-color: #00ccff;
          color: #00ccff;
        }

        /* Status filters link styling */
        .status-filters-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 16px;
        }

        .status-filter-link {
          color: #00ccff;
          text-decoration: none;
          transition: color 0.2s ease;
          cursor: pointer;
        }

        .status-filter-link:hover {
          color: #fff;
          text-decoration: underline;
        }

        .status-filter-link.active {
          color: #fff;
          font-weight: 600;
        }

        .status-filter-count {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Toolbar styles */
        .orders-toolbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 12px 16px;
          border-radius: 8px;
        }

        .toolbar-left-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Action Icon Button styles */
        .action-icon-btn {
          background: rgba(0, 204, 255, 0.05);
          border: 1px solid rgba(0, 204, 255, 0.3);
          color: #00ccff;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .action-icon-btn:hover {
          background: #00ccff;
          color: #000;
        }

        .action-icon-btn.check {
          border-color: rgba(16, 185, 129, 0.4);
          color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .action-icon-btn.check:hover {
          background: #10b981;
          color: #fff;
        }

        .action-icon-btn.cancel {
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .action-icon-btn.cancel:hover {
          background: #ef4444;
          color: #fff;
        }

        /* Status Badge styles */
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.pending_payment, .status-badge.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-badge.processing {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-badge.completed {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-badge.failed {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-badge.cancelled {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }

        .status-badge.on_hold, .status-badge.on-hold {
          background: rgba(217, 119, 6, 0.15);
          color: #d97706;
          border: 1px solid rgba(217, 119, 6, 0.3);
        }

        .status-badge.confirmed {
          background: rgba(243, 244, 246, 0.15);
          color: #f3f4f6;
          border: 1px solid rgba(243, 244, 246, 0.3);
        }

        .status-badge.paid {
          background: rgba(20, 184, 166, 0.15);
          color: #14b8a6;
          border: 1px solid rgba(20, 184, 166, 0.3);
        }

        .status-badge.shipped {
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .status-badge.refunded {
          background: rgba(244, 63, 94, 0.15);
          color: #f43f5e;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }

        .status-badge.draft {
          background: rgba(107, 114, 128, 0.15);
          color: #9ca3af;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }

        /* Glassmorphic Order details Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .modal-content {
          background: #111119;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          overflow-y: auto;
          max-height: 90vh;
        }

        .order-meta-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .order-info-block span {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .order-info-block p {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
        }

        .modal-items-list {
          margin-bottom: 24px;
        }

        .modal-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .modal-item-row:last-child {
          border-bottom: none;
        }
      ` }} />

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
          <div className="checkbox-group-grid" style={{ marginBottom: "20px" }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showOrderIdColumn}
                onChange={(e) => setShowOrderIdColumn(e.target.checked)}
              />
              Order
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showChannelColumn}
                onChange={(e) => setShowChannelColumn(e.target.checked)}
              />
              Channel
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showDateColumn}
                onChange={(e) => setShowDateColumn(e.target.checked)}
              />
              Date
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showStatusColumn}
                onChange={(e) => setShowStatusColumn(e.target.checked)}
              />
              Status
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showUpdateColumn}
                onChange={(e) => setShowUpdateColumn(e.target.checked)}
              />
              Update
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showBillingColumn}
                onChange={(e) => setShowBillingColumn(e.target.checked)}
              />
              Billing
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showShipToColumn}
                onChange={(e) => setShowShipToColumn(e.target.checked)}
              />
              Ship to
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showTotalColumn}
                onChange={(e) => setShowTotalColumn(e.target.checked)}
              />
              Total
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showExportStatusColumn}
                onChange={(e) => setShowExportStatusColumn(e.target.checked)}
              />
              Export Status
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showActionsColumn}
                onChange={(e) => setShowActionsColumn(e.target.checked)}
              />
              Actions
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showOriginColumn}
                onChange={(e) => setShowOriginColumn(e.target.checked)}
              />
              Origin
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showInvoiceColumn}
                onChange={(e) => setShowInvoiceColumn(e.target.checked)}
              />
              Invoice
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showPackingSlipColumn}
                onChange={(e) => setShowPackingSlipColumn(e.target.checked)}
              />
              Packing Slip
            </label>
          </div>

          <div className="screen-options-title">Pagination</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Number of items per page:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={tempItemsPerPage}
              onChange={(e) => setTempItemsPerPage(Number(e.target.value))}
              style={{
                background: "#09090d",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "13px",
                padding: "6px 10px",
                borderRadius: "4px",
                width: "60px",
                outline: "none"
              }}
            />
          </div>

          <div>
            <button
              type="button"
              className="btn-apply-options"
              onClick={() => {
                setItemsPerPage(tempItemsPerPage);
                setShowOptions(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Status Filters (Left) & Search Orders (Right) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
        <div className="status-filters-row" style={{ marginBottom: 0 }}>
          {statuses.map((s, idx) => {
            const count = getStatusCount(s.value);
            const isActive = statusFilter === s.value;
            return (
              <span key={s.value}>
                {idx > 0 && <span style={{ margin: "0 8px", color: "rgba(255,255,255,0.15)" }}>|</span>}
                <span
                  className={`status-filter-link ${isActive ? "active" : ""}`}
                  onClick={() => {
                    const newParams = new URLSearchParams();
                    if (s.value) {
                      newParams.set("status", s.value);
                    }
                    // Clear search when switching status tabs so all orders for this status show
                    setSearchText("");
                    setSearchParams(newParams);
                  }}
                >
                  {s.label} <span className="status-filter-count">({count})</span>
                </span>
              </span>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="text"
            className="admin-select"
            style={{ padding: "6px 12px", width: "220px", height: "32px", cursor: "text", background: "rgba(0,0,0,0.3)" }}
            placeholder="Search orders..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchSubmit();
            }}
          />
          <button
            type="button"
            className="btn-action-secondary"
            style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)" }}
            onClick={handleSearchSubmit}
          >
            Search orders
          </button>
        </div>
      </div>

      {/* Row 2: Bulk Actions & Filters (Left) & Pagination/Items Count (Right) */}
      <div className="orders-toolbar-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px" }}>
        <div className="toolbar-left-filters" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <select
            className="admin-select"
            style={{ width: "auto", minWidth: "130px", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">Bulk actions</option>
            {statusFilter === "TRASH" ? (
              <>
                <option value="restore">Restore</option>
                <option value="delete_permanently">Delete permanently</option>
              </>
            ) : (
              <>
                <option value="export">Export as XLSX</option>
                <option value="mark_exported">Mark exported</option>
                <option value="unmark_exported">Unmark exported</option>
                <option value="trash">Move to Trash</option>
                <option value="gen_invoice">Generate Invoice</option>
                <option value="gen_packing">Generate Packing Slip</option>
                <option value="zip_invoice">Download (Zip) Invoice</option>
                <option value="zip_packing">Download (Zip) Packing Slip</option>
                <option value="merge_invoice">Merge (Print) Invoice</option>
                <option value="merge_packing">Merge (Print) Packing Slip</option>
                <optgroup label="Core statuses">
                  <option value="status_pending_payment">Change status to pending payment</option>
                  <option value="status_processing">Change status to processing</option>
                  <option value="status_on_hold">Change status to on hold</option>
                  <option value="status_completed">Change status to completed</option>
                  <option value="status_cancelled">Change status to cancelled</option>
                  <option value="status_failed">Change status to failed</option>
                  <option value="status_refunded">Change status to refunded</option>
                  <option value="status_draft">Change status to draft</option>
                </optgroup>
                <optgroup label="Custom statuses">
                  <option value="status_confirmed">Change status to confirmed</option>
                  <option value="status_paid">Change status to paid</option>
                  <option value="status_shipped">Change status to shipped</option>
                </optgroup>
              </>
            )}
          </select>
          <button
            type="button"
            className="btn-action-secondary"
            style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)" }}
            onClick={() => handleBulkApply(bulkAction)}
          >
            Apply
          </button>

          <select
            className="admin-select"
            style={{ width: "auto", minWidth: "120px", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={tempMonth}
            onChange={(e) => setTempMonth(e.target.value)}
          >
            <option value="">All dates</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            style={{ width: "auto", minWidth: "150px", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={tempChannel}
            onChange={(e) => setTempChannel(e.target.value)}
          >
            <option value="">All sales channels</option>
            {uniqueChannels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            style={{ width: "auto", minWidth: "200px", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={tempCustomer}
            onChange={(e) => setTempCustomer(e.target.value)}
          >
            <option value="">Filter by registered customer</option>
            {uniqueCustomers.map((cust) => (
              <option key={cust} value={cust}>
                {cust}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-action-secondary"
            style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)" }}
            onClick={() => {
              setSelectedMonth(tempMonth);
              setSelectedChannel(tempChannel);
              setSelectedCustomer(tempCustomer);
            }}
          >
            Filter
          </button>
        </div>

        {/* Dynamic Pagination / Page selection on the right of toolbar */}
        {finalOrders.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              {finalOrders.length} {finalOrders.length === 1 ? "item" : "items"}
            </span>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: "11px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
                  disabled={currentPageSafe === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  «
                </button>
                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: "11px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
                  disabled={currentPageSafe === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  ‹
                </button>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPageSafe}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                    }
                  }}
                  style={{ width: "40px", height: "28px", textAlign: "center", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "4px", fontSize: "12px" }}
                />
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>
                  of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: "11px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
                  disabled={currentPageSafe === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  ›
                </button>
                <button
                  type="button"
                  className="btn-action-secondary"
                  style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: "11px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
                  disabled={currentPageSafe === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="orders-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "32px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={paginatedOrders.length > 0 && selectedIds.length === paginatedOrders.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", accentColor: "#00ccff" }}
                  />
                </th>
                {showOrderIdColumn && (
                  <th onClick={() => handleSort("id")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Order {renderSortIndicator("id")}
                  </th>
                )}
                {showChannelColumn && <th>Channel</th>}
                {showDateColumn && (
                  <th onClick={() => handleSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Date {renderSortIndicator("date")}
                  </th>
                )}
                {showStatusColumn && (
                  <th onClick={() => handleSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Status {renderSortIndicator("status")}
                  </th>
                )}
                {showUpdateColumn && <th>Update</th>}
                {showBillingColumn && <th>Billing</th>}
                {showShipToColumn && <th>Ship to</th>}
                {showTotalColumn && (
                  <th onClick={() => handleSort("total")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Total {renderSortIndicator("total")}
                  </th>
                )}
                {showExportStatusColumn && <th>Export Status</th>}
                {showActionsColumn && <th>Actions</th>}
                {showOriginColumn && <th>Origin</th>}
                {showInvoiceColumn && <th>Invoice</th>}
                {showPackingSlipColumn && <th>Packing Slip</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order: Order) => (
                <tr key={order.id}>
                  <td style={{ width: "32px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      style={{ cursor: "pointer", accentColor: "#00ccff" }}
                    />
                  </td>
                  {showOrderIdColumn && (
                    <td>
                      <span
                        className="order-link-name"
                        onClick={() => setSelectedOrder(order)}
                      >
                        #{order.id} {order.billing?.name || ""}
                      </span>
                    </td>
                  )}
                  {showChannelColumn && <td>{order.paymentMethod || "—"}</td>}
                  {showDateColumn && (
                    <td style={{ fontSize: "12px", lineHeight: "1.5" }}>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
                        {formatOrderDate(order.date)}
                      </div>
                      {getRelativeTime(order.date) && (
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>
                          {getRelativeTime(order.date)}
                        </div>
                      )}
                    </td>
                  )}
                  {showStatusColumn && (
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                  )}
                  {showUpdateColumn && <td>—</td>}
                  {showBillingColumn && (
                    <td>
                      <div style={{ fontWeight: "600", color: "#fff" }}>{order.billing.name}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                        {order.billing.phone} | {order.billing.email}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                        via {order.paymentMethod}
                      </div>
                    </td>
                  )}
                  {showShipToColumn && <td>—</td>}
                  {showTotalColumn && (
                    <td style={{ fontWeight: "600" }}>{formatKsh(order.total)}</td>
                  )}
                  {showExportStatusColumn && (
                    <td style={{ fontSize: "12px", color: order.paymentGatewayData?.exported ? "#10b981" : "rgba(255,255,255,0.4)" }}>
                      {order.paymentGatewayData?.exported ? "Exported" : "—"}
                    </td>
                  )}
                  {showActionsColumn && (
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {order.status === "TRASH" ? (
                          <>
                            <button
                              type="button"
                              title="Restore"
                              className="action-icon-btn"
                              style={{ background: "rgba(46, 213, 115, 0.15)", color: "#2ed573", borderColor: "rgba(46, 213, 115, 0.3)", padding: "4px 8px", fontSize: "12px", borderRadius: "4px", cursor: "pointer" }}
                              onClick={async () => {
                                const formData = new FormData();
                                formData.append("intent", "bulk_action");
                                formData.append("actionType", "restore");
                                formData.append("ids", order.id);
                                const response = await fetch("", { method: "POST", body: formData });
                                if (response.ok) {
                                  window.location.reload();
                                }
                              }}
                            >
                              ↺ Restore
                            </button>
                            <button
                              type="button"
                              title="Delete Permanently"
                              className="action-icon-btn cancel"
                              style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff4757", borderColor: "rgba(255, 71, 87, 0.3)", padding: "4px 8px", fontSize: "12px", borderRadius: "4px", cursor: "pointer" }}
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this order permanently?")) {
                                  const formData = new FormData();
                                  formData.append("intent", "bulk_action");
                                  formData.append("actionType", "delete_permanently");
                                  formData.append("ids", order.id);
                                  const response = await fetch("", { method: "POST", body: formData });
                                  if (response.ok) {
                                    window.location.reload();
                                  }
                                }
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              title="Print/View Invoice"
                              className="action-icon-btn"
                              onClick={() => {
                                setSelectedIds([order.id]);
                                setTimeout(() => handleBulkApply("gen_invoice"), 100);
                              }}
                            >
                              📄
                            </button>
                            <button
                              type="button"
                              title="Mark Completed"
                              className="action-icon-btn check"
                              onClick={async () => {
                                const formData = new FormData();
                                formData.append("intent", "bulk_action");
                                formData.append("actionType", "status_completed");
                                formData.append("ids", order.id);
                                const response = await fetch("", { method: "POST", body: formData });
                                if (response.ok) {
                                  window.location.reload();
                                }
                              }}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              title="Mark Cancelled"
                              className="action-icon-btn cancel"
                              onClick={async () => {
                                const formData = new FormData();
                                formData.append("intent", "bulk_action");
                                formData.append("actionType", "status_cancelled");
                                formData.append("ids", order.id);
                                const response = await fetch("", { method: "POST", body: formData });
                                if (response.ok) {
                                  window.location.reload();
                                }
                              }}
                            >
                              ✗
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                  {showOriginColumn && (
                    <td style={{ fontSize: "12px" }}>
                      {order.paymentGatewayData?.origin || "Direct"}
                    </td>
                  )}
                  {showInvoiceColumn && (
                    <td>
                      <span
                        style={{ color: "#00ccff", cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
                        onClick={() => {
                          setSelectedIds([order.id]);
                          setTimeout(() => handleBulkApply("gen_invoice"), 100);
                        }}
                      >
                        INV-{order.id}
                      </span>
                    </td>
                  )}
                  {showPackingSlipColumn && (
                    <td>
                      <span
                        style={{ color: "#00ccff", cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
                        onClick={() => {
                          setSelectedIds([order.id]);
                          setTimeout(() => handleBulkApply("gen_packing"), 100);
                        }}
                      >
                        PS-{order.id}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleColSpan}
                    style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.4)" }}
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {finalOrders.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            marginTop: "20px"
          }}>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              Showing {(currentPageSafe - 1) * itemsPerPage + 1} to {Math.min(currentPageSafe * itemsPerPage, finalOrders.length)} of {finalOrders.length} {finalOrders.length === 1 ? "order" : "orders"}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  className="btn-details"
                  style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                  disabled={currentPageSafe === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  ◀ Previous
                </button>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                  Page {currentPageSafe} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-details"
                  style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                  disabled={currentPageSafe === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details & Status Update Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
                Order Fulfillment details: {selectedOrder.id}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="order-meta-info">
              <div className="order-info-block">
                <span>Customer Contact</span>
                <p>{selectedOrder.billing.name}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{selectedOrder.billing.email}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{selectedOrder.billing.phone}</p>
              </div>

              <div className="order-info-block">
                <span>Details & Payment</span>
                <p>Placed: {formatOrderDate(selectedOrder.date)}</p>
                <p>Method: {selectedOrder.paymentMethod}</p>
                <p style={{ color: "#2ed573", fontWeight: "600" }}>Shipping: {formatKsh(selectedOrder.shipping)}</p>
              </div>
            </div>

            <div className="modal-items-list">
              <h4 style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "12px" }}>Ordered Items</h4>
              {selectedOrder.items.map((item: any, index: number) => (
                <div className="modal-item-row" key={index}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src={item.image || item.thumbnail || "/assets/images/products/Cool-Pods.jpg"}
                      alt={item.name}
                      style={{ width: "36px", height: "36px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", padding: "2px", objectFit: "contain" }}
                    />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{item.name}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Qty: {item.quantity} × {formatKsh(item.price)}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{formatKsh(item.price * item.quantity)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.1)", marginTop: "8px", fontWeight: "600" }}>
                <span>Grand Total</span>
                <span style={{ color: "#00ccff" }}>{formatKsh(selectedOrder.total)}</span>
              </div>
            </div>

            <Form
              method="post"
              onSubmit={() => {
                setTimeout(() => setSelectedOrder(null), 300);
              }}
            >
              <input type="hidden" name="intent" value="update_order" />
              <input type="hidden" name="id" value={selectedOrder.id} />

              <div className="form-row">
                <div>
                  <label className="admin-label" htmlFor="status">
                    Status
                  </label>
                  <select
                    key={selectedOrder.id + "-" + selectedOrder.status}
                    className="admin-select"
                    id="status"
                    name="status"
                    defaultValue={selectedOrder.status}
                    required
                  >
                    <option value="PENDING_PAYMENT">Pending payment</option>
                    <option value="ON_HOLD">On hold</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PAID">Paid</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="FAILED">Failed</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label" htmlFor="trackingNumber">
                    Courier Tracking Code
                  </label>
                  <input
                    className="admin-input"
                    type="text"
                    id="trackingNumber"
                    name="trackingNumber"
                    defaultValue={selectedOrder.paymentGatewayData?.trackingNumber || ""}
                    placeholder="e.g. G4S-8291039"
                  />
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
                  marginTop: "24px",
                }}
              >
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Update Order"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
