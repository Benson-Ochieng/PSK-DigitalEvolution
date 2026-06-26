import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually load .env variables into process.env to ensure they are available
// even if the dev server was started before they were configured.
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env variables manually:", e);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
    discountType: actualDiscountType,
    active,
    createdAt,
    ...extraData
  };
}

// Helper to sync local JSON data to Supabase
export async function syncLocalToSupabase() {
  if (!supabase) {
    console.log("Supabase not configured, skipping sync.");
    return { success: false, message: "Supabase not configured" };
  }

  const CONTENT_DIR = path.join(process.cwd(), "content");
  
  try {
    // 1. Sync Users
    const usersFile = path.join(CONTENT_DIR, "users.json");
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
      if (Array.isArray(users) && users.length > 0) {
        const { error } = await supabase.from("users").upsert(users);
        if (error) console.error("Error syncing users to Supabase:", error);
        else console.log(`Synced ${users.length} users to Supabase.`);
      }
    }

    // 2. Sync Coupons
    const couponsFile = path.join(CONTENT_DIR, "coupons.json");
    if (fs.existsSync(couponsFile)) {
      const coupons = JSON.parse(fs.readFileSync(couponsFile, "utf-8"));
      if (Array.isArray(coupons) && coupons.length > 0) {
        const serialized = coupons.map((c: any) => serializeCouponForSupabase(c));
        const { error } = await supabase.from("coupons").upsert(serialized);
        if (error) console.error("Error syncing coupons to Supabase:", error);
        else console.log(`Synced ${coupons.length} coupons to Supabase.`);
      }
    }

    // 3. Sync Orders
    const ordersFile = path.join(CONTENT_DIR, "orders.json");
    if (fs.existsSync(ordersFile)) {
      const orders = JSON.parse(fs.readFileSync(ordersFile, "utf-8"));
      if (Array.isArray(orders) && orders.length > 0) {
        const { error } = await supabase.from("dashboard_orders").upsert(orders);
        if (error) console.error("Error syncing orders to Supabase:", error);
        else console.log(`Synced ${orders.length} orders to Supabase.`);
      }
    }

    // 4. Sync Products
    const productsIndexFile = path.join(CONTENT_DIR, "products", "_index.json");
    if (fs.existsSync(productsIndexFile)) {
      const indexProducts = JSON.parse(fs.readFileSync(productsIndexFile, "utf-8"));
      if (Array.isArray(indexProducts) && indexProducts.length > 0) {
        const fullProducts = [];
        for (const summary of indexProducts) {
          const detailFile = path.join(CONTENT_DIR, "products", `${summary.slug}.json`);
          if (fs.existsSync(detailFile)) {
            try {
              const details = JSON.parse(fs.readFileSync(detailFile, "utf-8"));
              fullProducts.push({
                ...summary,
                ...details
              });
            } catch (e) {
              fullProducts.push(summary);
            }
          } else {
            fullProducts.push(summary);
          }
        }

        const cleanedProducts = fullProducts.map(p => {
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            sku: p.sku || null,
            onSale: !!p.onSale,
            price: Number(p.price || 0),
            regularPrice: Number(p.regularPrice || 0),
            salePrice: p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : null,
            currency: p.currency || "KES",
            currencySymbol: p.currencySymbol || "KSh",
            thumbnail: p.thumbnail || null,
            categories: Array.isArray(p.categories) ? p.categories : [],
            inStock: !!p.inStock,
            averageRating: Number(p.averageRating || 0),
            reviewCount: Number(p.reviewCount || 0),
            type: p.type || "simple",
            permalink: p.permalink || null,
            shortDescription: p.shortDescription || null,
            description: p.description || null,
            images: Array.isArray(p.images) ? p.images : [],
            tags: Array.isArray(p.tags) ? p.tags : [],
            brands: Array.isArray(p.brands) ? p.brands : [],
            stockStatus: p.stockStatus || "instock",
            lowStockRemaining: p.lowStockRemaining !== undefined && p.lowStockRemaining !== null ? Number(p.lowStockRemaining) : null,
            isPurchasable: p.isPurchasable !== undefined ? !!p.isPurchasable : true,
            addToCartUrl: p.addToCartUrl || null,
            status: p.status || "publish",
            featured: !!p.featured,
            catalogVisibility: p.catalogVisibility || "visible",
            dateCreated: p.dateCreated || p.createdAt || null,
            dateModified: p.dateModified || null
          };
        });

        const { error } = await supabase.from("products").upsert(cleanedProducts);
        if (error) console.error("Error syncing products to Supabase:", error);
        else console.log(`Synced ${cleanedProducts.length} products to Supabase.`);
      }
    }

    // 5. Sync Blog Posts
    const postsFile = path.join(CONTENT_DIR, "posts", "_index.json");
    if (fs.existsSync(postsFile)) {
      try {
        const posts = JSON.parse(fs.readFileSync(postsFile, "utf-8"));
        if (Array.isArray(posts) && posts.length > 0) {
          const cleanedPosts = posts.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            date: p.date,
            content: p.content,
            excerpt: p.excerpt,
            thumbnail: p.image || p.thumbnail || null,
            status: p.status || "publish",
            author: p.author || "System Admin"
          }));
          const { error } = await supabase.from("posts").upsert(cleanedPosts);
          if (error) console.error("Error syncing posts to Supabase:", error);
          else console.log(`Synced ${cleanedPosts.length} posts to Supabase.`);
        }
      } catch (e) {
        console.error("Failed to parse/sync posts file:", e);
      }
    }

    return { success: true, message: "Sync complete" };
  } catch (error) {
    console.error("Failed to run data sync to Supabase:", error);
    return { success: false, error };
  }
}

