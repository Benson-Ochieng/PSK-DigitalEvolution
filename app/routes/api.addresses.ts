import { query } from "../db.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const res = await query(
      `SELECT * FROM customer_addresses WHERE customer_email = $1 ORDER BY is_default DESC, id DESC`,
      [email]
    );
    return Response.json(res.rows);
  } catch (error) {
    console.error("Failed to query addresses", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const method = request.method.toUpperCase();

  try {
    if (method === "POST") {
      const {
        email,
        firstName,
        lastName,
        city,
        neighbourhood,
        streetAddress,
        apartmentInfo,
        phone,
        isDefault
      } = await request.json();

      if (!email || !firstName || !lastName || !city || !neighbourhood || !streetAddress || !phone) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      // If isDefault is true, unset default from all other addresses of this customer
      if (isDefault) {
        await query(
          `UPDATE customer_addresses SET is_default = false WHERE customer_email = $1`,
          [email]
        );
      } else {
        // If it's the first address, default it anyway
        const existing = await query(
          `SELECT id FROM customer_addresses WHERE customer_email = $1 LIMIT 1`,
          [email]
        );
        if (existing.rows.length === 0) {
          const insertRes = await query(
            `INSERT INTO customer_addresses 
             (customer_email, first_name, last_name, city, neighbourhood, street_address, apartment_info, phone, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [email, firstName, lastName, city, neighbourhood, streetAddress, apartmentInfo || "", phone, true]
          );
          return Response.json({ success: true, address: insertRes.rows[0] });
        }
      }

      const insertRes = await query(
        `INSERT INTO customer_addresses 
         (customer_email, first_name, last_name, city, neighbourhood, street_address, apartment_info, phone, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [email, firstName, lastName, city, neighbourhood, streetAddress, apartmentInfo || "", phone, !!isDefault]
      );

      return Response.json({ success: true, address: insertRes.rows[0] });
    }

    if (method === "PUT") {
      const {
        id,
        email,
        firstName,
        lastName,
        city,
        neighbourhood,
        streetAddress,
        apartmentInfo,
        phone,
        isDefault
      } = await request.json();

      if (!id || !email || !firstName || !lastName || !city || !neighbourhood || !streetAddress || !phone) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Verify ownership
      const checkOwner = await query(
        `SELECT id FROM customer_addresses WHERE id = $1 AND customer_email = $2`,
        [id, email]
      );
      if (checkOwner.rows.length === 0) {
        return Response.json({ error: "Unauthorized or not found" }, { status: 404 });
      }

      if (isDefault) {
        await query(
          `UPDATE customer_addresses SET is_default = false WHERE customer_email = $1`,
          [email]
        );
      }

      const updateRes = await query(
        `UPDATE customer_addresses SET
           first_name = $1,
           last_name = $2,
           city = $3,
           neighbourhood = $4,
           street_address = $5,
           apartment_info = $6,
           phone = $7,
           is_default = $8
         WHERE id = $9 AND customer_email = $10
         RETURNING *`,
        [firstName, lastName, city, neighbourhood, streetAddress, apartmentInfo || "", phone, !!isDefault, id, email]
      );

      return Response.json({ success: true, address: updateRes.rows[0] });
    }

    if (method === "DELETE") {
      const { id, email } = await request.json();

      if (!id || !email) {
        return Response.json({ error: "ID and email are required" }, { status: 400 });
      }

      const deleteRes = await query(
        `DELETE FROM customer_addresses WHERE id = $1 AND customer_email = $2 RETURNING *`,
        [id, email]
      );

      if (deleteRes.rows.length === 0) {
        return Response.json({ error: "Address not found or unauthorized" }, { status: 404 });
      }

      // If we deleted the default address, set another one as default if exists
      if (deleteRes.rows[0].is_default) {
        const remaining = await query(
          `SELECT id FROM customer_addresses WHERE customer_email = $1 LIMIT 1`,
          [email]
        );
        if (remaining.rows.length > 0) {
          await query(
            `UPDATE customer_addresses SET is_default = true WHERE id = $1`,
            [remaining.rows[0].id]
          );
        }
      }

      return Response.json({ success: true });
    }

    if (method === "PATCH") {
      // Toggle Default
      const { id, email } = await request.json();

      if (!id || !email) {
        return Response.json({ error: "ID and email are required" }, { status: 400 });
      }

      await query(
        `UPDATE customer_addresses SET is_default = false WHERE customer_email = $1`,
        [email]
      );

      const patchRes = await query(
        `UPDATE customer_addresses SET is_default = true WHERE id = $1 AND customer_email = $2 RETURNING *`,
        [id, email]
      );

      if (patchRes.rows.length === 0) {
        return Response.json({ error: "Address not found or unauthorized" }, { status: 404 });
      }

      return Response.json({ success: true, address: patchRes.rows[0] });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Action error in api.addresses", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
