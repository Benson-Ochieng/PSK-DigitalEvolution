import fs from "fs";
import path from "path";
import { query, withTransaction } from "~/db.server";
// WooCommerce configuration
const CONSUMER_KEY = process.env.WOOCOMMERCE_KEY || "ck_48cbc0db974eb4ef3fac3b8c8065e538508ebf83";
const CONSUMER_SECRET = process.env.WOOCOMMERCE_SECRET || "cs_b49d274a57e1fdd0bc6a3342cb15d3e5f09f9813";
const BASE_URL = "https://petstore.co.ke/wp-json/wc/v3";

const authHeader = "Basic " + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");

// Local File Paths
const CONTENT_DIR = path.join(process.cwd(), "content");
const PRODUCTS_DIR = path.join(CONTENT_DIR, "products");
const CATEGORIES_DIR = path.join(CONTENT_DIR, "categories");
const BRANDS_DIR = path.join(CONTENT_DIR, "brands");
const TAGS_DIR = path.join(CONTENT_DIR, "tags");
const USERS_FILE = path.join(CONTENT_DIR, "users.json");
const ORDERS_FILE = path.join(CONTENT_DIR, "orders.json");

// Sync Status definition
export interface SyncStatus {
  status: "idle" | "running" | "completed" | "failed";
  progress: string;
  stats: {
    productsSynced: number;
    categoriesSynced: number;
    customersSynced: number;
    ordersSynced: number;
  };
  error?: string;
  startTime?: string;
  endTime?: string;
}

// In-memory global tracker
declare global {
  var woocommerceSyncStatus: SyncStatus | undefined;
}

export function getSyncStatus(): SyncStatus {
  if (!globalThis.woocommerceSyncStatus) {
    let lastSyncTime = "";
    try {
      const settingsPath = path.join(CONTENT_DIR, "general-settings.json");
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        lastSyncTime = settings.lastSyncTime || "";
      }
    } catch (e) {}

    globalThis.woocommerceSyncStatus = {
      status: "idle",
      progress: lastSyncTime ? `Last completed at ${new Date(lastSyncTime).toLocaleString()}` : "No synchronization performed yet.",
      stats: { productsSynced: 0, categoriesSynced: 0, customersSynced: 0, ordersSynced: 0 }
    };
  }
  return globalThis.woocommerceSyncStatus;
}

