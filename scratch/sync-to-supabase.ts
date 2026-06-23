import { syncLocalToSupabase } from "../app/lib/supabase.server";

console.log("Triggering sync to Supabase...");
syncLocalToSupabase()
  .then((res) => {
    console.log("Sync result:", res);
    process.exit(res.success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
