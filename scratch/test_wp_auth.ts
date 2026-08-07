import { authenticateWordPressCustomer } from "../app/lib/wordpress-auth.server";

async function main() {
  try {
    console.log("Testing authenticateWordPressCustomer with wrong password...");
    const res = await authenticateWordPressCustomer("john.doe@gmail.com", "wrongpassword123");
    console.log("SUCCESS (this should NOT happen if password is required!):", res);
  } catch (err: any) {
    console.log("FAILED as expected with error:", err.message);
  }
}

main();
