import fs from "fs";
import path from "path";
import type { ProductSummary, Product, Category, SiteMeta } from "./types";
import { isSearchMatch } from "./utils";

// Re-export types and utils so existing `~/lib/content.server` imports still work
export type { ProductSummary, Product, Category, SiteMeta } from "./types";
export { formatPrice } from "./utils";

const CONTENT_DIR = path.join(process.cwd(), "content");

function decode(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#8243;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#215;/g, "×")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "");
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getPathSlug(value: string): string {
  if (!value) return "";
  const decodedValue = safeDecodeURIComponent(value).trim();
  try {
    const pathname = new URL(decodedValue, "https://petstore.local").pathname;
    return pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop() || "";
  } catch {
    return decodedValue.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop() || "";
  }
}

function normalizeProductSlugCandidate(value: string): string {
  if (!value) return "";
  return decode(getPathSlug(value))
    .toLowerCase()
    .replace(/["'`’‘“”″]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readJson<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function decodeProduct<T extends { name: string; shortDescription?: string }>(p: T): T {
  return { ...p, name: decode(p.name), shortDescription: p.shortDescription ? decode(p.shortDescription) : "" };
}

export function getAllProducts(includeTrash = false): ProductSummary[] {
  const data = readJson<ProductSummary[]>(path.join(CONTENT_DIR, "products", "_index.json"));
  let products = (data || []).map((p) => ({ ...p, name: decode(p.name) }));
  if (!includeTrash) {
    products = products.filter((p) => p.status !== "trash");
  }
  return products.sort((a, b) => {
    const timeA = new Date(a.dateModified || a.dateCreated || 0).getTime();
    const timeB = new Date(b.dateModified || b.dateCreated || 0).getTime();
    return timeB - timeA;
  });
}

export function getProduct(slug: string): Product | null {
  const data = readJson<Product>(path.join(CONTENT_DIR, "products", `${slug}.json`));
  if (data) return decodeProduct(data) as Product;

  const requestedSlug = normalizeProductSlugCandidate(slug);
  if (!requestedSlug) return null;

  for (const summary of getAllProducts(true)) {
    const directCandidates = [summary.slug, summary.name]
      .map(normalizeProductSlugCandidate)
      .filter(Boolean);

    if (directCandidates.includes(requestedSlug)) {
      const matched = readJson<Product>(path.join(CONTENT_DIR, "products", `${summary.slug}.json`));
      if (matched) return decodeProduct(matched) as Product;
      continue;
    }

    const fullProduct = readJson<Product>(path.join(CONTENT_DIR, "products", `${summary.slug}.json`));
    if (!fullProduct) continue;

    const legacyCandidates = [fullProduct.permalink, fullProduct.addToCartUrl]
      .map(normalizeProductSlugCandidate)
      .filter(Boolean);

    if (legacyCandidates.includes(requestedSlug)) {
      return decodeProduct(fullProduct) as Product;
    }
  }

  return null;
}

export function getAllCategories(showAll = false): Category[] {
  const data = readJson<Category[]>(path.join(CONTENT_DIR, "categories", "_index.json"));
  const categories = (data || []).map((c) => ({ ...c, name: decode(c.name) }));

  // Dynamically count products in each category from the index
  let products = getAllProducts(showAll);
  if (!showAll) {
    products = products.filter((p) => (p.status || "publish") === "publish");
  }
  const catCountMap = new Map<string, number>();
  for (const p of products) {
    if (p.categories) {
      for (const cat of p.categories) {
        catCountMap.set(cat.slug, (catCountMap.get(cat.slug) || 0) + 1);
      }
    }
  }

  for (const c of categories) {
    c.count = catCountMap.get(c.slug) || 0;
  }

  return categories;
}

export function getAllBrands(showAll = false): { name: string; slug: string; count: number; desc: string }[] {
  const filePath = path.join(CONTENT_DIR, "brands", "_index.json");
  let brands: any[] = [];
  if (fs.existsSync(filePath)) {
    brands = readJson<any[]>(filePath) || [];
  } else {
    brands = [
      { name: "PetStore Kenya", slug: "petstore-kenya", desc: "Kenya's leading online pet store for premium foods, accessories, toys, and pet care products." },
      { name: "Apex Piping", slug: "apex-piping", desc: "Premium partner brand for piping systems and building materials." },
      { name: "Samsung", slug: "samsung", desc: "Global technology brand for mobile devices and smart monitors." },
      { name: "LG", slug: "lg", desc: "Guest electronics brand for select appliances." },
    ];
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(brands, null, 2), "utf-8");
  }

  // Count products for each brand
  let products = getAllProducts(showAll);
  if (!showAll) {
    products = products.filter((p) => (p.status || "publish") === "publish");
  }
  const brandCountMap = new Map<string, number>();
  for (const p of products) {
    const pBrands = (p as any).brands || [];
    for (const b of pBrands) {
      let bSlug = "";
      if (typeof b === "string") {
        bSlug = b.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      } else if (b && typeof b === "object") {
        bSlug = b.slug || "";
      }
      if (bSlug) {
        brandCountMap.set(bSlug, (brandCountMap.get(bSlug) || 0) + 1);
      }
    }
  }

  return brands.map(b => ({
    ...b,
    count: brandCountMap.get(b.slug) || 0
  }));
}

export function saveAllBrands(brands: any[]) {
  const filePath = path.join(CONTENT_DIR, "brands", "_index.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(brands, null, 2), "utf-8");
}

export function getAllTags(showAll = false): { name: string; slug: string; count: number; desc: string }[] {
  const filePath = path.join(CONTENT_DIR, "tags", "_index.json");
  let tags: any[] = [];
  if (fs.existsSync(filePath)) {
    tags = readJson<any[]>(filePath) || [];
  } else {
    tags = [
      { name: "Smart TV", slug: "smart-tv", desc: "Products running smart operating systems like WebOS, Android, or Vidaa." },
      { name: "4K UHD", slug: "4k-uhd", desc: "Ultra High Definition televisions and display screens." },
      { name: "Bluetooth", slug: "bluetooth", desc: "Devices supporting wireless Bluetooth audio or control sync." },
      { name: "Gas Cooker", slug: "gas-cooker", desc: "LPG-powered kitchen cooking units." },
      { name: "Fully Automatic", slug: "fully-automatic", desc: "Automatic wash and spin laundry appliances." },
    ];
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(tags, null, 2), "utf-8");
  }

  // Count products for each tag
  let products = getAllProducts(showAll);
  if (!showAll) {
    products = products.filter((p) => (p.status || "publish") === "publish");
  }
  const tagCountMap = new Map<string, number>();
  for (const p of products) {
    const pTags = (p as any).tags || [];
    for (const t of pTags) {
      let tSlug = "";
      if (typeof t === "string") {
        tSlug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      } else if (t && typeof t === "object") {
        tSlug = t.slug || "";
      }
      if (tSlug) {
        tagCountMap.set(tSlug, (tagCountMap.get(tSlug) || 0) + 1);
      }
    }
  }

  return tags.map(t => ({
    ...t,
    count: tagCountMap.get(t.slug) || 0
  }));
}

export function saveAllTags(tags: any[]) {
  const filePath = path.join(CONTENT_DIR, "tags", "_index.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(tags, null, 2), "utf-8");
}

export function getAllAttributes(): { name: string; slug: string; type: string; terms: string }[] {
  const filePath = path.join(CONTENT_DIR, "attributes", "_index.json");
  let attributes: any[] = [];
  if (fs.existsSync(filePath)) {
    attributes = readJson<any[]>(filePath) || [];
  } else {
    attributes = [
      { name: "Color", slug: "pa_color", type: "select", terms: "Black, Silver, White, Grey" },
      { name: "Screen Size", slug: "pa_screen-size", type: "select", terms: "32\", 43\", 50\", 55\", 65\", 75\", 85\"" },
      { name: "Resolution", slug: "pa_resolution", type: "select", terms: "HD Ready, Full HD, 4K UHD, 8K UHD" },
      { name: "Warranty", slug: "pa_warranty", type: "select", terms: "1 Year, 2 Years, 5 Years" },
    ];
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(attributes, null, 2), "utf-8");
  }
  return attributes;
}

export function saveAllAttributes(attributes: any[]) {
  const filePath = path.join(CONTENT_DIR, "attributes", "_index.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(attributes, null, 2), "utf-8");
}

export function saveAllCategories(categories: Category[]) {
  const filePath = path.join(CONTENT_DIR, "categories", "_index.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf-8");
}

export function getTopLevelCategories(): Category[] {
  return getAllCategories().filter((c) => c.parent === 0 && c.count > 0);
}

export function getSiteMeta(): SiteMeta {
  return readJson<SiteMeta>(path.join(CONTENT_DIR, "site-meta.json")) || {
    name: "PetStore Kenya",
    description: "Kenya's leading online pet store",
    url: "https://petstore.co.ke",
    logo: "/images/psk_logo.png",
    logoLocal: "/images/psk_logo.png",
  };
}

export function getProductsByCategory(categorySlug: string, showAll = false): ProductSummary[] {
  return getAllProducts(showAll).filter((p) =>
    (showAll || (p.status || "publish") === "publish") &&
    p.status !== "trash" &&
    p.categories.some((c) => c.slug === categorySlug)
  );
}

export function getAllReviews(): any[] {
  const data = readJson<any[]>(path.join(CONTENT_DIR, "reviews.json"));
  const reviews = data || [];
  return [...reviews].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}

export function parseShortcodes(content: string): string {
  if (!content) return "";

  let parsed = decode(content);

  // 1. Parse vc_custom_heading
  parsed = parsed.replace(/\[vc_custom_heading\s+([^\]]+)\]/g, (match, attrsStr) => {
    const textMatch = attrsStr.match(/text="([^"]+)"/) || attrsStr.match(/text='([^']+)'/);
    const headingText = textMatch ? textMatch[1] : "";

    const tagMatch = attrsStr.match(/tag:([hH][1-6])/);
    const tag = tagMatch ? tagMatch[1] : "h3";

    return `<${tag}>${headingText}</${tag}>`;
  });

  // 2. Parse divider
  parsed = parsed.replace(/\[divider\s+([^\]]+)\]/g, (match, attrsStr) => {
    const heightMatch = attrsStr.match(/custom_height="([^"]+)"/);
    const height = heightMatch ? heightMatch[1] : "20px";
    return `<div style="height: ${height}"></div>`;
  });

  // 3. Remove other container/wrapper shortcodes
  parsed = parsed.replace(/\[\/?[a-zA-Z0-9_-]+[^\]]*\]/g, "");

  // 4. Clean up any empty/double paragraphs
  parsed = parsed
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<p>&nbsp;<\/p>/g, "");

  return parsed;
}

