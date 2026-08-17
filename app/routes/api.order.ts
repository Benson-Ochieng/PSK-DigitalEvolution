import { query, withTransaction, ensureDbReady } from '../db.server';
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
  kra_pin?: string;
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
    await ensureDbReady();
    const body: OrderRequestBody = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      kra_pin,
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

    // --- INPUT VALIDATION & NUMERIC SANITIZATION ---
    if (!customer_phone || typeof customer_phone !== 'string' || customer_phone.trim() === '') {
      return Response.json({ error: 'Customer phone number is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    const cleanSubtotal = Number(subtotal_kes);
    const cleanTotal = Number(total_kes);
    const cleanDeliveryFee = Number(delivery_fee_kes || 0);

    // Validate positive numeric values
    if (isNaN(cleanSubtotal) || cleanSubtotal <= 0 || isNaN(cleanTotal) || cleanTotal < 0) {
      return Response.json({ error: 'Invalid order totals' }, { status: 400 });
    }

    const loyaltyPointsUsed = Math.max(0, Math.floor(Number(loyalty_points_used || 0)));
    const loyaltyDiscountKes = Math.max(0, Math.floor(Number(loyalty_discount_kes || 0)));

    if (loyaltyDiscountKes > cleanSubtotal) {
      return Response.json({ error: 'Invalid loyalty discount amount' }, { status: 400 });
    }

    // Validate and sanitize item details
    const sanitizedItems: OrderItem[] = [];
    for (const item of items) {
      const pId = Number(item.product_id);
      const pName = String(item.product_name || '').trim();
      const pQty = Number(item.qty);
      const pPrice = Number(item.unit_price);
      const pTotal = Number(item.total_price) || (pPrice * pQty);

      if (!pId || !pName || isNaN(pQty) || pQty <= 0 || isNaN(pPrice) || pPrice < 0) {
        return Response.json({ error: 'Invalid item data in order details' }, { status: 400 });
      }

      sanitizedItems.push({
        product_id: pId,
        product_name: pName,
        qty: pQty,
        unit_price: pPrice,
        total_price: pTotal
      });
    }

    const cleanKraPin = kra_pin ? kra_pin.trim().toUpperCase() : null;

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
                 email = COALESCE($3, email),
                 kra_pin = COALESCE($4, kra_pin)
             WHERE id = $5`,
            [cleanName, cleanPhone, cleanEmail, cleanKraPin, existingRes.rows[0].id]
          );
        } else {
          // Insert new customer record
          await client.query(
            `INSERT INTO customers (phone, email, name, kra_pin) VALUES ($1, $2, $3, $4)`,
            [cleanPhone, cleanEmail, cleanName, cleanKraPin]
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
          (customer_name, customer_phone, customer_email, kra_pin, delivery_area,
           subtotal_kes, delivery_fee_kes, total_kes, payment_method, notes, status,
           loyalty_points_used, loyalty_discount_kes, loyalty_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13)
         RETURNING id`,
        [
          customer_name?.trim() || null,
          customer_phone.trim(),
          customer_email?.trim() || null,
          cleanKraPin,
          delivery_area?.trim() || null,
          cleanSubtotal,
          cleanDeliveryFee,
          cleanTotal,
          payment_method?.trim() || 'cash_on_delivery',
          notes?.trim() || null,
          loyaltyPointsUsed,
          loyaltyDiscountKes,
          loyaltyPointsUsed > 0 ? 'pending_redeem' : 'pending_credit'
        ]
      );
      const newOrderId = orderRes.rows[0].id;

      // 3. Insert order items
      for (const item of sanitizedItems) {
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

    // Handle loyalty deductions/credits safely without breaking the order if offline
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
        console.warn('Loyalty points debit failed:', loyaltyErr);
      }
    }

    try {
      await creditLoyaltyForOrder({
        email: customer_email,
        phone: customer_phone,
        fullname: customer_name,
        orderId,
        eligibleTotal: cleanSubtotal,
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

    // Optional Supabase background sync
    try {
      const { supabase } = await import('../lib/supabase.server');
      if (supabase) {
        const dbOrder = {
          customer_name: customer_name?.trim() || '',
          customer_phone: customer_phone.trim(),
          customer_email: customer_email?.trim() || '',
          total_kes: cleanTotal,
          delivery_fee_kes: cleanDeliveryFee,
          payment_method: payment_method || 'cash_on_delivery',
          status: 'pending',
          created_at: new Date().toISOString(),
          notes: notes || null
        };
        const { data: inserted } = await supabase.from("orders").insert(dbOrder).select().single();
        if (inserted && sanitizedItems && sanitizedItems.length > 0) {
          const dbItems = sanitizedItems.map(item => ({
            order_id: inserted.id,
            product_id: item.product_id,
            product_name: item.product_name,
            qty: item.qty,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));
          await supabase.from("order_items").insert(dbItems);
        }
      }
    } catch (supaErr) {
      console.warn("Supabase sync non-fatal warning:", supaErr);
    }

    return Response.json({ orderId, success: true });
  } catch (err: any) {
    console.error('Order creation failed:', err);
    return Response.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
