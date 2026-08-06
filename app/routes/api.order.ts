import { query, withTransaction } from '../db.server';
import { creditLoyaltyForOrder, debitLoyaltyForOrder } from '../lib/loyalty.server';

interface OrderItem {
  product_id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  total_price: number;
}

interface OrderRequestBody {
  customer_name?: string;
  customer_phone: string;
  customer_email?: string;
  delivery_area?: string;
  subtotal_kes: number;
  delivery_fee_kes: number;
  total_kes: number;
  payment_method?: string;
  notes?: string;
  loyalty_points_used?: number;
  loyalty_discount_kes?: number;
  items: OrderItem[];
}

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body: OrderRequestBody = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_area,
      subtotal_kes,
      delivery_fee_kes,
      total_kes,
      payment_method,
      notes,
      loyalty_points_used,
      loyalty_discount_kes,
      items,
    } = body;

    // --- INPUT VALIDATION ---
    if (!customer_phone || typeof customer_phone !== 'string' || customer_phone.trim() === '') {
      return Response.json({ error: 'Customer phone number is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    // Validate positive numeric values
    if (
      typeof subtotal_kes !== 'number' ||
      subtotal_kes <= 0 ||
      typeof total_kes !== 'number' ||
      total_kes <= 0
    ) {
      return Response.json({ error: 'Invalid order totals' }, { status: 400 });
    }

    const loyaltyPointsUsed = Math.max(0, Math.floor(Number(loyalty_points_used || 0)));
    const loyaltyDiscountKes = Math.max(0, Math.floor(Number(loyalty_discount_kes || 0)));

    if (loyaltyDiscountKes > subtotal_kes) {
      return Response.json({ error: 'Invalid loyalty discount amount' }, { status: 400 });
    }

    // Validate item details
    for (const item of items) {
      if (!item.product_id || !item.product_name || typeof item.qty !== 'number' || item.qty <= 0) {
        return Response.json({ error: 'Invalid item data in order details' }, { status: 400 });
      }
    }

    try {
      await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_used INTEGER DEFAULT 0");
      await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_discount_kes NUMERIC DEFAULT 0");
      await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_status TEXT");
      await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_error TEXT");
    } catch (schemaErr) {
      console.warn('Could not ensure loyalty order columns:', schemaErr);
    }

    // --- DATABASE TRANSACTION ---
    const orderId = await withTransaction(async (client) => {
      // 1. Sync customers sequence and upsert customer record safely
      if (customer_phone || customer_email) {
        try {
          await client.query(
            "SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 1))"
          );
        } catch (e) {}

        const cleanPhone = customer_phone ? customer_phone.trim() : null;
        const cleanEmail = customer_email ? customer_email.trim().toLowerCase() : null;
        const cleanName = customer_name ? customer_name.trim() : null;

        // Check if customer exists by phone or email
        let existingRes = null;
        if (cleanEmail && cleanPhone) {
          existingRes = await client.query(
            "SELECT id FROM customers WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1",
            [cleanEmail, cleanPhone]
          );
        } else if (cleanEmail) {
          existingRes = await client.query(
            "SELECT id FROM customers WHERE LOWER(email) = $1 LIMIT 1",
            [cleanEmail]
          );
        } else if (cleanPhone) {
          existingRes = await client.query(
            "SELECT id FROM customers WHERE phone = $1 LIMIT 1",
            [cleanPhone]
          );
        }

        if (existingRes && existingRes.rows.length > 0) {
          // Update existing customer profile
          await client.query(
            `UPDATE customers 
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 email = COALESCE($3, email)
             WHERE id = $4`,
            [cleanName, cleanPhone, cleanEmail, existingRes.rows[0].id]
          );
        } else {
          // Insert new customer record
          await client.query(
            `INSERT INTO customers (phone, email, name) VALUES ($1, $2, $3)`,
            [cleanPhone, cleanEmail, cleanName]
          );
        }
      }

      // 2. Sync orders sequence and insert order
      try {
        await client.query(
          "SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1))"
        );
      } catch (e) {}

      const orderRes = await client.query(
        `INSERT INTO orders
          (customer_name, customer_phone, customer_email, delivery_area,
           subtotal_kes, delivery_fee_kes, total_kes, payment_method, notes, status,
           loyalty_points_used, loyalty_discount_kes, loyalty_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12)
         RETURNING id`,
        [
          customer_name?.trim() || null,
          customer_phone.trim(),
          customer_email?.trim() || null,
          delivery_area?.trim() || null,
          subtotal_kes,
          delivery_fee_kes || 0,
          total_kes,
          payment_method?.trim() || 'cash_on_delivery',
          notes?.trim() || null,
          loyaltyPointsUsed,
          loyaltyDiscountKes,
          loyaltyPointsUsed > 0 ? 'pending_redeem' : 'pending_credit'
        ]
      );
      const newOrderId = orderRes.rows[0].id;

      // 3. Insert order items
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, qty, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newOrderId,
            item.product_id,
            item.product_name,
            item.qty,
            item.unit_price,
            item.total_price,
          ]
        );
      }

      return newOrderId;
    });

    if (loyaltyPointsUsed > 0) {
      try {
        await debitLoyaltyForOrder({
          email: customer_email,
          phone: customer_phone,
          fullname: customer_name,
          orderId,
          pointsUsed: loyaltyPointsUsed
        });
      } catch (loyaltyErr: any) {
        await query("UPDATE orders SET loyalty_status = $1, loyalty_error = $2 WHERE id = $3", [
          'redeem_failed',
          loyaltyErr?.message || 'Loyalty redemption failed',
          orderId
        ]).catch(() => {});
        return Response.json({ error: loyaltyErr?.message || 'Could not redeem loyalty points.' }, { status: 400 });
      }
    }

    try {
      await creditLoyaltyForOrder({
        email: customer_email,
        phone: customer_phone,
        fullname: customer_name,
        orderId,
        eligibleTotal: subtotal_kes,
      });
      await query("UPDATE orders SET loyalty_status = $1, loyalty_error = NULL WHERE id = $2", ['credited', orderId]);
    } catch (loyaltyErr: any) {
      await query("UPDATE orders SET loyalty_status = $1, loyalty_error = $2 WHERE id = $3", [
        loyaltyPointsUsed > 0 ? 'redeemed_credit_pending' : 'credit_pending',
        loyaltyErr?.message || 'Loyalty credit pending',
        orderId
      ]).catch(() => {});
      console.warn('Order placed but loyalty credit did not complete:', loyaltyErr);
    }

    return Response.json({ orderId, success: true });
  } catch (err: any) {
    console.error('Order creation transaction failed:', err);
    return Response.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
