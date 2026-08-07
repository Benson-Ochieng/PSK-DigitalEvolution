import { query } from "../app/db.server";

async function cleanup() {
  try {
    await query("DELETE FROM customers WHERE email = $1", ["testadmin@petstore.co.ke"]);
    console.log("Cleanup completed!");
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

cleanup();