export function getAllPages(): any[] {
  const data = readJson<any[]>(path.join(CONTENT_DIR, "pages", "_index.json"));
  return (data || []).map((p) => ({ ...p, title: decode(p.title) }));
}

export function getPage(slug: string): any | null {
  const data = readJson<any>(path.join(CONTENT_DIR, "pages", `${slug}.json`));
  if (!data) return null;
  return { 
    ...data, 
    title: decode(data.title),
    content: data.content ? parseShortcodes(data.content) : ""
  };
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  icon?: string;
}

export function getHistoryEvents(): HistoryEvent[] {
  const data = readJson<HistoryEvent[]>(path.join(CONTENT_DIR, "history.json"));
  return data || [];
}

export function logHistoryEvent(user: string, action: string, details: string, icon?: string): void {
  try {
    const events = getHistoryEvents();
    const newEvent: HistoryEvent = {
      id: "evt-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
      icon,
    };
    events.unshift(newEvent);
    
    if (!fs.existsSync(CONTENT_DIR)) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(CONTENT_DIR, "history.json"),
      JSON.stringify(events, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to write history log:", error);
  }
}

export function clearHistoryEvents(): void {
  try {
    fs.writeFileSync(
      path.join(CONTENT_DIR, "history.json"),
      JSON.stringify([], null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to clear history log:", error);
  }
}

export interface BlogPost {
  id: string;
  title: string;
  image: string;
  link: string;
  tag: string;
  status: string;
  date: string;
  author: string;
  content?: string;
  slug?: string;
}

export function getSlugFromLink(link: string, title?: string): string {
  if (!link) {
    return title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : "untitled-post";
  }
  try {
    if (link.startsWith("http://") || link.startsWith("https://")) {
      const url = new URL(link);
      const pathname = url.pathname.replace(/^\/|\/$/g, "");
      return pathname || "untitled-post";
    }
    return link.replace(/^\/|\/$/g, "");
  } catch {
    return link.replace(/^\/|\/$/g, "");
  }
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export function getBlogArticles(): BlogPost[] {
  const data = readJson<BlogPost[]>(path.join(CONTENT_DIR, "posts", "_index.json"));
  return data || [];
}

export function saveBlogArticles(articles: BlogPost[]): void {
  try {
    const dir = path.join(CONTENT_DIR, "posts");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, "_index.json"),
      JSON.stringify(articles, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to save blog articles:", error);
  }
}

export function getBlogCategories(): BlogCategory[] {
  const data = readJson<BlogCategory[]>(path.join(CONTENT_DIR, "posts", "categories.json"));
  const categories = data || [];
  
  // Calculate counts dynamically from the blog posts
  const posts = getBlogArticles();
  const catCountMap = new Map<string, number>();
  for (const p of posts) {
    catCountMap.set(p.tag, (catCountMap.get(p.tag) || 0) + 1);
  }
  
  for (const c of categories) {
    c.count = catCountMap.get(c.name) || 0;
  }
  
  return categories;
}

export function saveBlogCategories(categories: BlogCategory[]): void {
  try {
    const dir = path.join(CONTENT_DIR, "posts");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, "categories.json"),
      JSON.stringify(categories, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to save blog categories:", error);
  }
}

export function getBlogTags(): BlogTag[] {
  const data = readJson<BlogTag[]>(path.join(CONTENT_DIR, "posts", "tags.json"));
  return data || [];
}

export function saveBlogTags(tags: BlogTag[]): void {
  try {
    const dir = path.join(CONTENT_DIR, "posts");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, "tags.json"),
      JSON.stringify(tags, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to save blog tags:", error);
  }
}

export function decrementProductStock(productIdentifier: string | number, qtyToDecrement: number): boolean {
  try {
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");
    if (!fs.existsSync(indexFilePath)) return false;

    const indexProducts = readJson<ProductSummary[]>(indexFilePath) || [];

    const pIdx = indexProducts.findIndex((p: any) => 
      String(p.id) === String(productIdentifier) || 
      String(p.slug) === String(productIdentifier) || 
      (p.sku && String(p.sku).toLowerCase() === String(productIdentifier).toLowerCase())
    );
    if (pIdx === -1) return false;

    const productSummary = indexProducts[pIdx];
    const slug = productSummary.slug;
    const detailFilePath = path.join(CONTENT_DIR, "products", `${slug}.json`);

    let detail: Product | null = null;
    if (fs.existsSync(detailFilePath)) {
      detail = readJson<Product>(detailFilePath);
    }

    // Determine if stock management is enabled.
    // If detail exists, its manageStock/lowStockRemaining is the source of truth.
    // Otherwise, fallback to product summary values.
    const isStockManaged = detail 
      ? (detail.manageStock !== false && detail.lowStockRemaining !== null && detail.lowStockRemaining !== undefined)
      : (productSummary.manageStock !== false && productSummary.lowStockRemaining !== null && productSummary.lowStockRemaining !== undefined);

    if (!isStockManaged) {
      return false;
    }

    const currentQty = detail 
      ? (typeof detail.lowStockRemaining === "number" ? detail.lowStockRemaining : 0)
      : (typeof productSummary.lowStockRemaining === "number" ? productSummary.lowStockRemaining : 0);

    const newQty = Math.max(0, currentQty - qtyToDecrement);
    const newInStock = newQty > 0;
    const newStockStatus = newInStock ? "instock" : "outofstock";

    // Update detail file if it exists
    if (detail) {
      detail.lowStockRemaining = newQty;
      detail.inStock = newInStock;
      detail.stockStatus = newStockStatus;
      
      try {
        fs.writeFileSync(detailFilePath, JSON.stringify(detail, null, 2), "utf-8");
        
        try {
          const { upsertProductToSupabase } = require("./supabase.server");
          upsertProductToSupabase(detail).catch((err: any) => 
            console.error("Error syncing stock decrement to Supabase:", err)
          );
        } catch (e) {}
      } catch (e) {
        console.error(`Error writing detail file for ${slug}:`, e);
      }
    }

    // Update index product summary
    productSummary.lowStockRemaining = newQty;
    productSummary.inStock = newInStock;
    productSummary.stockStatus = newStockStatus;
    if (detail) {
      productSummary.manageStock = detail.manageStock;
    }

    fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error in decrementProductStock:", err);
  }
  return false;
}

export async function updateOrderSafely(
  orderId: string,
  updateFields: { status?: any; paymentGatewayData?: Record<string, any> }
) {
  const { db } = await import("./db.server");
  
  const existing = await db.order.findUnique({ where: { id: orderId } });
  if (!existing) throw new Error("Order not found");

  const dataToUpdate: any = {};
  if (updateFields.status !== undefined) {
    dataToUpdate.status = updateFields.status;
  }

  if (updateFields.paymentGatewayData) {
    let existingPgData = existing.paymentGatewayData || {};
    if (typeof existingPgData === "string") {
      try {
        existingPgData = JSON.parse(existingPgData);
      } catch (e) {
        existingPgData = {};
      }
    }
    dataToUpdate.paymentGatewayData = {
      ...existingPgData,
      ...updateFields.paymentGatewayData
    };
  }

  return await db.order.update({
    where: { id: orderId },
    data: dataToUpdate
  });
}

const decrementedOrdersInMemory = new Set<string>();
const processingOrdersInMemory = new Set<string>();

export async function decrementOrderStockIfNeeded(order: any): Promise<boolean> {
  if (!order || !order.id) return false;
  if (decrementedOrdersInMemory.has(order.id)) return false;
  if (processingOrdersInMemory.has(order.id)) return false;

  processingOrdersInMemory.add(order.id);
  
  try {
    const { db } = await import("./db.server");
    const latestOrder = await db.order.findUnique({ where: { id: order.id } });
    if (!latestOrder) {
      processingOrdersInMemory.delete(order.id);
      return false;
    }

    let pgData = latestOrder.paymentGatewayData || {};
    if (typeof pgData === "string") {
      try {
        pgData = JSON.parse(pgData);
      } catch (e) {
        pgData = {};
      }
    }
    
    if (pgData.stockDecremented === true || pgData.stockDecremented === "true") {
      decrementedOrdersInMemory.add(order.id);
      processingOrdersInMemory.delete(order.id);
      return false;
    }

    // Prevent concurrent/duplicate executions by writing the flag to database immediately
    pgData.stockDecremented = true;
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentGatewayData: pgData
      }
    });

    decrementedOrdersInMemory.add(order.id);

    // Proceed with actual stock decrements
    if (latestOrder.items && Array.isArray(latestOrder.items)) {
      for (const item of latestOrder.items) {
        const productIdentifier = item.id || item.slug || item.sku;
        if (productIdentifier) {
          decrementProductStock(productIdentifier, Number(item.quantity) || 1);
        }
      }
    }

    return true;
  } catch (err) {
    console.error("Error in decrementOrderStockIfNeeded:", err);
    return false;
  } finally {
    processingOrdersInMemory.delete(order.id);
  }
}

export interface ManualItem {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string;
  date: string;
  thumbnail?: string;
}

export interface ManualCategory {
  id: string;
  name: string;
  slug: string;
}

export function getAllManuals(): ManualItem[] {
  const filePath = path.join(CONTENT_DIR, "manuals.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return readJson<ManualItem[]>(filePath) || [];
}

export function saveAllManuals(manuals: ManualItem[]): void {
  const filePath = path.join(CONTENT_DIR, "manuals.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(manuals, null, 2), "utf-8");
}

export function getAllManualCategories(): ManualCategory[] {
  const filePath = path.join(CONTENT_DIR, "manual-categories.json");
  if (!fs.existsSync(filePath)) {
    const defaultCats: ManualCategory[] = [
      { id: "cat_1", name: "Pet Food", slug: "pet-food" },
      { id: "cat_2", name: "Accessories", slug: "accessories" },
      { id: "cat_3", name: "Toys", slug: "toys" }
    ];
    saveAllManualCategories(defaultCats);
    return defaultCats;
  }
  return readJson<ManualCategory[]>(filePath) || [];
}

export function saveAllManualCategories(categories: ManualCategory[]): void {
  const filePath = path.join(CONTENT_DIR, "manual-categories.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf-8");
}

export function performSiteSearch(q: string) {
  const query = q.toLowerCase().trim();
  if (!query) return [];

  const results: any[] = [];

  // 1. Search Products
  const products = getAllProducts(false); // exclude trash
  for (const product of products) {
    let match = false;
    
    // Search name, sku, slug
    if (
      isSearchMatch(product.name, query) ||
      (product.sku && isSearchMatch(product.sku, query)) ||
      isSearchMatch(product.slug.replace(/-/g, " "), query)
    ) {
      match = true;
    }

    // Search categories
    if (product.categories && Array.isArray(product.categories)) {
      for (const cat of product.categories) {
        if (isSearchMatch(cat.name, query) || isSearchMatch(cat.slug.replace(/-/g, " "), query)) {
          match = true;
        }
      }
    }

    // Search tags
    if (product.tags && Array.isArray(product.tags)) {
      for (const tag of product.tags) {
        if (isSearchMatch(tag.name, query) || isSearchMatch(tag.slug.replace(/-/g, " "), query)) {
          match = true;
        }
      }
    }

    // Search brands
    if (product.brands && Array.isArray(product.brands)) {
      for (const brand of product.brands) {
        if (isSearchMatch(brand.name, query) || isSearchMatch(brand.slug.replace(/-/g, " "), query)) {
          match = true;
        }
      }
    }

    if (match) {
      results.push({
        id: `product-${product.id}`,
        title: product.name,
        image: product.thumbnail || "/assets/images/placeholder.jpg",
        link: `/shop/${product.slug}`,
        type: "Product",
        date: product.dateCreated || ""
      });
    }
  }

  // 2. Search Blog Articles
  const posts = getBlogArticles();
  for (const post of posts) {
    if (post.status !== "publish") continue;
    
    let match = false;
    if (
      isSearchMatch(post.title, query) ||
      (post.content && isSearchMatch(post.content, query)) ||
      (post.tag && isSearchMatch(post.tag, query)) ||
      (post.slug && isSearchMatch(post.slug.replace(/-/g, " "), query))
    ) {
      match = true;
    }

    if (match) {
      results.push({
        id: `post-${post.id}`,
        title: post.title,
        image: post.image || "/assets/images/placeholder.jpg",
        link: `/discover/${post.slug || getSlugFromLink(post.link)}`,
        type: "Blog Post",
        date: post.date || ""
      });
    }
  }

  // 3. Search Pages
  const pages = getAllPages();
  for (const page of pages) {
    const fullPage = getPage(page.slug);
    const content = fullPage ? fullPage.content : "";
    
    let match = false;
    if (
      isSearchMatch(page.title, query) ||
      isSearchMatch(page.slug.replace(/-/g, " "), query) ||
      isSearchMatch(content, query)
    ) {
      match = true;
    }

    if (match) {
      results.push({
        id: `page-${page.id}`,
        title: page.title,
        image: "/assets/images/banners/Blog&Support banner.png",
        link: `/${page.slug}`,
        type: "Page",
        date: page.dateCreated || ""
      });
    }
  }

  return results;
}

export interface GeneralSettings {
  siteTitle: string;
  tagline: string;
  siteIcon: string;
  wpAddressUrl: string;
  siteAddressUrl: string;
  adminEmail: string;
  anyoneCanRegister: boolean;
  defaultRole: string;
  siteLanguage: string;
  timezone: string;
  dateFormat: string;
  dateFormatCustom: string;
  timeFormat: string;
  timeFormatCustom: string;
  weekStartsOn: string;
}

export function getGeneralSettings(): GeneralSettings {
  const settingsPath = path.join(CONTENT_DIR, "general-settings.json");
  const defaultSettings: GeneralSettings = {
    siteTitle: "PetStore Kenya",
    tagline: "Your Online Pet Store",
    siteIcon: "/images/psk_logo.png",
    wpAddressUrl: "https://petstore.co.ke",
    siteAddressUrl: "/",
    adminEmail: "admin@petstore.co.ke",
    anyoneCanRegister: false,
    defaultRole: "subscriber",
    siteLanguage: "en_US",
    timezone: "UTC+3",
    dateFormat: "F j, Y",
    dateFormatCustom: "",
    timeFormat: "g:i a",
    timeFormatCustom: "",
    weekStartsOn: "Monday",
  };

  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, "utf-8");
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to read general settings:", e);
  }
  return defaultSettings;
}
