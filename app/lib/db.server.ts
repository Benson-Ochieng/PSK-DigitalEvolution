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

export const db = {
  order: {
    async create(data: Omit<Order, 'status'> & { status?: OrderStatus }): Promise<Order> {
      const order: Order = {
        ...data,
        status: data.status || 'PENDING_PAYMENT'
      };
      if (supabase) {
        const { error } = await supabase.from("orders").insert(order);
        if (error) throw error;
      }
      
      const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      ordersList.push(order);
      writeData(ORDERS_FILE, ordersList);
      return order;
    },
    
    async findUnique({ where }: { where: { id: string } }): Promise<Order | null> {
      if (supabase) {
        const { data, error } = await supabase.from("orders").select().eq("id", where.id).maybeSingle();
        if (error) throw error;
        return data as Order | null;
      }
      const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      return ordersList.find(o => o.id === where.id) || null;
    },
    
    async findFirst({ where }: { where: (order: Order) => boolean }): Promise<Order | null> {
      if (supabase) {
        const { data, error } = await supabase.from("orders").select();
        if (error) throw error;
        return (data as Order[]).find(where) || null;
      }
      const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      return ordersList.find(where) || null;
    },

    async findMany(options?: { where?: (order: Order) => boolean }): Promise<Order[]> {
      if (supabase) {
        const { data, error } = await supabase.from("orders").select().order("date", { ascending: false });
        if (error) throw error;
        if (options?.where) {
          return (data as Order[]).filter(options.where);
        }
        return data as Order[];
      }
      const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
      if (options?.where) {
        return ordersList.filter(options.where);
      }
      return ordersList;
    },
    
    async update({ where, data }: { where: { id: string }, data: Partial<Order> }): Promise<Order> {
      if (supabase) {
        const { data: updated, error } = await supabase.from("orders").update(data).eq("id", where.id).select().single();
        if (error) throw error;
        // Also update local JSON file
        const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
        const idx = ordersList.findIndex(o => o.id === where.id);
        if (idx !== -1) {
          ordersList[idx] = updated as Order;
          writeData(ORDERS_FILE, ordersList);
        }
        return updated as Order;
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
        const { error } = await supabase.from("orders").delete().eq("id", where.id);
        if (error) throw error;
        // Also update local JSON
        const ordersList = readData<Order[]>(ORDERS_FILE, getInitialOrders());
        const filtered = ordersList.filter(o => o.id !== where.id);
        writeData(ORDERS_FILE, filtered);
        return true;
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
      } catch {}
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
        } catch {}
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
      } catch {}
      return false;
    }
  }
};

// Asynchronously pull latest data from Supabase in background on boot
pullFromSupabase().catch(err => {
  console.error("Failed to run boot sync from Supabase:", err);
});
