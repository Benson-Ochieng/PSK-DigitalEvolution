import fs from "fs";
import path from "path";

// In a real application, this would be a Prisma client or similar database connection
// For now, we use persistent JSON files in the content directory to prevent data resetting on server restart.

export type OrderStatus = 'PENDING_PAYMENT' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'ON_HOLD' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'REFUNDED' | 'DRAFT' | 'TRASH';

export interface Order {
  id: string;
  date: string;
  paymentMethod: string;
  items: any[];
  total: number;
  shipping: number;
  currency: string;
  billing: {
    name: string;
    email: string;
    phone: string;
  };
  status: OrderStatus;
  paymentGatewayData?: any; // To store transaction IDs, etc.
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'administrator' | 'editor' | 'author' | 'contributor' | 'subscriber' | 'customer' | 'shop_manager';
  ordersCount: number;
  createdAt: string;
  status: 'active' | 'suspended';
  passwordHash: string; // Plain password for mock purposes
}

export interface Coupon {
  code: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  active: boolean;
  createdAt: string;
  status?: string;
  expiryDate?: string;
  allowFreeShipping?: boolean;
  description?: string;
  minimumSpend?: number;
  maximumSpend?: number;
  individualUse?: boolean;
  excludeSaleItems?: boolean;
  usageLimitPerCoupon?: number;
  usageLimitPerUser?: number;
  products?: string[];
  excludeProducts?: string[];
  productCategories?: string[];
  excludeCategories?: string[];
  allowedEmails?: string;
  productBrands?: string[];
  excludeBrands?: string[];
}

// File system paths
const CONTENT_DIR = path.join(process.cwd(), "content");
const USERS_FILE = path.join(CONTENT_DIR, "users.json");
const ORDERS_FILE = path.join(CONTENT_DIR, "orders.json");
const COUPONS_FILE = path.join(CONTENT_DIR, "coupons.json");
const POSTS_FILE = path.join(CONTENT_DIR, "posts", "_index.json");

// Seed data
const initialUsers: User[] = [
  {
    id: "u-admin",
    name: "System Admin",
    email: "admin@petstore.co.ke",
    username: "admin",
    role: "administrator",
    ordersCount: 0,
    createdAt: "2026-01-01",
    status: "active",
    passwordHash: "Admin2026!"
  },
  {
    id: "u-manager",
    name: "Shop Manager",
    email: "manager@petstore.co.ke",
    username: "manager",
    role: "shop_manager",
    ordersCount: 0,
    createdAt: "2026-02-15",
    status: "active",
    passwordHash: "Manager2026!"
  },
  {
    id: "u-cust1",
    name: "John Doe",
    email: "john.doe@gmail.com",
    username: "johndoe",
    role: "customer",
    ordersCount: 3,
    createdAt: "2026-03-01",
    status: "active",
    passwordHash: "password123"
  },
  {
    id: "u-cust2",
    name: "Jane Smith",
    email: "jane.smith@gmail.com",
    username: "janesmith",
    role: "customer",
    ordersCount: 1,
    createdAt: "2026-04-10",
    status: "active",
    passwordHash: "password123"
  }
];

const initialCoupons: Coupon[] = [
  {
    code: "PET8",
    discountValue: 8,
    discountType: "percentage",
    active: true,
    createdAt: "2026-05-01"
  },
  {
    code: "WELCOME500",
    discountValue: 500,
    discountType: "fixed",
    active: true,
    createdAt: "2026-05-15"
  }
];