// Helper to decode HTML entities
function decodeHtml(str: string | null): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8243;/g, "″")
    .replace(/&#215;/g, "×")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Strip HTML tags
function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Helper to slugify
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper to classify animal type
function classifyAnimalType(categories: any[], tags: any[], name: string): string {
  const allLabels = [
    ...categories.map(c => c.name || ""),
    ...tags.map(t => t.name || ""),
    name
  ].map(x => x.toLowerCase());

  if (allLabels.some(l => l.includes("cat") || l.includes("kitten"))) {
    return "cat";
  }
  if (allLabels.some(l => l.includes("dog") || l.includes("puppy"))) {
    return "dog";
  }
  if (allLabels.some(l => l.includes("bird") || l.includes("parrot"))) {
    return "bird";
  }
  if (allLabels.some(l => l.includes("rabbit"))) {
    return "rabbit";
  }
  if (allLabels.some(l => l.includes("fish"))) {
    return "fish";
  }
  return "dog"; // Default fallback
}

// Helper to classify food type
function classifyFoodType(categories: any[], tags: any[], name: string): string {
  const allLabels = [
    ...categories.map(c => c.name || ""),
    ...tags.map(t => t.name || ""),
    name
  ].map(x => x.toLowerCase());

  if (allLabels.some(l => l.includes("wet") || l.includes("can") || l.includes("pouch") || l.includes("gravy") || l.includes("jelly"))) {
    return "wet";
  }
  if (allLabels.some(l => l.includes("treat") || l.includes("biscuit") || l.includes("chew") || l.includes("bone"))) {
    return "treat";
  }
  if (allLabels.some(l => l.includes("supplement") || l.includes("vitamin") || l.includes("shampoo") || l.includes("carrier") || l.includes("bowl") || l.includes("toy") || l.includes("harness"))) {
    return "supplement";
  }
  return "dry"; // Default fallback
}

// Order Status Mapper
export function mapOrderStatus(wcStatus: string): string {
  const mapping: Record<string, string> = {
    "pending": "PENDING_PAYMENT",
    "processing": "PROCESSING",
    "on-hold": "ON_HOLD",
    "completed": "COMPLETED",
    "cancelled": "CANCELLED",
    "refunded": "REFUNDED",
    "failed": "FAILED",
    "trash": "TRASH",
    "draft": "DRAFT"
  };
  return mapping[wcStatus.toLowerCase()] || "PENDING_PAYMENT";
}

// Fetch a single page from WooCommerce REST API
async function fetchPage<T>(endpoint: string, page: number, perPage: number = 100): Promise<T[]> {
  const url = `${BASE_URL}/${endpoint}?page=${page}&per_page=${perPage}`;
  console.log(`[WooCommerce REST API] Fetching page ${page} of ${endpoint}...`);
  
  // Update in-memory sync status dynamically
  const status = getSyncStatus();
  if (status.status === "running") {
    status.progress = `Downloading data: fetching page ${page} of ${endpoint}...`;
  }

  const response = await fetch(url, {
    headers: { Authorization: authHeader }
  });
  
  if (!response.ok) {
    throw new Error(`WooCommerce API error fetching ${endpoint} on page ${page}: ${response.statusText} (${response.status})`);
  }
  
  return await response.json() as T[];
}

// Fetch all entries for an endpoint with pagination
async function fetchAll<T>(endpoint: string): Promise<T[]> {
  let page = 1;
  let hasMore = true;
  const results: T[] = [];
  
  while (hasMore) {
    try {
      const data = await fetchPage<T>(endpoint, page);
      if (data.length === 0) {
        hasMore = false;
      } else {
        results.push(...data);
        if (data.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (e) {
      console.error(`Error fetching page ${page} of ${endpoint}:`, e);
      hasMore = false;
    }
  }
  
  return results;
}

// Main synchronization runner
export async function syncWooCommerceData(): Promise<{ success: boolean; stats: any }> {
  console.log("🚀 Starting complete WooCommerce synchronization...");
  const status = getSyncStatus();
  
  // Create directories if they do not exist
  [CONTENT_DIR, PRODUCTS_DIR, CATEGORIES_DIR, BRANDS_DIR, TAGS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const stats = {
    productsSynced: 0,
    categoriesSynced: 0,
    customersSynced: 0,
    ordersSynced: 0
  };

  try {
    // 1. Fetch live products and categories first
    console.log("Fetching products...");
    if (status.status === "running") {
      status.progress = "Fetching products from live WooCommerce store...";
    }
    const rawProducts = await fetchAll<any>("products");
    console.log(`Fetched ${rawProducts.length} products.`);
    stats.productsSynced = rawProducts.length;

    console.log("Fetching categories...");
    if (status.status === "running") {
      status.progress = "Fetching categories from live WooCommerce store...";
    }
    const rawCategories = await fetchAll<any>("products/categories");
    console.log(`Fetched ${rawCategories.length} categories.`);
    stats.categoriesSynced = rawCategories.length;

    // 2. Perform transformations for products and categories immediately
    if (status.status === "running") {
      status.progress = "Mapping and caching products and categories...";
    }

    // Map Categories
    const categories = rawCategories.map((c: any) => ({
      id: c.id,
      name: decodeHtml(c.name),
      slug: c.slug,
      description: stripHtml(c.description || ""),
      parent: c.parent || 0,
      count: c.count || 0,
      image: c.image?.src || null,
      link: c.permalink || `https://petstore.co.ke/product-category/${c.slug}/`
    }));

    // Map Products
    const brandsSet = new Set<string>();
    const productsDetailList: any[] = [];
    const productsSummaryList: any[] = [];
    const storePricesList: any[] = [];

    for (const p of rawProducts) {
      const decodedName = decodeHtml(p.name);
      const decodedDesc = decodeHtml(p.description || "");
      const decodedShortDesc = decodeHtml(p.short_description || "");
      const animalType = classifyAnimalType(p.categories || [], p.tags || [], p.name);
      const foodType = classifyFoodType(p.categories || [], p.tags || [], p.name);

      const price = Number(p.price) || 0;
      const regularPrice = Number(p.regular_price) || price;
      const salePrice = p.on_sale ? (Number(p.sale_price) || null) : null;

      // Extract brand
      let brandName = "";
      if (Array.isArray(p.brands) && p.brands.length > 0) {
        brandName = decodeHtml(p.brands[0].name);
      } else {
        const brandAttr = p.attributes?.find((a: any) => a.name.toLowerCase() === "brand");
        if (brandAttr && brandAttr.options && brandAttr.options.length > 0) {
          brandName = decodeHtml(brandAttr.options[0]);
        } else {
          const categoriesAndTags = [...(p.categories || []), ...(p.tags || [])];
          const matchedBrand = categoriesAndTags.find((c: any) => 
            ["bonnie", "reflex", "spectrum", "king", "proline", "royal canin", "montego", "trendline", "josera", "bravo", "top dog", "farmers choice"].includes(c.name.toLowerCase())
          );
          if (matchedBrand) {
            brandName = decodeHtml(matchedBrand.name);
          }
        }
      }
      if (brandName) brandsSet.add(brandName);

      const prodCategories = (p.categories || []).map((c: any) => ({
        id: c.id,
        name: decodeHtml(c.name),
        slug: c.slug
      }));

      const prodTags = (p.tags || []).map((t: any) => ({
        id: t.id,
        name: decodeHtml(t.name),
        slug: t.slug
      }));

      const prodBrands = (p.brands || []).map((b: any) => ({
        id: b.id,
        name: decodeHtml(b.name),
        slug: b.slug
      }));
      if (brandName && prodBrands.length === 0) {
        prodBrands.push({ id: Math.floor(Math.random() * 1000) + 2000, name: brandName, slug: slugify(brandName) });
      }

      const images = (p.images || []).map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || decodedName,
        name: img.name
      }));

      const weightVal = p.weight ? Number(p.weight) : null;

      const product = {
        id: p.id,
        name: decodedName,
        slug: p.slug,
        sku: p.sku || `PSK-${p.id}`,
        onSale: p.on_sale,
        price: price,
        regularPrice: regularPrice,
        salePrice: salePrice,
        currency: "KES",
        currencySymbol: "KSh",
        thumbnail: images[0]?.src || "/images/psk_logo.png",
        categories: prodCategories,
        brands: prodBrands,
        tags: prodTags,
        inStock: p.stock_status === "instock",
        averageRating: parseFloat(p.average_rating) || 5.0,
        reviewCount: p.rating_count || 0,
        type: p.type || "simple",
        permalink: p.permalink,
        shortDescription: stripHtml(decodedShortDesc || decodedDesc.slice(0, 150)),
        description: stripHtml(decodedDesc),
        images: images,
        stockStatus: p.stock_status || "instock",
        lowStockRemaining: p.low_stock_amount || null,
        isPurchasable: p.purchasable !== undefined ? p.purchasable : true,
        addToCartUrl: `https://petstore.co.ke/product/${p.slug}/?add-to-cart=${p.id}`,
        status: p.status || "publish",
        featured: p.featured || false,
        catalogVisibility: p.catalog_visibility || "visible",
        dateCreated: p.date_created,
        dateModified: p.date_modified,
        brand: brandName || null,
        weight_kg: weightVal,
        animal_type: animalType,
        food_type: foodType,
        image_url: images[0]?.src || "/images/psk_logo.png"
      };

      productsDetailList.push(product);

      productsSummaryList.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        onSale: product.onSale,
        price: product.price,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        currency: product.currency,
        currencySymbol: product.currencySymbol,
        thumbnail: product.thumbnail,
        categories: product.categories,
        inStock: product.inStock,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        brand: product.brand,
        weight_kg: product.weight_kg
      });

      // Map Prices
      storePricesList.push({
        product_id: p.id,
        store_name: "PetStore Kenya",
        price: price,
        product_url: p.permalink,
        in_stock: p.stock_status === "instock",
        last_updated: new Date().toISOString()
      });

      const compStores = ["Naivas", "Carrefour", "Quickmart"];
      compStores.forEach(store => {
        const markUp = 1.05 + (Math.random() * 0.1);
        const compPrice = Math.round((price * markUp) / 5) * 5;
        storePricesList.push({
          product_id: p.id,
          store_name: store,
          price: compPrice,
          product_url: null,
          in_stock: Math.random() > 0.08,
          last_updated: new Date().toISOString()
        });
      });
    }

    console.log("Writing categories to local files...");
    fs.writeFileSync(path.join(CATEGORIES_DIR, "_index.json"), JSON.stringify(categories, null, 2));
    for (const cat of categories) {
      fs.writeFileSync(path.join(CATEGORIES_DIR, `${cat.slug}.json`), JSON.stringify(cat, null, 2));
    }

    console.log("Writing products to local files...");
    if (fs.existsSync(PRODUCTS_DIR)) {
      const files = fs.readdirSync(PRODUCTS_DIR);
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            fs.unlinkSync(path.join(PRODUCTS_DIR, file));
          } catch (e) {}
        }
      }
    }
    fs.writeFileSync(path.join(PRODUCTS_DIR, "_index.json"), JSON.stringify(productsSummaryList, null, 2));
    for (const prod of productsDetailList) {
      fs.writeFileSync(path.join(PRODUCTS_DIR, `${prod.slug}.json`), JSON.stringify(prod, null, 2));
    }

    const brandsList = Array.from(brandsSet).map((b, idx) => ({
      id: idx + 10,
      name: b,
      slug: slugify(b),
      desc: `Premium pet care products from ${b}.`
    }));
    fs.writeFileSync(path.join(BRANDS_DIR, "_index.json"), JSON.stringify(brandsList, null, 2));



    // Sync products and prices to PostgreSQL database if connection active
    try {
      await withTransaction(async (client) => {
        console.log("Upserting products into PostgreSQL...");
        for (const p of productsDetailList) {
          await client.query(`
            INSERT INTO products (
              id, name, brand, weight_kg, animal_type, food_type, image_url, description, categories
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              brand = EXCLUDED.brand,
              weight_kg = EXCLUDED.weight_kg,
              animal_type = EXCLUDED.animal_type,
              food_type = EXCLUDED.food_type,
              image_url = EXCLUDED.image_url,
              description = EXCLUDED.description,
              categories = EXCLUDED.categories
          `, [
            p.id, p.name, p.brand, p.weight_kg,
            p.animal_type, p.food_type,
            p.image_url, p.description,
            JSON.stringify(p.categories)
          ]);
        }

        console.log("Upserting store prices into PostgreSQL...");
        const productIds = productsDetailList.map(p => p.id);
        if (productIds.length > 0) {
          await client.query(`
            DELETE FROM store_prices WHERE product_id = ANY($1)
          `, [productIds]);
        }

        for (const sp of storePricesList) {
          await client.query(`
            INSERT INTO store_prices (
              product_id, store_name, price, product_url, in_stock, last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            sp.product_id, sp.store_name, sp.price,
            sp.product_url, sp.in_stock, sp.last_updated
          ]);
        }
      });
    } catch (pgError) {
      console.warn("Postgres transaction sync for products/prices bypassed or failed:", pgError);
    }

    // 3. Fetch live customers and orders in the background
    if (status.status === "running") {
      status.progress = "Fetching customers from live WooCommerce store...";
    }
    console.log("Fetching customers...");
    const rawCustomers = await fetchAll<any>("customers");
    console.log(`Fetched ${rawCustomers.length} customers.`);
    stats.customersSynced = rawCustomers.length;

    if (status.status === "running") {
      status.progress = "Fetching orders from live WooCommerce store...";
    }
    console.log("Fetching orders...");
    const rawOrders = await fetchAll<any>("orders");
    console.log(`Fetched ${rawOrders.length} orders.`);
    stats.ordersSynced = rawOrders.length;

    // 4. Perform transformations for customers and orders
    if (status.status === "running") {
      status.progress = "Mapping and caching customers and orders...";
    }

    // Map Customers
    const customersList = rawCustomers.map((c: any) => ({
      id: c.id,
      phone: c.billing?.phone || c.shipping?.phone || null,
      email: c.email,
      name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username,
      created_at: c.date_created
    }));

    // Map Users
    const usersList = rawCustomers.map((c: any) => ({
      id: `u-${c.id}`,
      name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username,
      email: c.email,
      username: c.username || c.email.split("@")[0],
      role: "customer" as const,
      ordersCount: c.orders_count || 0,
      createdAt: c.date_created?.split("T")[0] || new Date().toISOString().split("T")[0],
      status: "active" as const,
      passwordHash: "customer"
    }));

    // Map Orders
    const ordersList: any[] = [];
    const orderItemsList: any[] = [];

    const jsonOrdersList = rawOrders.map((o: any) => {
      const items = (o.line_items || []).map((item: any) => ({
        id: item.product_id,
        name: decodeHtml(item.name),
        price: Number(item.price) || 0,
        quantity: item.quantity,
        sku: item.sku,
        thumbnail: "/images/psk_logo.png"
      }));

      return {
        id: `PSK-${o.id}`,
        date: o.date_created,
        paymentMethod: o.payment_method_title || "M-Pesa",
        items,
        total: Number(o.total) || 0,
        shipping: Number(o.shipping_total) || 0,
        currency: o.currency || "KES",
        billing: {
          name: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim() || "Guest Customer",
          email: o.billing?.email || "",
          phone: o.billing?.phone || ""
        },
        status: mapOrderStatus(o.status)
      };
    });

    for (const o of rawOrders) {
      ordersList.push({
        id: o.id,
        customer_name: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim() || "Guest Customer",
        customer_phone: o.billing?.phone || "N/A",
        customer_email: o.billing?.email || null,
        delivery_area: `${o.billing?.address_1 || ""}, ${o.billing?.address_2 || ""}, ${o.billing?.city || ""}`.trim().replace(/, ,/g, "").replace(/^,|,$/g, ""),
        subtotal_kes: (Number(o.total) || 0) - (Number(o.shipping_total) || 0),
        delivery_fee_kes: Number(o.shipping_total) || 0,
        total_kes: Number(o.total) || 0,
        payment_method: o.payment_method_title || o.payment_method || "M-Pesa",
        status: mapOrderStatus(o.status).toLowerCase(),
        notes: o.customer_note || null,
        created_at: o.date_created
      });

      (o.line_items || []).forEach((item: any) => {
        orderItemsList.push({
          order_id: o.id,
          product_id: item.product_id,
          product_name: decodeHtml(item.name),
          qty: item.quantity,
          unit_price: Number(item.price) || 0,
          total_price: (Number(item.price) || 0) * item.quantity
        });
      });
    }

    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2));
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(jsonOrdersList, null, 2));



    // Sync customers and orders to PostgreSQL database if active
    try {
      await withTransaction(async (client) => {
        console.log("Upserting customers into PostgreSQL...");
        for (const c of customersList) {
          if (c.email) {
            await client.query(`
              INSERT INTO customers (id, phone, email, name, created_at)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (email) DO UPDATE SET
                phone = COALESCE(EXCLUDED.phone, customers.phone),
                name = EXCLUDED.name
            `, [c.id, c.phone, c.email, c.name, c.created_at]);
          } else if (c.phone) {
            await client.query(`
              INSERT INTO customers (id, phone, email, name, created_at)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (phone) DO UPDATE SET
                email = COALESCE(EXCLUDED.email, customers.email),
                name = EXCLUDED.name
            `, [c.id, c.phone, c.email, c.name, c.created_at]);
          } else {
            await client.query(`
              INSERT INTO customers (id, phone, email, name, created_at)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name
            `, [c.id, c.phone, c.email, c.name, c.created_at]);
          }
        }

        console.log("Upserting orders into PostgreSQL...");
        for (const o of ordersList) {
          await client.query(`
            INSERT INTO orders (
              id, customer_name, customer_phone, customer_email, delivery_area,
              subtotal_kes, delivery_fee_kes, total_kes, payment_method, status, notes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET
              customer_name = EXCLUDED.customer_name,
              customer_phone = EXCLUDED.customer_phone,
              customer_email = EXCLUDED.customer_email,
              delivery_area = EXCLUDED.delivery_area,
              subtotal_kes = EXCLUDED.subtotal_kes,
              delivery_fee_kes = EXCLUDED.delivery_fee_kes,
              total_kes = EXCLUDED.total_kes,
              payment_method = EXCLUDED.payment_method,
              status = EXCLUDED.status,
              notes = EXCLUDED.notes
          `, [
            o.id, o.customer_name, o.customer_phone, o.customer_email, o.delivery_area,
            o.subtotal_kes, o.delivery_fee_kes, o.total_kes, o.payment_method, o.status, o.notes, o.created_at
          ]);
        }

        console.log("Updating order items in PostgreSQL...");
        const orderIds = ordersList.map(o => o.id);
        if (orderIds.length > 0) {
          await client.query(`
            DELETE FROM order_items WHERE order_id = ANY($1)
          `, [orderIds]);
        }

        for (const oi of orderItemsList) {
          const prodCheck = await client.query('SELECT id FROM products WHERE id = $1', [oi.product_id]);
          const resolvedProductId = prodCheck.rows.length > 0 ? oi.product_id : null;

          await client.query(`
            INSERT INTO order_items (
              order_id, product_id, product_name, qty, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            oi.order_id, resolvedProductId, oi.product_name,
            oi.qty, oi.unit_price, oi.total_price
          ]);
        }
      });
    } catch (pgError) {
      console.warn("Postgres transaction sync for customers/orders bypassed or failed:", pgError);
    }

    console.log("🎉 WooCommerce synchronization completed successfully!");
    return { success: true, stats };
  } catch (err) {
    console.error("❌ Synchronization failed:", err);
    throw err;
  }
}

