import { db } from "~/lib/db.server";

interface CustomerItem {
  id: string;
  name: string;
  username: string;
  lastActive: string;
  dateRegistered: string;
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
  }
];

export async function loader({ request }: { request: Request }) {
  try {
    const { requireAdminUser } = await import("~/lib/sessions.server");
    await requireAdminUser(request);
  } catch (e) {
    // If not authenticated as admin, reject export
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const filter = url.searchParams.get("filter") || "all";
  const sortKey = (url.searchParams.get("sortKey") || "lastActive") as keyof CustomerItem;
  const sortDir = (url.searchParams.get("sortDir") || "desc") as "asc" | "desc";

  const orders = await db.order.findMany();
  const users = await db.user.findMany();

  const customerMap = new Map<string, CustomerItem>();
  SEED_CUSTOMERS.forEach(c => {
    if (c.email) customerMap.set(c.email.toLowerCase(), { ...c });
  });

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

  if (filter === "active") {
    allCustomers = allCustomers.filter(c => c.ordersCount > 0);
  } else if (filter === "registered") {
    allCustomers = allCustomers.filter(c => Boolean(c.dateRegistered));
  }

  if (search) {
    const term = search.toLowerCase();
    allCustomers = allCustomers.filter(c =>
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.username && c.username.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  }

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

  const headers = ["Name", "Username", "Last Active", "Date Registered", "Email", "Orders", "Total Spend", "AOV", "Country/Region", "City", "Region", "Postal Code"];
  const rows = allCustomers.map(c => [
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
    ...rows.map(row => row.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const todayStr = new Date().toISOString().split("T")[0];

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers_export_${todayStr}.csv"`
    }
  });
}
