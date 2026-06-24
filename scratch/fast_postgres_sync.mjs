import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Helper for bulk batch insert
async function bulkInsert(client, tableName, columns, rows, onConflictClause = '') {
  if (rows.length === 0) return;
  const colNames = columns.join(', ');
  const colCount = columns.length;
  
  // Chunk rows to stay well under Postgres parameter limit (65535)
  const chunkSize = Math.min(1000, Math.floor(50000 / colCount));
  
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valuePlaceholders = [];
    const flatValues = [];
    
    chunk.forEach((row, rowIndex) => {
      const placeholders = [];
      for (let c = 0; c < colCount; c++) {
        placeholders.push(`$${rowIndex * colCount + c + 1}`);
        flatValues.push(row[c]);
      }
      valuePlaceholders.push(`(${placeholders.join(', ')})`);
    });
    
    const query = `
      INSERT INTO ${tableName} (${colNames})
      VALUES ${valuePlaceholders.join(', ')}
      ${onConflictClause}
    `;
    
    await client.query(query, flatValues);
  }
  console.log(`✅ Bulk inserted ${rows.length} rows into ${tableName}.`);
}

async function run() {
  const start = Date.now();
  console.log('🚀 Starting optimized bulk sync to PostgreSQL database...');
  
  let client;
  try {
    client = await pool.connect();
    
    // 1. Fetch valid product IDs from the database to validate foreign key constraints in order_items
    console.log('Fetching active product IDs from DB...');
    const prodRes = await client.query('SELECT id FROM products');
    const validProductIds = new Set(prodRes.rows.map(r => r.id));
    console.log(`Found ${validProductIds.size} valid products in database.`);

    // 2. Truncate tables for clean seeding (resets serial sequences)
    console.log('Clearing old order and customer relational data...');
    await client.query('TRUNCATE TABLE order_items, orders, customers RESTART IDENTITY CASCADE;');

    // 3. Process Customers from users.json and orders.json
    console.log('Processing customers list...');
    const usersFile = path.join(process.cwd(), 'content', 'users.json');
    const ordersFile = path.join(process.cwd(), 'content', 'orders.json');
    
    const customersMap = new Map(); // Key: email.toLowerCase()

    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      for (const u of users) {
        if (u.role === 'customer' && u.email) {
          const numericId = parseInt(u.id.replace('u-', ''), 10);
          if (isNaN(numericId)) continue;
          
          customersMap.set(u.email.toLowerCase().trim(), {
            id: numericId,
            phone: null,
            email: u.email.toLowerCase().trim(),
            name: u.name,
            created_at: u.createdAt ? new Date(u.createdAt) : new Date()
          });
        }
      }
    }

    // Merge billing details from orders.json to get phone numbers
    let ordersJson = [];
    if (fs.existsSync(ordersFile)) {
      ordersJson = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
      for (const o of ordersJson) {
        const email = o.billing?.email?.toLowerCase().trim();
        const phone = o.billing?.phone?.trim();
        const name = o.billing?.name?.trim();
        
        if (email) {
          const existing = customersMap.get(email);
          if (existing) {
            if (phone && !existing.phone) existing.phone = phone;
          } else {
            const numericId = parseInt(o.id.replace('PSK-', ''), 10);
            customersMap.set(email, {
              id: isNaN(numericId) ? Math.floor(Math.random() * 1000000) + 20000 : numericId,
              phone: phone || null,
              email: email,
              name: name || 'Guest Customer',
              created_at: o.date ? new Date(o.date) : new Date()
            });
          }
        }
      }
    }

    // Prepare customer rows for bulk insertion
    // Filter duplicates on phone to satisfy UNIQUE constraint
    const seenPhones = new Set();
    const customerRows = [];
    for (const c of customersMap.values()) {
      let phone = c.phone;
      if (phone) {
        if (seenPhones.has(phone)) {
          phone = null; // Set to null if duplicate to prevent constraint failure
        } else {
          seenPhones.add(phone);
        }
      }
      customerRows.push([
        c.id,
        phone,
        c.email,
        c.name,
        c.created_at.toISOString()
      ]);
    }

    // Bulk Insert Customers
    await bulkInsert(
      client, 
      'customers', 
      ['id', 'phone', 'email', 'name', 'created_at'], 
      customerRows
    );

    // 4. Process Orders and Order Items
    console.log('Processing orders and order items...');
    const orderRows = [];
    const orderItemRows = [];

    for (const o of ordersJson) {
      const numericOrderId = parseInt(o.id.replace('PSK-', ''), 10);
      if (isNaN(numericOrderId)) continue;

      const subtotal = (o.total || 0) - (o.shipping || 0);
      const deliveryArea = o.billing?.address_1 || o.billing?.city || 'N/A';
      
      orderRows.push([
        numericOrderId,
        o.billing?.name || 'Guest Customer',
        o.billing?.phone || 'N/A',
        o.billing?.email || null,
        deliveryArea,
        subtotal,
        o.shipping || 0,
        o.total || 0,
        o.paymentMethod || 'M-Pesa',
        (o.status || 'pending').toLowerCase(),
        null, // notes
        o.date ? new Date(o.date).toISOString() : new Date().toISOString()
      ]);

      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          const productId = parseInt(item.id, 10);
          const validatedProductId = validProductIds.has(productId) ? productId : null;
          
          orderItemRows.push([
            numericOrderId,
            validatedProductId,
            item.name,
            item.quantity || 1,
            item.price || 0,
            (item.price || 0) * (item.quantity || 1)
          ]);
        }
      }
    }

    // Bulk Insert Orders
    await bulkInsert(
      client,
      'orders',
      [
        'id', 'customer_name', 'customer_phone', 'customer_email', 'delivery_area',
        'subtotal_kes', 'delivery_fee_kes', 'total_kes', 'payment_method', 'status', 'notes', 'created_at'
      ],
      orderRows
    );

    // Bulk Insert Order Items
    await bulkInsert(
      client,
      'order_items',
      ['order_id', 'product_id', 'product_name', 'qty', 'unit_price', 'total_price'],
      orderItemRows
    );

    console.log(`🎉 Bulk synchronization complete in ${((Date.now() - start) / 1000).toFixed(2)}s!`);
  } catch (err) {
    console.error('❌ Error during bulk sync:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
