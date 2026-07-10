import { pullFromSupabase } from "../app/lib/supabase.server.js";

async function run() {
  console.log("Starting manual pull from Supabase...");
  const res = await pullFromSupabase();
  console.log("Result:", res);
}

run().catch((err) => {
  console.error("Error running pull:", err);
});