// Helper to pull data from Supabase to local JSON
export async function pullFromSupabase() {
  if (!supabase) {
    console.log("Supabase not configured, skipping pull.");
    return { success: false, message: "Supabase not configured" };
  }

  const CONTENT_DIR = path.join(process.cwd(), "content");
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  try {
    console.log("Starting data pull from Supabase...");

    // 1. Pull Users
    const { data: users, error: usersErr } = await supabase.from("users").select();
    if (usersErr) {
      console.error("Error pulling users from Supabase:", usersErr);
    } else if (users && users.length > 0) {
      fs.writeFileSync(path.join(CONTENT_DIR, "users.json"), JSON.stringify(users, null, 2), "utf-8");
      console.log(`Pulled ${users.length} users from Supabase.`);
    }

    // 2. Pull Coupons
    const { data: coupons, error: couponsErr } = await supabase.from("coupons").select();
    if (couponsErr) {
      console.error("Error pulling coupons from Supabase:", couponsErr);
    } else if (coupons && coupons.length > 0) {
      const cleanCoupons = coupons.map((c: any) => deserializeCouponFromSupabase(c));
      fs.writeFileSync(path.join(CONTENT_DIR, "coupons.json"), JSON.stringify(cleanCoupons, null, 2), "utf-8");
      console.log(`Pulled ${coupons.length} coupons from Supabase.`);
    }

    // 3. Pull Orders
    const { data: orders, error: ordersErr } = await supabase.from("dashboard_orders").select();
    if (ordersErr) {
      console.error("Error pulling orders from Supabase:", ordersErr);
      // Suppress/bypass fatal errors during boot sync if table has not populated yet
    } else if (orders && orders.length > 0) {
      const { data: orderItems } = await supabase.from("order_items").select();
      const { ensureOrderFormat } = await import("./db.server");
      const cleanOrders = orders.map((o: any) => ensureOrderFormat(o, orderItems || []));
      fs.writeFileSync(path.join(CONTENT_DIR, "orders.json"), JSON.stringify(cleanOrders, null, 2), "utf-8");
      console.log(`Pulled ${cleanOrders.length} orders from Supabase.`);
    }

    // 4. Pull Products
    const { data: products, error: productsErr } = await supabase.from("products").select();
    if (productsErr) {
      console.error("Error pulling products from Supabase:", productsErr);
    } else if (products && products.length > 0) {
      const productsDir = path.join(CONTENT_DIR, "products");
      fs.mkdirSync(productsDir, { recursive: true });

      const indexProducts = products.map((p: any) => {
        return {
          id: Number(p.id),
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          regularPrice: Number(p.regularPrice),
          salePrice: p.salePrice !== null ? Number(p.salePrice) : null,
          price: Number(p.price),
          onSale: !!p.onSale,
          inStock: !!p.inStock,
          thumbnail: p.thumbnail,
          categories: p.categories || [],
          brands: p.brands || [],
          tags: p.tags || [],
          status: p.status || "publish",
          dateCreated: p.dateCreated,
          dateModified: p.dateModified
        };
      });
      fs.writeFileSync(path.join(productsDir, "_index.json"), JSON.stringify(indexProducts, null, 2), "utf-8");

      for (const p of products) {
        const detail = {
          id: Number(p.id),
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          onSale: !!p.onSale,
          price: Number(p.price),
          regularPrice: Number(p.regularPrice),
          salePrice: p.salePrice !== null ? Number(p.salePrice) : null,
          currency: p.currency || "KES",
          currencySymbol: p.currencySymbol || "KSh",
          thumbnail: p.thumbnail,
          categories: p.categories || [],
          inStock: !!p.inStock,
          averageRating: Number(p.averageRating || 0),
          reviewCount: Number(p.reviewCount || 0),
          type: p.type || "simple",
          permalink: p.permalink,
          shortDescription: p.shortDescription,
          description: p.description,
          images: p.images || [],
          tags: p.tags || [],
          brands: p.brands || [],
          stockStatus: p.stockStatus || "instock",
          lowStockRemaining: p.lowStockRemaining !== null ? Number(p.lowStockRemaining) : null,
          isPurchasable: p.isPurchasable !== undefined ? !!p.isPurchasable : true,
          addToCartUrl: p.addToCartUrl,
          status: p.status || "publish",
          featured: !!p.featured,
          catalogVisibility: p.catalogVisibility || "visible",
          dateCreated: p.dateCreated,
          dateModified: p.dateModified
        };
        fs.writeFileSync(path.join(productsDir, `${p.slug}.json`), JSON.stringify(detail, null, 2), "utf-8");
      }
      console.log(`Pulled ${products.length} products from Supabase and generated files.`);
    }

    // 5. Pull Blog Posts
    try {
      const { data: posts, error: postsErr } = await supabase.from("posts").select();
      if (postsErr) {
        console.error("Error pulling posts from Supabase:", postsErr);
      } else if (posts && posts.length > 0) {
        const postsDir = path.join(CONTENT_DIR, "posts");
        fs.mkdirSync(postsDir, { recursive: true });
        const mappedPosts = posts.map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          date: p.date,
          content: p.content,
          excerpt: p.excerpt,
          image: p.image || p.thumbnail || null,
          link: p.link || "",
          tag: p.tag || "Pet Care",
          status: p.status || "publish",
          author: p.author || "System Admin"
        }));
        fs.writeFileSync(path.join(postsDir, "_index.json"), JSON.stringify(mappedPosts, null, 2), "utf-8");
        console.log(`Pulled ${mappedPosts.length} posts from Supabase and generated files.`);
      }
    } catch (e) {
      console.error("Failed to pull posts from Supabase:", e);
    }

    return { success: true, message: "Pull complete" };
  } catch (error) {
    console.error("Failed to run data pull from Supabase:", error);
    return { success: false, error };
  }
}

