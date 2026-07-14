import { db } from "./app/lib/db.server";

async function main() {
  try {
    const users = await db.user.findMany();
    const adminUsers = users.filter(u => u.role === "administrator" || u.role === "shop_manager");
    console.log("ADMIN USERS FOUND:", JSON.stringify(adminUsers, null, 2));
  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
  }
}

main();
