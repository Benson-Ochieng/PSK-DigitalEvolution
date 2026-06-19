import { withTransaction } from '../db.server';

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

    // Validate item details
    for (const item of items) {
      if (!item.product_id || !item.product_name || typeof item.qty !== 'number' || item.qty <= 0) {
        return Response.json({ error: 'Invalid item data in order details' }, { status: 400 });
      }
    }

    // --- DATABASE TRANSACTION ---
    const orderId = await withTransaction(async (client) => {
      // 1. Upsert customer record (using phone as identifier)
      if (customer_phone) {
        await client.query(
          `INSERT INTO customers (phone, email, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (phone) 
           DO UPDATE SET 
             email = COALESCE(EXCLUDED.email, customers.email),
             name = COALESCE(EXCLUDED.name, customers.name),
             created_at = NOW()`,
          [customer_phone.trim(), customer_email?.trim() || null, customer_name?.trim() || null]
        );
      }

      // 2. Insert order
      const orderRes = await client.query(
        `INSERT INTO orders
          (customer_name, customer_phone, customer_email, delivery_area,
           subtotal_kes, delivery_fee_kes, total_kes, payment_method, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
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

    return Response.json({ orderId, success: true });
  } catch (err: any) {
    console.error('Order creation transaction failed:', err);
    return Response.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