// Seed some initial orders for dashboard rendering
const getInitialOrders = (): Order[] => [
  {
    id: "PSK-8001",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    paymentMethod: "MPESA Express",
    items: [
      { id: 36509, name: "Bonnie Adult Dog Food - Beef 15kg", price: 4500, quantity: 2, image: "/images/psk_logo.png" }
    ],
    total: 9000,
    shipping: 0,
    currency: "KES",
    billing: { name: "John Doe", email: "john.doe@gmail.com", phone: "254712345678" },
    status: "PROCESSING"
  },
  {
    id: "PSK-8002",
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    paymentMethod: "M-Pesa on Delivery",
    items: [
      { id: 36600, name: "Reflex Plus Cat Food - Salmon 1.5kg", price: 1200, quantity: 1, image: "/images/psk_logo.png" }
    ],
    total: 1700, // includes 500 shipping
    shipping: 500,
    currency: "KES",
    billing: { name: "Jane Smith", email: "jane.smith@gmail.com", phone: "254787654321" },
    status: "COMPLETED"
  },
  {
    id: "PSK-8003",
    date: new Date(Date.now() - 3600000 * 48).toISOString(),
    paymentMethod: "MPESA Express",
    items: [
      { id: 45177, name: "Trixie Cat Scratching Post", price: 3200, quantity: 1, image: "/images/psk_logo.png" }
    ],
    total: 3200,
    shipping: 0,
    currency: "KES",
    billing: { name: "Alice Kamau", email: "alice.k@outlook.com", phone: "254700111222" },
    status: "PENDING_PAYMENT"
  }
];

// Helper to read JSON safely, fallback to initial seed
function readData<T>(filePath: string, initialData: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      // Write initial seed if it doesn't exist
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("Error reading file:", filePath, err);
    return initialData;
  }
}

// Helper to write JSON safely
function writeData<T>(filePath: string, data: T) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing file:", filePath, err);
  }
}

import { supabase, pullFromSupabase } from "./supabase.server";

function serializeCouponForSupabase(coupon: any) {
  const { code, discountValue, discountType, active, createdAt, ...extraData } = coupon;
  return {
    code: code.toUpperCase(),
    discountValue,
    discountType: `${discountType}__${JSON.stringify(extraData)}`,
    active,
    createdAt: createdAt || new Date().toISOString().split('T')[0]
  };
}

function deserializeCouponFromSupabase(dbCoupon: any) {
  if (!dbCoupon) return null;
  const { code, discountValue, discountType, active, createdAt } = dbCoupon;
  let actualDiscountType = discountType;
  let extraData: any = {};

  if (discountType && discountType.includes("__")) {
    const parts = discountType.split("__");
    actualDiscountType = parts[0];
    try {
      extraData = JSON.parse(parts.slice(1).join("__"));
    } catch (e) {
      console.error("Failed to parse extraData for coupon:", code, e);
    }
  }

  return {
    code,
    discountValue,
    discountType: actualDiscountType as 'percentage' | 'fixed',
    active,
    createdAt,
    ...extraData
  };
}

let petStoreProductNames: Set<string> | null = null;

export function isPetStoreOrder(order: Order): boolean {
  if (!order) return false;

  // Filter out trash status
  const statusLower = String(order.status || '').toLowerCase();
  if (statusLower === "trash") {
    return false;
  }

  // Filter out customer names that look like tests
  const customerName = String(order.billing?.name || '').toLowerCase();
  if (customerName.includes("test") || customerName.includes("tester")) {
    return false;
  }

  if (!Array.isArray(order.items) || order.items.length === 0) return false;

  // Check items for test products or non-standard prices
  const hasTestItems = order.items.some((item: any) => {
    if (!item) return true;
    const nameLower = String(item.name || '').toLowerCase();
    const skuLower = String(item.sku || '').toLowerCase();

    if (nameLower.includes("test product") || nameLower.includes("dummy product") || nameLower.includes("a washing machine")) {
      return true;
    }
    if (skuLower.includes("test") || skuLower.includes("dummy")) {
      return true;
    }
    if (item.price !== undefined && Number(item.price) <= 10) {
      return true;
    }
    return false;
  });

  if (hasTestItems) {
    return false;
  }

  if (!petStoreProductNames) {
    petStoreProductNames = new Set<string>();
    try {
      const productsIndexFile = path.join(process.cwd(), "content", "products", "_index.json");
      if (fs.existsSync(productsIndexFile)) {
        const products = JSON.parse(fs.readFileSync(productsIndexFile, "utf-8"));
        if (Array.isArray(products)) {
          products.forEach((p: any) => {
            if (p.name) petStoreProductNames!.add(p.name.toLowerCase().trim());
          });
        }
      }
    } catch (e) {
      console.error("Failed to load products index for order filtering:", e);
    }
  }

  const petKeywords = [
    "dog", "cat", "pet", "puppy", "kitten", "food", "kibble", "trixie", "bonnie",
    "reflex", "scratching", "litter", "collar", "leash", "bird", "fish", "hamster"
  ];



  return order.items.some((item: any) => {
    if (!item || !item.name) return false;
    const nameLower = item.name.toLowerCase();

    if (petStoreProductNames!.has(nameLower.trim())) {
      return true;
    }

    const matchesPet = petKeywords.some(kw => nameLower.includes(kw));

    return matchesPet
  });
}

