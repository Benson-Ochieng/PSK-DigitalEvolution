import { query as pgQuery } from "../app/db.server";
import { supabase } from "../app/lib/supabase.server";
import dotenv from "dotenv";
dotenv.config();

async function checkOrders() {
  console.log("=== CHECKING ORDERS IN STORAGE ===");

  // 1. Check PostgreSQL
  try {
    const pgCount = await pgQuery("SELECT COUNT(*) as count FROM orders", []);
    console.log("PostgreSQL orders table count:", pgCount.rows[0].count);
    const pgSample = await pgQuery("SELECT id, customer_name, total_kes, created_at FROM orders LIMIT 5", []);
    console.log("PostgreSQL orders sample:", pgSample.rows);
  } catch (err: any) {
    console.log("PostgreSQL error / not connected:", err.message);
  }

  // 2. Check Supabase
  if (supabase) {
    try {
      const { data: sbOrders, count: sbCount } = await supabase.from("orders").select("*", { count: "exact" });
      console.log("Supabase 'orders' table count:", sbCount, "Sample length:", sbOrders?.length);
      console.log("Supabase 'orders' sample:", sbOrders?.slice(0, 3));
    } catch (err: any) {
      console.log("Supabase 'orders' error:", err.message);
    }

    try {
      const { data: dbOrders, count: dbCount } = await supabase.from("dashboard_orders").select("*", { count: "exact" });
      console.log("Supabase 'dashboard_orders' table count:", dbCount, "Sample length:", dbOrders?.length);
    } catch (err: any) {
      console.log("Supabase 'dashboard_orders' error:", err.message);
    }
  } else {
    console.log("Supabase is null / not configured");
  }
}

checkOrders().then(() => process.exit(0));
