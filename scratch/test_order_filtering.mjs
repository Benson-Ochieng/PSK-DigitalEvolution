import fs from "fs";
import path from "path";

const ordersPath = path.join(process.cwd(), "content", "orders.json");
const productsIndexPath = path.join(process.cwd(), "content", "products", "_index.json");

const orders = JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
const products = JSON.parse(fs.readFileSync(productsIndexPath, "utf-8"));

console.log("Total orders in content/orders.json:", orders.length);

const petStoreProductNames = new Set(products.map((p) => p.name ? p.name.toLowerCase().trim() : ""));

const petKeywords = [
  "dog", "cat", "pet", "puppy", "kitten", "food", "kibble", "trixie", "bonnie",
  "reflex", "scratching", "litter", "collar", "leash", "bird", "fish", "hamster"
];

let rejectedNoItems = 0;
let rejectedTestItems = 0;
let rejectedStatusTrash = 0;
let rejectedCustomerTest = 0;
let rejectedNotMatchingPet = 0;
let passed = 0;

const rejectedNotMatchingPetExamples = [];

for (const order of orders) {
  const statusLower = String(order.status || '').toLowerCase();
  if (statusLower === "trash") {
    rejectedStatusTrash++;
    continue;
  }

  const customerName = String(order.billing?.name || '').toLowerCase();
  if (customerName.includes("test") || customerName.includes("tester")) {
    rejectedCustomerTest++;
    continue;
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    rejectedNoItems++;
    continue;
  }

  const hasTestItems = order.items.some((item) => {
    if (!item) return true;
    const nameLower = String(item.name || '').toLowerCase();
    const skuLower = String(item.sku || '').toLowerCase();
    if (nameLower.includes("test product") || nameLower.includes("dummy product") || nameLower.includes("a washing machine")) return true;
    if (skuLower.includes("test") || skuLower.includes("dummy")) return true;
    if (item.price !== undefined && Number(item.price) <= 10) return true;
    return false;
  });

  if (hasTestItems) {
    rejectedTestItems++;
    continue;
  }

  const matches = order.items.some((item) => {
    if (!item || !item.name) return false;
    const nameLower = item.name.toLowerCase();
    if (petStoreProductNames.has(nameLower.trim())) return true;
    return petKeywords.some(kw => nameLower.includes(kw));
  });

  if (matches) {
    passed++;
  } else {
    rejectedNotMatchingPet++;
    if (rejectedNotMatchingPetExamples.length < 10) {
      rejectedNotMatchingPetExamples.push(order);
    }
  }
}

console.log({
  totalOrders: orders.length,
  passed,
  rejectedNoItems,
  rejectedTestItems,
  rejectedStatusTrash,
  rejectedCustomerTest,
  rejectedNotMatchingPet
});

console.log("\nExamples of rejectedNotMatchingPet:");
console.log(JSON.stringify(rejectedNotMatchingPetExamples.slice(0, 3), null, 2));
