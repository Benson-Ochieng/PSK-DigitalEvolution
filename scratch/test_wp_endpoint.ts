async function testWp() {
  const url = "https://petstore.co.ke/wp-json/psk/v1/customer-login";
  
  // Test 1: Real email + wrong password
  const res1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@petstore.co.ke", password: "wrongpassword999" })
  });
  console.log("Res 1 status:", res1.status);
  console.log("Res 1 text:", await res1.text());

  // Test 2: Existing email + any password
  const res2 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "john.doe@gmail.com", password: "anyrandompassword" })
  });
  console.log("Res 2 status:", res2.status);
  console.log("Res 2 text:", await res2.text());
}

testWp();
