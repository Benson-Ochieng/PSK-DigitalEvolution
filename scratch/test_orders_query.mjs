import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Querying dashboard_orders table in Supabase...");
  try {
    const { data, error } = await supabase
      .from("dashboard_orders")
      .select()
      .order("date", { ascending: false });

    if (error) {
      console.error("Query Error:", error);
    } else {
      console.log("Query Success! Count:", data?.length || 0);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

test();
