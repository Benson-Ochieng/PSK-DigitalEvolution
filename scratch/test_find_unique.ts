import { db } from "../app/lib/db.server";

async function test() {
  console.log("Checking nonexistent email...");
  const user1 = await db.user.findUnique({ where: { email: "nonexistent_email_12345@domain.com" } });
  console.log("Result for nonexistent email:", user1);

  console.log("Checking nonexistent username...");
  const user2 = await db.user.findUnique({ where: { username: "nonexistent_username_12345" } });
  console.log("Result for nonexistent username:", user2);
}

test().catch(console.error);
