import { syncWooCommerceData } from "../app/lib/woocommerce.server";
import dotenv from "dotenv";
dotenv.config();

console.log("Starting PostgreSQL sync from WooCommerce...");
syncWooCommerceData()
  .then(res => {
    console.log("PostgreSQL Sync Completed! Result stats:", res.stats);
    process.exit(0);
  })
  .catch(err => {
    console.error("PostgreSQL Sync Failed with error:", err);
    process.exit(1);
  });
