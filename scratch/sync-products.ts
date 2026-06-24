import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const CONTENT_DIR = path.join(process.cwd(), "content");
const PRODUCTS_DIR = path.join(CONTENT_DIR, "products");
const CATEGORIES_DIR = path.join(CONTENT_DIR, "categories");
const BRANDS_DIR = path.join(CONTENT_DIR, "brands");
const TAGS_DIR = path.join(CONTENT_DIR, "tags");

// Helper to slugify a string
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper to extract slug from PetStore Kenya URL
function getSlugFromUrl(name: string, url: string | null): string {
  if (url) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== "product") {
        return lastPart;
      }
    } catch (e) {
      // Fallback if not a valid URL
      const parts = url.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== "product") {
        return lastPart;
      }
    }
  }
  return slugify(name);
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

async function main() {
  console.log("Starting product seeding sync from database...");

  // 1. Ensure directories exist
  for (const dir of [PRODUCTS_DIR, CATEGORIES_DIR, BRANDS_DIR, TAGS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 2. Clear old products files
  const existingFiles = fs.readdirSync(PRODUCTS_DIR);
  for (const file of existingFiles) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(PRODUCTS_DIR, file));
    }
  }
  console.log(`Cleared ${existingFiles.length} legacy product files.`);

  // 3. Connect to database and fetch products + store prices
  console.log(`Connecting to database at ${dbUrl}`);
  const pool = new pg.Pool({ connectionString: dbUrl });
  let products: any[] = [];
  let storePrices: any[] = [];
  try {
    const pRes = await pool.query("SELECT * FROM products");
    products = pRes.rows;
    console.log(`Fetched ${products.length} products from PostgreSQL.`);
    const spRes = await pool.query("SELECT * FROM store_prices");
    storePrices = spRes.rows;
    console.log(`Fetched ${storePrices.length} store prices from PostgreSQL.`);
  } finally {
    await pool.end();
  }

  // 4. Define basic Categories
  const categoryMap = new Map<string, { id: number; name: string; slug: string }>();
  const defaultCategories = [
    { id: 1, name: "Dog Food", slug: "dog-food" },
    { id: 2, name: "Cat Food", slug: "cat-food" },
    { id: 3, name: "Treats", slug: "treats" },
    { id: 4, name: "Wet Food", slug: "wet-food" },
    { id: 5, name: "Dry Food", slug: "dry-food" }
  ];
  defaultCategories.forEach(cat => categoryMap.set(cat.slug, cat));

  // 5. Extract Brands dynamically
  const brandNames = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];
  const brands = brandNames.map((name, idx) => ({
    id: idx + 10,
    name,
    slug: slugify(name),
    desc: `Premium pet care products from ${name}.`
  }));
  const brandMap = new Map<string, { id: number; name: string; slug: string }>();
  brands.forEach(b => brandMap.set(b.name.toLowerCase(), { id: b.id, name: b.name, slug: b.slug }));

  // Write brands index
  fs.writeFileSync(path.join(BRANDS_DIR, "_index.json"), JSON.stringify(brands, null, 2), "utf-8");
  console.log(`Synced ${brands.length} brands to ${BRANDS_DIR}`);

  // 6. Define Tags
  const defaultTags = [
    { id: 1, name: "Premium", slug: "premium", desc: "Super premium quality pet food and accessories." },
    { id: 2, name: "Senior", slug: "senior", desc: "Specifically formulated for older pets." },
    { id: 3, name: "Adult", slug: "adult", desc: "Designed for mature, adult pets." },
    { id: 4, name: "Puppy", slug: "puppy", desc: "Nutrient-rich formulas for growing puppies." },
    { id: 5, name: "Kitten", slug: "kitten", desc: "Nutrient-rich formulas for young kittens." }
  ];
  fs.writeFileSync(path.join(TAGS_DIR, "_index.json"), JSON.stringify(defaultTags, null, 2), "utf-8");

  // 7. Process Products
  const productsSummaryList: any[] = [];

  for (const p of products) {
    // Find prices
    const productPrices = storePrices.filter(sp => sp.product_id === p.id);
    const pskPriceObj = productPrices.find(sp => sp.store_name === "PetStore Kenya");
    const ourPrice = pskPriceObj ? Number(pskPriceObj.price) : 0;
    const pskUrl = pskPriceObj ? pskPriceObj.product_url : null;
    const slug = getSlugFromUrl(p.name, pskUrl);
    const decodedName = decodeHtml(p.name);
    const decodedDesc = decodeHtml(p.description || "");

    // Determine Categories
    const pCategories: any[] = [];
    if (p.animal_type === "dog") {
      pCategories.push(categoryMap.get("dog-food"));
    } else if (p.animal_type === "cat") {
      pCategories.push(categoryMap.get("cat-food"));
    }

    if (p.food_type === "wet") {
      pCategories.push(categoryMap.get("wet-food"));
    } else if (p.food_type === "dry") {
      pCategories.push(categoryMap.get("dry-food"));
    } else if (p.food_type === "treat") {
      pCategories.push(categoryMap.get("treats"));
    }

    // Determine Brands
    const pBrands: any[] = [];
    if (p.brand) {
      const bObj = brandMap.get(p.brand.toLowerCase());
      if (bObj) pBrands.push(bObj);
    }

    // Determine Tags
    const pTags: any[] = [];
    const nameLower = decodedName.toLowerCase();
    if (nameLower.includes("senior")) pTags.push({ id: 2, name: "Senior", slug: "senior" });
    if (nameLower.includes("adult")) pTags.push({ id: 3, name: "Adult", slug: "adult" });
    if (nameLower.includes("puppy")) pTags.push({ id: 4, name: "Puppy", slug: "puppy" });
    if (nameLower.includes("kitten")) pTags.push({ id: 5, name: "Kitten", slug: "kitten" });
    if (pTags.length === 0) pTags.push({ id: 1, name: "Premium", slug: "premium" });

    const inStock = pskPriceObj ? pskPriceObj.in_stock : true;
    const sku = `PSK-${p.id}-${p.brand ? slugify(p.brand) : "gen"}`;

    const dateStr = p.created_at instanceof Date ? p.created_at.toISOString() : (p.created_at || new Date().toISOString());

    const productSummary = {
      id: p.id,
      name: decodedName,
      slug,
      sku,
      onSale: false,
      price: ourPrice,
      regularPrice: ourPrice,
      salePrice: null,
      currency: "KES",
      currencySymbol: "KSh",
      thumbnail: p.image_url,
      categories: pCategories,
      brands: pBrands,
      tags: pTags,
      inStock,
      averageRating: 5,
      reviewCount: 1,
      status: "publish",
      dateCreated: dateStr,
      dateModified: dateStr
    };

    productsSummaryList.push(productSummary);

    // Write individual product file
    const productDetail = {
      ...productSummary,
      type: "simple",
      permalink: pskUrl || `https://petstore.co.ke/product/${slug}/`,
      shortDescription: decodedDesc,
      description: decodedDesc,
      images: [
        {
          id: p.id * 10,
          src: p.image_url || "",
          alt: decodedName,
          name: decodedName
        }
      ],
      stockStatus: inStock ? "instock" : "outofstock",
      lowStockRemaining: inStock ? 10 : 0,
      manageStock: true,
      isPurchasable: true,
      addToCartUrl: `https://petstore.co.ke/product/${slug}/?add-to-cart=${p.id}`
    };

    fs.writeFileSync(
      path.join(PRODUCTS_DIR, `${slug}.json`),
      JSON.stringify(productDetail, null, 2),
      "utf-8"
    );
  }

  // Write products index
  fs.writeFileSync(
    path.join(PRODUCTS_DIR, "_index.json"),
    JSON.stringify(productsSummaryList, null, 2),
    "utf-8"
  );
  console.log(`Synced ${productsSummaryList.length} products to ${PRODUCTS_DIR}`);

  // 8. Write categories index
  const categoriesList = defaultCategories.map(cat => {
    // Count products in this category
    const count = productsSummaryList.filter(p => p.categories.some((c: any) => c.slug === cat.slug)).length;
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: `Shop high quality ${cat.name}.`,
      parent: 0,
      count,
      image: null,
      link: `https://petstore.co.ke/product-category/${cat.slug}/`
    };
  });
  fs.writeFileSync(
    path.join(CATEGORIES_DIR, "_index.json"),
    JSON.stringify(categoriesList, null, 2),
    "utf-8"
  );
  console.log(`Synced ${categoriesList.length} categories to ${CATEGORIES_DIR}`);

  // 9. Update Site Meta to PetStore Kenya
  const siteMeta = {
    name: "PetStore Kenya",
    description: "Kenya's Premier Pet Food & Accessories Store",
    url: "/",
    logo: "https://petstore.co.ke/wp-content/uploads/2020/09/cropped-logo-1.png",
    logoLocal: "https://petstore.co.ke/wp-content/uploads/2020/09/cropped-logo-1.png"
  };
  fs.writeFileSync(
    path.join(CONTENT_DIR, "site-meta.json"),
    JSON.stringify(siteMeta, null, 2),
    "utf-8"
  );
  console.log("Site meta updated to PetStore Kenya.");

  console.log("Product seeding sync completed successfully!");
}

main().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
