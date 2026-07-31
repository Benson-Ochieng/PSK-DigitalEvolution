import { db } from "../app/lib/db.server";
import { query as pgQuery } from "../app/db.server";
import { supabase } from "../app/lib/supabase.server";
import dotenv from "dotenv";
dotenv.config();

async function testFindMany() {
  console.log("Testing db.order.findMany()...");
  const orders = await db.order.findMany();
  console.log(`db.order.findMany() returned ${orders.length} orders.`);
  if (orders.length > 0) {
    console.log("Sample returned orders:", orders.slice(0, 3));
  }

  // Check how many rows order_items has in Supabase vs PostgreSQL
  if (supabase) {
    const { count: orderItemsCount } = await supabase.from("order_items").select("*", { count: "exact", head: true });
    console.log("Supabase order_items count:", orderItemsCount);
  }

  try {
    const pgOrderItemsCount = await pgQuery("SELECT COUNT(*) as count FROM order_items", []);
    console.log("PostgreSQL order_items count:", pgOrderItemsCount.rows[0].count);
  } catch (e: any) {
    console.log("PostgreSQL order_items error:", e.message);
  }
}

testFindMany().then(() => process.exit(0));