// Single-item product helpers to keep Supabase updated instantly on write
export async function upsertProductToSupabase(p: any) {
  if (!supabase) return;
  try {
    const cleaned = {
      id: Number(p.id),
      name: p.name,
      slug: p.slug,
      sku: p.sku || null,
      onSale: !!p.onSale,
      price: Number(p.price || 0),
      regularPrice: Number(p.regularPrice || 0),
      salePrice: p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : null,
      currency: p.currency || "KES",
      currencySymbol: p.currencySymbol || "KSh",
      thumbnail: p.thumbnail || null,
      categories: Array.isArray(p.categories) ? p.categories : [],
      inStock: !!p.inStock,
      averageRating: Number(p.averageRating || 0),
      reviewCount: Number(p.reviewCount || 0),
      type: p.type || "simple",
      permalink: p.permalink || null,
      shortDescription: p.shortDescription || null,
      description: p.description || null,
      images: Array.isArray(p.images) ? p.images : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
      brands: Array.isArray(p.brands) ? p.brands : [],
      stockStatus: p.stockStatus || "instock",
      lowStockRemaining: p.lowStockRemaining !== undefined && p.lowStockRemaining !== null ? Number(p.lowStockRemaining) : null,
      isPurchasable: p.isPurchasable !== undefined ? !!p.isPurchasable : true,
      addToCartUrl: p.addToCartUrl || null,
      status: p.status || "publish",
      featured: !!p.featured,
      catalogVisibility: p.catalogVisibility || "visible",
      dateCreated: p.dateCreated || p.createdAt || null,
      dateModified: p.dateModified || new Date().toISOString()
    };
    const { error } = await supabase.from("products").upsert(cleaned);
    if (error) console.error("Error upserting product to Supabase:", error);
  } catch (err) {
    console.error("Failed to upsert product:", err);
  }
}

export async function deleteProductFromSupabase(id: number) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) console.error("Error deleting product from Supabase:", error);
  } catch (err) {
    console.error("Failed to delete product:", err);
  }
}
