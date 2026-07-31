import { syncLocalToSupabase } from "../app/lib/supabase.server";
import dotenv from "dotenv";
dotenv.config();

console.log("Running syncLocalToSupabase...");
syncLocalToSupabase().then((res) => {
  console.log("Supabase sync completed:", res);
  process.exit(0);
}).catch((err) => {
  console.error("Supabase sync failed:", err);
  process.exit(1);
});
