import { loader as shopLoader } from "../app/routes/shop";
import dotenv from "dotenv";
dotenv.config();

async function testCategoryLoader(urlStr: string, slug: string) {
  const req = new Request(urlStr);
  const data = await shopLoader({ request: req, params: { slug } } as any);
  console.log(`URL: ${urlStr}`);
  console.log(`  canonicalSlug / pageTitle: "${data.pageTitle}"`);
  console.log(`  totalResults: ${data.totalResults}`);
  console.log(`  returned products on page 1: ${data.products?.length}`);
  console.log("--------------------------------------------------");
}

async function run() {
  console.log("=== TESTING SHOP LOADER RESULTS ===");
  await testCategoryLoader("http://localhost/product-category/cat-supplies-store/", "cat-supplies-store");
  await testCategoryLoader("http://localhost/product-category/cat-food/", "cat-food");
  await testCategoryLoader("http://localhost/product-category/cat-food-and-treats/", "cat-food-and-treats");
  await testCategoryLoader("http://localhost/product-category/cat/", "cat");
  process.exit(0);
}

run();
