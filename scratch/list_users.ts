import { db } from "../app/lib/db.server";

async function main() {
  const users = await db.user.findMany();
  console.log("TOTAL USERS:", users.length);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}`);
  });
}

main().catch(console.error);
