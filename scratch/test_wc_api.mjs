const CONSUMER_KEY = "ck_48cbc0db974eb4ef3fac3b8c8065e538508ebf83";
const CONSUMER_SECRET = "cs_b49d274a57e1fdd0bc6a3342cb15d3e5f09f9813";
const BASE_URL = "https://petstore.co.ke/wp-json/wc/v3";

const authHeader = "Basic " + Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");

async function testFetch() {
  try {
    console.log("Fetching a product...");
    const prodRes = await fetch(`${BASE_URL}/products?per_page=1`, {
      headers: { Authorization: authHeader }
    });
    console.log("Product Status:", prodRes.status);
    const products = await prodRes.json();
    console.log("Product structure keys:", Object.keys(products[0] || {}));
    if (products[0]) {
      console.log("First product sample categories:", products[0].categories);
      console.log("First product sample tags:", products[0].tags);
      console.log("First product brand / attributes:", products[0].attributes);
    }

    console.log("\nFetching a customer...");
    const custRes = await fetch(`${BASE_URL}/customers?per_page=1`, {
      headers: { Authorization: authHeader }
    });
    console.log("Customer Status:", custRes.status);
    const customers = await custRes.json();
    console.log("Customer structure keys:", Object.keys(customers[0] || {}));

    console.log("\nFetching an order...");
    const orderRes = await fetch(`${BASE_URL}/orders?per_page=1`, {
      headers: { Authorization: authHeader }
    });
    console.log("Order Status:", orderRes.status);
    const orders = await orderRes.json();
    console.log("Order structure keys:", Object.keys(orders[0] || {}));
    if (orders[0]) {
      console.log("First order billing:", orders[0].billing);
      console.log("First order items sample:", orders[0].line_items?.[0]);
    }
  } catch (err) {
    console.error("Test fetch failed:", err);
  }
}

testFetch();
