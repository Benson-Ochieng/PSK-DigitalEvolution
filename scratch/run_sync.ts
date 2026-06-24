import { syncWooCommerceData } from "../app/lib/woocommerce.server";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  console.log("Triggering WooCommerce Synchronization via scratch script...");
  try {
    const result = await syncWooCommerceData();
    console.log("Sync Completed Successfully!");
    console.log("Result stats:", JSON.stringify(result.stats, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Sync failed with error:", error);
    process.exit(1);
  }
}

run();