export function ensureOrderFormat(o: any, dbItems: any[] = []): Order {
  if (!o) return o;
  
  // If it's already in the storefront Order format
  if (Array.isArray(o.items) && o.total !== undefined && o.billing?.name !== undefined) {
    return o;
  }
  
  // Otherwise, it's a raw DB row, map it:
  const orderItems = dbItems
    .filter((item: any) => Number(item.order_id) === Number(o.id))
    .map((item: any) => ({
      id: Number(item.product_id),
      name: item.product_name,
      price: Number(item.unit_price || 0),
      quantity: Number(item.qty || 0),
      image: "/images/psk_logo.png"
    }));

  let status = (o.status || "PENDING").toUpperCase();
  if (status === "PENDING") {
    status = "PENDING_PAYMENT";
  }

  return {
    id: String(o.id),
    date: o.created_at || new Date().toISOString(),
    paymentMethod: o.payment_method || "MPESA Express",
    items: orderItems,
    total: Number(o.total_kes || 0),
    shipping: Number(o.delivery_fee_kes || 0),
    currency: "KES",
    billing: {
      name: o.customer_name || "",
      email: o.customer_email || "",
      phone: o.customer_phone || ""
    },
    status: status
  };
}

export const db = {
  order: {
    async create(data: Omit<Order, 'status'> & { status?: OrderStatus }): Promise<Order> {
      const order: Order = {
        ...data,
        status: data.status || 'PENDING_PAYMENT'
      };
      if (supabase) {
        try {
          const dbOrder = {
            customer_name: order.billing.name,
            customer_phone: order.billing.phone,
            customer_email: order.billing.email,
            total_kes: order.total,
            delivery_fee_kes: order.shipping,
            payment_method: order.paymentMethod,
            status: order.status.toLowerCase(),
            created_at: order.date || new Date().toISOString()
          };
          const { data: inserted, error } = await supabase.from("orders").insert(dbOrder).select().single();
          if (error) throw error;
          
          if (inserted && order.items && order.items.length > 0) {
            const dbItems = order.items.map(item => ({
              order_id: inserted.id,
              product_id: item.id,
              product_name: item.name,
              qty: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity
            }));
            await supabase.from("order_items").insert(dbItems);
          }
        } catch (err) {
          console.error("Failed to insert order in Supabase:", err);
        }
      }

      const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      ordersList.push(order);
      writeData(ORDERS_FILE, ordersList);
      return order;
    },

    async findUnique({ where }: { where: { id: string } }): Promise<Order | null> {
      let order: Order | null = null;
      if (supabase) {
        try {
          const numericId = parseInt(where.id, 10);
          let query = supabase.from("orders").select();
          if (!isNaN(numericId)) {
            query = query.eq("id", numericId);
          } else {
            query = query.eq("id", where.id);
          }
          const { data, error } = await query.maybeSingle();
          if (error) throw error;
          if (data) {
            const { data: orderItems } = await supabase.from("order_items").select().eq("order_id", data.id);
            order = ensureOrderFormat(data, orderItems || []);
          }
        } catch (err) {
          console.error("Supabase order findUnique failed:", err);
        }
      }
      
      if (!order) {
        const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
        order = ordersList.find(o => o.id === where.id) || null;
      }

      if (order && isPetStoreOrder(order)) {
        return order;
      }
      return null;
    },

    async findFirst({ where }: { where: (order: Order) => boolean }): Promise<Order | null> {
      let ordersList: Order[] = [];
      if (supabase) {
        try {
          const { data, error } = await supabase.from("orders").select().order("created_at", { ascending: false });
          if (error) throw error;
          const { data: orderItems } = await supabase.from("order_items").select();
          ordersList = (data || []).map(o => ensureOrderFormat(o, orderItems || []));
        } catch (err) {
          console.error("Supabase order findFirst failed:", err);
        }
      }
      
      if (ordersList.length === 0) {
        ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      }

      const filtered = ordersList.filter(isPetStoreOrder);
      return filtered.find(where) || null;
    },

    async findMany(options?: { where?: (order: Order) => boolean }): Promise<Order[]> {
      let ordersList: Order[] = [];
      if (supabase) {
        try {
          const { data, error } = await supabase.from("orders").select().order("created_at", { ascending: false });
          if (error) throw error;
          const { data: orderItems } = await supabase.from("order_items").select();
          ordersList = (data || []).map(o => ensureOrderFormat(o, orderItems || []));
        } catch (err) {
          console.error("Supabase order findMany failed:", err);
        }
      }
      
      if (ordersList.length === 0) {
        ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      }

      ordersList = ordersList.filter(isPetStoreOrder);

      if (options?.where) {
        return ordersList.filter(options.where);
      }
      return ordersList;
    },

    async update({ where, data }: { where: { id: string }, data: Partial<Order> }): Promise<Order> {
      if (supabase) {
        try {
          const dbData: any = {};
          if (data.status) dbData.status = data.status.toLowerCase();
          if (data.paymentMethod) dbData.payment_method = data.paymentMethod;
          if (data.total !== undefined) dbData.total_kes = data.total;
          if (data.shipping !== undefined) dbData.delivery_fee_kes = data.shipping;
          if (data.billing) {
            if (data.billing.name) dbData.customer_name = data.billing.name;
            if (data.billing.phone) dbData.customer_phone = data.billing.phone;
            if (data.billing.email) dbData.customer_email = data.billing.email;
          }

          const numericId = parseInt(where.id, 10);
          const { data: updated, error } = await supabase.from("orders")
            .update(dbData)
            .eq("id", isNaN(numericId) ? where.id : numericId)
            .select()
            .single();
          if (error) throw error;

          const { data: orderItems } = await supabase.from("order_items").select().eq("order_id", updated.id);
          const mappedUpdated = ensureOrderFormat(updated, orderItems || []);

          // Also update local JSON file
          const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
          const idx = ordersList.findIndex(o => o.id === where.id);
          if (idx !== -1) {
            ordersList[idx] = mappedUpdated;
            writeData(ORDERS_FILE, ordersList);
          }
          return mappedUpdated;
        } catch (err) {
          console.error("Supabase order update failed:", err);
        }
      }

      const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      const idx = ordersList.findIndex(o => o.id === where.id);
      if (idx === -1) throw new Error("Order not found");

      const updated = { ...ordersList[idx], ...data };
      ordersList[idx] = updated;
      writeData(ORDERS_FILE, ordersList);
      return updated;
    },

    async delete({ where }: { where: { id: string } }): Promise<boolean> {
      if (supabase) {
        try {
          const numericId = parseInt(where.id, 10);
          const { error } = await supabase.from("orders").delete().eq("id", isNaN(numericId) ? where.id : numericId);
          if (error) throw error;
          
          // Also update local JSON
          const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
          const filtered = ordersList.filter(o => o.id !== where.id);
          writeData(ORDERS_FILE, filtered);
          return true;
        } catch (err) {
          console.error("Supabase order delete failed:", err);
        }
      }

      const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      const filtered = ordersList.filter(o => o.id !== where.id);
      if (filtered.length === ordersList.length) return false;
      writeData(ORDERS_FILE, filtered);
      return true;
    }
  },

  user: {
    async findUnique({ where }: { where: { id?: string; email?: string; username?: string } }): Promise<User | null> {
      if (supabase) {
        let query = supabase.from("users").select();
        if (where.id) {
          query = query.eq("id", where.id);
        } else if (where.email) {
          query = query.ilike("email", where.email);
        } else if (where.username) {
          query = query.ilike("username", where.username);
        } else {
          return null;
        }
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data as User | null;
      }

      const usersList = readData<User[]>(USERS_FILE, initialUsers);
      return usersList.find(u => {
        if (where.id && u.id === where.id) return true;
        if (where.email && u.email.toLowerCase() === where.email.toLowerCase()) return true;
        if (where.username && u.username.toLowerCase() === where.username.toLowerCase()) return true;
        return false;
      }) || null;
    },

    async findMany(options?: { where?: (user: User) => boolean }): Promise<User[]> {
      let usersList: User[] = [];
      if (supabase) {
        const { data, error } = await supabase.from("users").select().order("createdAt", { ascending: false });
        if (error) throw error;
        usersList = data as User[];
      } else {
        usersList = readData<User[]>(USERS_FILE, initialUsers);
      }

      usersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (options?.where) {
        return usersList.filter(options.where);
      }
      return usersList;
    },

    async create(data: Omit<User, 'id' | 'createdAt' | 'ordersCount'>): Promise<User> {
      const id = "u-" + Math.random().toString(36).substr(2, 9);
      const user: User = {
        ...data,
        id,
        ordersCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      if (supabase) {
        const { error } = await supabase.from("users").insert(user);
        if (error) throw error;
      }

      const usersList = readData<User[]>(USERS_FILE, initialUsers);
      usersList.push(user);
      writeData(USERS_FILE, usersList);
      return user;
    },

    async update({ where, data }: { where: { id: string }, data: Partial<User> }): Promise<User> {
      if (supabase) {
        const { data: updated, error } = await supabase.from("users").update(data).eq("id", where.id).select().single();
        if (error) throw error;
        // Also update local JSON
        const usersList = readData<User[]>(USERS_FILE, initialUsers);
        const idx = usersList.findIndex(u => u.id === where.id);
        if (idx !== -1) {
          usersList[idx] = updated as User;
          writeData(USERS_FILE, usersList);
        }
        return updated as User;
      }

      const usersList = readData<User[]>(USERS_FILE, initialUsers);
      const idx = usersList.findIndex(u => u.id === where.id);
      if (idx === -1) throw new Error("User not found");
      const updated = { ...usersList[idx], ...data };
      usersList[idx] = updated;
      writeData(USERS_FILE, usersList);
      return updated;
    },

    async delete({ where }: { where: { id: string } }): Promise<boolean> {
      if (supabase) {
        const { error } = await supabase.from("users").delete().eq("id", where.id);
        if (error) throw error;
        // Also update local JSON
        const usersList = readData<User[]>(USERS_FILE, initialUsers);
        const filtered = usersList.filter(u => u.id !== where.id);
        writeData(USERS_FILE, filtered);
        return true;
      }

      const usersList = readData<User[]>(USERS_FILE, initialUsers);
      const filtered = usersList.filter(u => u.id !== where.id);
      if (filtered.length === usersList.length) return false;
      writeData(USERS_FILE, filtered);
      return true;
    }
  },

  coupon: {
    async findUnique({ where }: { where: { code: string } }): Promise<Coupon | null> {
      if (supabase) {
        try {
          const { data, error } = await supabase.from("coupons").select().eq("code", where.code.toUpperCase()).maybeSingle();
          if (!error && data) {
            return deserializeCouponFromSupabase(data);
          }
          if (error) console.error("Supabase coupons findUnique error:", error);
        } catch (err) {
          console.error("Supabase coupons findUnique failed:", err);
        }
      }

      const couponsList = readData<Coupon[]>(COUPONS_FILE, initialCoupons);
      return couponsList.find(c => c.code.toUpperCase() === where.code.toUpperCase()) || null;
    },

    async findMany(options?: { where?: (coupon: Coupon) => boolean }): Promise<Coupon[]> {
      const localCoupons = readData<Coupon[]>(COUPONS_FILE, initialCoupons);
      let couponsList = [...localCoupons];

      if (supabase) {
        try {
          const { data, error } = await supabase.from("coupons").select().order("createdAt", { ascending: false });
          if (!error && data) {
            const supabaseCoupons = data.map((c: any) => deserializeCouponFromSupabase(c)).filter(Boolean) as Coupon[];
            const mergedMap = new Map<string, Coupon>();

            localCoupons.forEach(c => mergedMap.set(c.code.toUpperCase(), c));
            supabaseCoupons.forEach(c => mergedMap.set(c.code.toUpperCase(), c));

            couponsList = Array.from(mergedMap.values());

            // Background self-healing sync: upload missing local coupons to Supabase
            const missingInSupabase = localCoupons.filter(lc =>
              !supabaseCoupons.some(sc => sc.code.toUpperCase() === lc.code.toUpperCase())
            );
            if (missingInSupabase.length > 0) {
              console.log(`Syncing ${missingInSupabase.length} missing coupons to Supabase...`);
              for (const c of missingInSupabase) {
                const serialized = serializeCouponForSupabase(c);
                await supabase.from("coupons").insert(serialized);
              }
            }
          } else if (error) {
            console.error("Supabase coupons findMany error:", error);
          }
        } catch (err) {
          console.error("Supabase coupons findMany failed:", err);
        }
      }

      couponsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (options?.where) {
        return couponsList.filter(options.where);
      }
      return couponsList;
    },

    async create(data: Omit<Coupon, 'createdAt'>): Promise<Coupon> {
      const coupon: Coupon = {
        ...data,
        code: data.code.toUpperCase(),
        createdAt: new Date().toISOString().split('T')[0]
      };
      if (supabase) {
        try {
          const serialized = serializeCouponForSupabase(coupon);
          const { error } = await supabase.from("coupons").insert(serialized);
          if (error) {
            console.error("Supabase coupons create error:", error);
          }
        } catch (err) {
          console.error("Supabase coupons create failed:", err);
        }
      }

      const couponsList = readData<Coupon[]>(COUPONS_FILE, initialCoupons);
      couponsList.push(coupon);
      writeData(COUPONS_FILE, couponsList);
      return coupon;
    },

    async update({ where, data }: { where: { code: string }, data: Partial<Coupon> }): Promise<Coupon> {
      const couponsList = readData<Coupon[]>(COUPONS_FILE, initialCoupons);
      const idx = couponsList.findIndex(c => c.code.toUpperCase() === where.code.toUpperCase());
      if (idx === -1) throw new Error("Coupon not found");

      const mergedCoupon = { ...couponsList[idx], ...data };

      if (supabase) {
        try {
          const serialized = serializeCouponForSupabase(mergedCoupon);
          const { error } = await supabase.from("coupons").update(serialized).eq("code", where.code.toUpperCase());
          if (error) {
            console.error("Supabase coupons update error:", error);
          }
        } catch (err) {
          console.error("Supabase coupons update failed:", err);
        }
      }

      couponsList[idx] = mergedCoupon;
      writeData(COUPONS_FILE, couponsList);
      return mergedCoupon;
    },

    async delete({ where }: { where: { code: string } }): Promise<boolean> {
      if (supabase) {
        try {
          const { error } = await supabase.from("coupons").delete().eq("code", where.code.toUpperCase());
          if (error) console.error("Supabase coupons delete error:", error);
        } catch (err) {
          console.error("Supabase coupons delete failed:", err);
        }
      }

      const couponsList = readData<Coupon[]>(COUPONS_FILE, initialCoupons);
      const filtered = couponsList.filter(c => c.code.toUpperCase() !== where.code.toUpperCase());
      if (filtered.length === couponsList.length) return false;
      writeData(COUPONS_FILE, filtered);
      return true;
    }
  },

  post: {
    async findUnique({ where }: { where: { id?: string; slug?: string } }): Promise<any | null> {
      if (supabase) {
        try {
          let query = supabase.from("posts").select();
          if (where.id) {
            query = query.eq("id", where.id);
          } else if (where.slug) {
            query = query.eq("slug", where.slug);
          } else {
            return null;
          }
          const { data, error } = await query.maybeSingle();
          if (!error && data) {
            return {
              ...data,
              image: data.image || data.thumbnail || null,
              link: data.link || "",
              tag: data.tag || "Pet Care"
            };
          }
        } catch (err) {
          console.error("Failed to query posts from Supabase:", err);
        }
      }

      try {
        if (fs.existsSync(POSTS_FILE)) {
          const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
          if (Array.isArray(posts)) {
            let found = null;
            if (where.id) found = posts.find(p => p.id === where.id);
            else if (where.slug) found = posts.find(p => p.slug === where.slug);
            if (found) {
              return {
                ...found,
                image: found.image || found.thumbnail || null,
                link: found.link || "",
                tag: found.tag || "Pet Care"
              };
            }
          }
        }
      } catch { }
      return null;
    },

    async findMany(options?: { where?: (post: any) => boolean }): Promise<any[]> {
      let posts: any[] = [];
      if (supabase) {
        try {
          const { data, error } = await supabase.from("posts").select().order("date", { ascending: false });
          if (!error && data) {
            posts = data.map((p: any) => ({
              ...p,
              image: p.image || p.thumbnail || null,
              link: p.link || "",
              tag: p.tag || "Pet Care"
            }));
          }
        } catch (err) {
          console.error("Failed to query posts from Supabase:", err);
        }
      }

      if (posts.length === 0) {
        try {
          if (fs.existsSync(POSTS_FILE)) {
            const localPosts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
            if (Array.isArray(localPosts)) {
              posts = localPosts.map((p: any) => ({
                ...p,
                image: p.image || p.thumbnail || null,
                link: p.link || "",
                tag: p.tag || "Pet Care"
              }));
            }
          }
        } catch { }
      }

      // Sort chronological descending (newest first)
      posts.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

      if (options?.where) {
        return posts.filter(options.where);
      }
      return posts;
    },

    async create(data: any): Promise<any> {
      const id = data.id || "post-" + Date.now();
      const date = data.date || new Date().toISOString();
      const post = { ...data, id, date };

      if (supabase) {
        try {
          const dbPost = {
            id: post.id,
            title: post.title,
            slug: post.slug,
            date: post.date,
            content: post.content,
            excerpt: post.excerpt,
            thumbnail: post.image || post.thumbnail || null,
            status: post.status || "publish",
            author: post.author || "System Admin"
          };
          await supabase.from("posts").insert(dbPost);
        } catch (err) {
          console.error("Failed to insert post in Supabase:", err);
        }
      }

      try {
        const postsDir = path.dirname(POSTS_FILE);
        if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });
        const posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8")) : [];
        posts.unshift(post);
        fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write posts locally:", err);
      }
      return post;
    },

    async update({ where, data }: { where: { id: string }, data: Partial<any> }): Promise<any> {
      let updatedPost: any = null;

      if (supabase) {
        try {
          const dbData = { ...data };
          if ('image' in dbData) {
            dbData.thumbnail = dbData.image;
            delete dbData.image;
          }
          delete dbData.link;
          delete dbData.tag;
          const { data: updated, error } = await supabase.from("posts").update(dbData).eq("id", where.id).select().single();
          if (!error && updated) {
            updatedPost = {
              ...updated,
              image: updated.image || updated.thumbnail || null,
              link: updated.link || "",
              tag: updated.tag || "Pet Care"
            };
          }
        } catch (err) {
          console.error("Failed to update post in Supabase:", err);
        }
      }

      try {
        if (fs.existsSync(POSTS_FILE)) {
          const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
          if (Array.isArray(posts)) {
            const idx = posts.findIndex(p => p.id === where.id);
            if (idx !== -1) {
              posts[idx] = { ...posts[idx], ...data };
              fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
              if (!updatedPost) {
                updatedPost = {
                  ...posts[idx],
                  image: posts[idx].image || posts[idx].thumbnail || null,
                  link: posts[idx].link || "",
                  tag: posts[idx].tag || "Pet Care"
                };
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to update post locally:", err);
      }

      if (!updatedPost) throw new Error("Post not found");
      return updatedPost;
    },

    async delete({ where }: { where: { id: string } }): Promise<boolean> {
      if (supabase) {
        try {
          await supabase.from("posts").delete().eq("id", where.id);
        } catch (err) {
          console.error("Failed to delete post from Supabase:", err);
        }
      }

      try {
        if (fs.existsSync(POSTS_FILE)) {
          const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
          if (Array.isArray(posts)) {
            const filtered = posts.filter(p => p.id !== where.id);
            fs.writeFileSync(POSTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
            return filtered.length !== posts.length;
          }
        }
      } catch { }
      return false;
    }
  }
};

// Asynchronously pull latest data from Supabase in background on boot
pullFromSupabase().catch(err => {
  console.error("Failed to run boot sync from Supabase:", err);
});