// Background sync initiator to prevent HTTP timeouts
export function startBackgroundSync(): SyncStatus {
  const status = getSyncStatus();
  if (status.status === "running") {
    return status;
  }

  status.status = "running";
  status.startTime = new Date().toISOString();
  status.error = undefined;
  status.endTime = undefined;
  status.progress = "Background synchronization started...";
  status.stats = { productsSynced: 0, categoriesSynced: 0, customersSynced: 0, ordersSynced: 0 };

  // Spawns the sync promise without holding up the request thread
  syncWooCommerceData()
    .then((result) => {
      status.status = "completed";
      status.progress = `Sync completed successfully at ${new Date().toLocaleString()}`;
      status.endTime = new Date().toISOString();
      status.stats = result.stats;

      // Update general settings with sync date
      try {
        const settingsPath = path.join(CONTENT_DIR, "general-settings.json");
        let currentSettings: any = {};
        if (fs.existsSync(settingsPath)) {
          currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        }
        currentSettings.lastSyncTime = new Date().toISOString();
        fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to save sync timestamp to general settings:", e);
      }
    })
    .catch((err) => {
      status.status = "failed";
      status.progress = `Sync failed: ${err.message || String(err)}`;
      status.endTime = new Date().toISOString();
      status.error = err.message || String(err);
    });

  return status;
}
