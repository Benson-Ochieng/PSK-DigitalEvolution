import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env manually
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env manually:", e);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL and key are required in .env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CONTENT_DIR = path.join(process.cwd(), "content");
const PRODUCTS_DIR = path.join(CONTENT_DIR, "products");
const CATEGORIES_DIR = path.join(CONTENT_DIR, "categories");
const POSTS_DIR = path.join(CONTENT_DIR, "posts");

// Ensure dirs
[CONTENT_DIR, PRODUCTS_DIR, CATEGORIES_DIR, POSTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Helper to decode HTML
function decode(str: string) {
  if (!str) return "";
  return str
    .replace(/&#8243;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&#215;/g, "×")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "");
}

// Strip HTML tags
function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function runMigration() {
  console.log("🚀 Starting data migration from petstore.co.ke...");

  // 1. Fetch Categories
  console.log("\n🏷️ Fetching Categories from petstore.co.ke...");
  const catRes = await fetch("https://petstore.co.ke/wp-json/wc/store/products/categories?per_page=100");
  if (!catRes.ok) throw new Error("Failed to fetch categories");
  const categoriesData = await catRes.json();
  console.log(`Fetched ${categoriesData.length} categories.`);

  const categories = categoriesData.map((c: any) => ({
    id: c.id,
    name: decode(c.name),
    slug: c.slug,
    description: stripHtml(c.description || ""),
    parent: c.parent || 0,
    count: c.count || 0,
    image: c.image?.src || null,
    link: c.link || `https://petstore.co.ke/product-category/${c.slug}/`
  }));

  fs.writeFileSync(path.join(CATEGORIES_DIR, "_index.json"), JSON.stringify(categories, null, 2));
  for (const cat of categories) {
    fs.writeFileSync(path.join(CATEGORIES_DIR, `${cat.slug}.json`), JSON.stringify(cat, null, 2));
  }
  console.log("✅ Categories written to local files.");

  // 2. Fetch Products
  console.log("\n📦 Fetching Products from petstore.co.ke...");
  let page = 1;
  let hasMore = true;
  const rawProducts = [];

  while (hasMore) {
    console.log(`Fetching page ${page}...`);
    const pRes = await fetch(`https://petstore.co.ke/wp-json/wc/store/products?per_page=100&page=${page}`);
    if (!pRes.ok) {
      hasMore = false;
      break;
    }
    const data = await pRes.json();
    if (data.length === 0) {
      hasMore = false;
      break;
    }
    rawProducts.push(...data);
    page++;
  }
  console.log(`Fetched ${rawProducts.length} products total.`);

  // Clean local products directory first
  const localProdFiles = fs.readdirSync(PRODUCTS_DIR);
  for (const file of localProdFiles) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(PRODUCTS_DIR, file));
    }
  }

  const productsSummary = [];
  const fullProducts = [];

  for (const p of rawProducts) {
    const price = parseInt(p.prices?.price || "0", 10) / 100;
    const regularPrice = parseInt(p.prices?.regular_price || "0", 10) / 100;
    const salePrice = parseInt(p.prices?.sale_price || "0", 10) / 100;

    const prodImages = (p.images || []).map((img: any) => ({
      id: img.id,
      src: img.src,
      alt: img.alt || p.name,
      name: img.name
    }));

    const prodCategories = (p.categories || []).map((c: any) => ({
      id: c.id,
      name: decode(c.name),
      slug: c.slug
    }));

    const product = {
      id: p.id,
      name: decode(p.name),
      slug: p.slug,
      sku: p.sku || "",
      onSale: p.on_sale,
      price: price,
      regularPrice: regularPrice,
      salePrice: p.on_sale ? salePrice : null,
      currency: p.prices?.currency_code || "KES",
      currencySymbol: p.prices?.currency_symbol || "KSh",
      thumbnail: prodImages[0]?.src || null,
      categories: prodCategories,
      inStock: p.is_in_stock,
      averageRating: parseFloat(p.average_rating) || 5.0,
      reviewCount: p.review_count || 0,
      type: p.type || "simple",
      permalink: p.permalink,
      shortDescription: stripHtml(p.short_description || ""),
      description: stripHtml(p.description || ""),
      images: prodImages,
      tags: (p.tags || []).map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
      brands: (p.brands || []).map((b: any) => ({ id: b.id, name: b.name, slug: b.slug })),
      stockStatus: p.is_in_stock ? "instock" : "outofstock",
      lowStockRemaining: p.low_stock_remaining || null,
      isPurchasable: p.is_purchasable !== undefined ? p.is_purchasable : true,
      addToCartUrl: p.add_to_cart?.url || null,
      status: "publish",
      featured: false,
      catalogVisibility: "visible",
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };

    fullProducts.push(product);
    
    // Save details
    fs.writeFileSync(path.join(PRODUCTS_DIR, `${product.slug}.json`), JSON.stringify(product, null, 2));

    // Save summary representation
    productsSummary.push({
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
      reviewCount: product.reviewCount
    });
  }

  fs.writeFileSync(path.join(PRODUCTS_DIR, "_index.json"), JSON.stringify(productsSummary, null, 2));
  console.log("✅ Products written to local files.");

  // 3. Fetch Posts
  console.log("\n📝 Fetching Blog Posts from petstore.co.ke...");
  const postsRes = await fetch("https://petstore.co.ke/wp-json/wp/v2/posts?per_page=50");
  const postsData = await postsRes.json();
  console.log(`Fetched ${postsData.length} blog posts.`);

  const posts = postsData.map((post: any) => {
    // Look for image source
    let imageUrl = null;
    const bodyContent = post.content?.rendered || "";
    const imgMatch = bodyContent.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }

    return {
      id: String(post.id),
      title: decode(post.title?.rendered || ""),
      slug: post.slug,
      date: post.date,
      content: bodyContent,
      excerpt: stripHtml(post.excerpt?.rendered || ""),
      image: imageUrl,
      link: post.link,
      tag: "Pet Care",
      status: post.status || "publish",
      author: "System Admin"
    };
  });

  fs.writeFileSync(path.join(POSTS_DIR, "_index.json"), JSON.stringify(posts, null, 2));
  console.log("✅ Posts written to local files.");

  // 4. Update Site Meta
  const siteMeta = {
    name: "PetStore Kenya",
    description: "Kenya's Premier Pet Food & Accessories Store",
    url: "https://petstore.co.ke",
    logo: "https://petstore.co.ke/wp-content/uploads/2020/09/cropped-logo-1.png",
    logoLocal: "https://petstore.co.ke/wp-content/uploads/2020/09/cropped-logo-1.png"
  };
  fs.writeFileSync(path.join(CONTENT_DIR, "site-meta.json"), JSON.stringify(siteMeta, null, 2));
  console.log("✅ Site metadata set to PetStore Kenya.");

  // 5. Clean up & Sync Supabase Database
  console.log("\n⚙️ Cleaning and Syncing Supabase database...");
  
  // Wipe electronics products
  console.log("Wiping existing products from Supabase...");
  await supabase.from("products").delete().neq("price", -999);
  
  // Wipe electronics posts
  console.log("Wiping existing posts from Supabase...");
  await supabase.from("posts").delete().neq("id", "none");

  // Sync new products
  console.log(`Upserting ${fullProducts.length} new products to Supabase...`);
  const productsBatch = fullProducts.map(p => ({
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
    categories: p.categories || [],
    inStock: !!p.inStock,
    averageRating: Number(p.averageRating || 0),
    reviewCount: Number(p.reviewCount || 0),
    type: p.type || "simple",
    permalink: p.permalink || null,
    shortDescription: p.shortDescription || null,
    description: p.description || null,
    images: p.images || [],
    tags: p.tags || [],
    brands: p.brands || [],
    stockStatus: p.stockStatus || "instock",
    lowStockRemaining: p.lowStockRemaining !== null ? Number(p.lowStockRemaining) : null,
    isPurchasable: p.isPurchasable !== undefined ? !!p.isPurchasable : true,
    addToCartUrl: p.addToCartUrl || null,
    status: p.status || "publish",
    featured: !!p.featured,
    catalogVisibility: p.catalogVisibility || "visible",
    dateCreated: p.dateCreated,
    dateModified: p.dateModified
  }));

  // Chunk products upsert (Supabase payload limits)
  const chunkSize = 50;
  for (let i = 0; i < productsBatch.length; i += chunkSize) {
    const chunk = productsBatch.slice(i, i + chunkSize);
    const { error: pErr } = await supabase.from("products").upsert(chunk);
    if (pErr) console.error(`Error syncing products chunk: ${pErr.message}`);
  }
  console.log("✅ Synced products to Supabase.");

  // Sync new posts
  console.log(`Upserting ${posts.length} new posts to Supabase...`);
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
  const { error: postErr } = await supabase.from("posts").upsert(cleanedPosts);
  if (postErr) console.error(`Error syncing posts: ${postErr.message}`);
  else console.log("✅ Synced posts to Supabase.");

  // Clean coupons and seed petstore coupons
  console.log("Resetting coupons in Supabase...");
  await supabase.from("coupons").delete().neq("code", "NONE");

  const defaultCoupons = [
    {
      code: "WELCOME500",
      discountValue: 500,
      discountType: "fixed__" + JSON.stringify({ description: "Welcome discount for new customers", active: true }),
      active: true,
      createdAt: new Date().toISOString().split("T")[0]
    },
    {
      code: "PET8",
      discountValue: 8,
      discountType: "percentage__" + JSON.stringify({ description: "8% off on all pet items", active: true }),
      active: true,
      createdAt: new Date().toISOString().split("T")[0]
    }
  ];

  // Save coupons locally
  const localCoupons = defaultCoupons.map(c => {
    const typeParts = c.discountType.split("__");
    return {
      code: c.code,
      discountValue: c.discountValue,
      discountType: typeParts[0],
      active: c.active,
      createdAt: c.createdAt,
      description: JSON.parse(typeParts[1]).description
    };
  });
  fs.writeFileSync(path.join(CONTENT_DIR, "coupons.json"), JSON.stringify(localCoupons, null, 2));

  const { error: coupErr } = await supabase.from("coupons").upsert(defaultCoupons);
  if (coupErr) console.error(`Error syncing coupons: ${coupErr.message}`);
  else console.log("✅ Synced default coupons to Supabase.");

  console.log("\n🎉 MIGRATION AND SYNC COMPLETED SUCCESSFULLY!");
}

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
