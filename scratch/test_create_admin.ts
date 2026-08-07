import { db } from "../app/lib/db.server";

async function test() {
  try {
    const testEmail = "testadmin@petstore.co.ke";
    console.log("Creating test admin user...");
    const created = await db.user.create({
      name: "Test Admin",
      email: testEmail,
      username: "testadmin",
      role: "administrator",
      status: "active",
      phone: "+254700000000",
      passwordHash: ""
    });
    console.log("Created user result:", created);

    console.log("Querying db.user.findUnique...");
    const fetched = await db.user.findUnique({ where: { email: testEmail } });
    console.log("Fetched user result:", fetched);

    console.log("Querying db.user.findMany...");
    const allUsers = await db.user.findMany();
    const foundInMany = allUsers.find(u => u.email === testEmail);
    console.log("Found in findMany:", foundInMany);
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
