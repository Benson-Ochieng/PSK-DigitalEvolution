import { supabase } from "../app/lib/supabase.server";

async function checkSync() {
  if (!supabase) {
    console.error("Supabase is not configured!");
    process.exit(1);
  }

  const tables = ["users", "coupons", "orders", "products", "posts"];
  console.log("=== Checking Supabase Sync Status ===");
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
      
    if (error) {
      console.log(`❌ Table '${table}': Error - ${error.message}`);
    } else {
      console.log(`✅ Table '${table}': Connected - ${count} rows`);
    }
  }
}

checkSync().catch(console.error);
