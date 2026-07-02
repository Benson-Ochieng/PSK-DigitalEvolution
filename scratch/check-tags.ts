import { supabase } from "../app/lib/supabase.server";

async function run() {
  if (!supabase) {
    console.error("Supabase not configured");
    return;
  }
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  console.log("=== Product Schema Columns ===");
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
    console.log(JSON.stringify(data[0], null, 2));
  }
}

run().catch(console.error);
