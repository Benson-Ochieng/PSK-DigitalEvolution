import { syncWooCommerceData } from "../app/lib/woocommerce.server.js";
import dotenv from "dotenv";
dotenv.config();

console.log("Running WooCommerce database sync...");
syncWooCommerceData()
  .then(res => {
    console.log("Sync Completed! Result stats:", res.stats);
    process.exit(0);
  })
  .catch(err => {
    console.error("Sync Failed with error:", err);
    process.exit(1);
  });
