import { query } from "../db.server";

export type WordPressCustomer = {
  id: number;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

const DEFAULT_AUTH_URL = "https://petstore.co.ke/wp-json/psk/v1/customer-login";

function getWordPressAuthUrl() {
  return process.env.WORDPRESS_CUSTOMER_AUTH_URL || DEFAULT_AUTH_URL;
}

function getWordPressAuthKey() {
  return process.env.WORDPRESS_CUSTOMER_AUTH_KEY || "";
}

export async function authenticateWordPressCustomer(email: string, password: string): Promise<WordPressCustomer> {
  const authUrl = getWordPressAuthUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };
  const authKey = getWordPressAuthKey();

  if (authKey) {
    headers["X-PSK-Auth-Key"] = authKey;
  }

  const response = await fetch(authUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password })
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || !payload?.success || !payload?.customer?.email) {
    const message = payload?.message || payload?.data?.message || "Invalid email or password.";
    throw new Error(message);
  }

  const customer = payload.customer;
  const name = customer.name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.email;

  return {
    id: Number(customer.id),
    email: String(customer.email).trim().toLowerCase(),
    name,
    firstName: customer.first_name || "",
    lastName: customer.last_name || "",
    phone: customer.phone || customer.billing_phone || ""
  };
}

export async function syncWordPressCustomer(customer: WordPressCustomer) {
  await query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS wordpress_user_id INTEGER");
  await query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'");

  const phone = (customer.phone || "").trim();

  const existingByEmail = await query(
    "SELECT id FROM customers WHERE LOWER(email) = $1 LIMIT 1",
    [customer.email.toLowerCase()]
  );

  if (existingByEmail.rows.length > 0) {
    await query(
      `UPDATE customers
       SET
         name = $1,
         phone = CASE
           WHEN NULLIF($2, '') IS NULL THEN phone
           WHEN NOT EXISTS (
             SELECT 1 FROM customers other
             WHERE other.phone = $2 AND other.id <> customers.id
           ) THEN $2
           ELSE phone
         END,
         status = 'active',
         wordpress_user_id = $3
       WHERE id = $4`,
      [customer.name, phone, customer.id, existingByEmail.rows[0].id]
    );
    return;
  }

  if (phone) {
    const existingByPhone = await query(
      "SELECT id FROM customers WHERE phone = $1 LIMIT 1",
      [phone]
    );

    if (existingByPhone.rows.length > 0) {
      await query(
        `UPDATE customers
         SET name = $1,
             email = $2,
             status = 'active',
             wordpress_user_id = $3
         WHERE id = $4`,
        [customer.name, customer.email, customer.id, existingByPhone.rows[0].id]
      );
      return;
    }
  }

  await query(
    `INSERT INTO customers (name, email, phone, status, wordpress_user_id)
     VALUES ($1, $2, NULLIF($3, ''), 'active', $4)`,
    [customer.name, customer.email, phone, customer.id]
  );
}
