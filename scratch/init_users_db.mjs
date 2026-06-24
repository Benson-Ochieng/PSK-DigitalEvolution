import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

console.log('Initializing users table in Supabase...');

async function run() {
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create users table matching the User schema in app/lib/db.server.ts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             TEXT PRIMARY KEY,
        name           TEXT NOT NULL,
        email          TEXT UNIQUE NOT NULL,
        username       TEXT UNIQUE NOT NULL,
        role           TEXT NOT NULL,
        "ordersCount"  INTEGER DEFAULT 0,
        "createdAt"    TEXT NOT NULL,
        status         TEXT DEFAULT 'active',
        "passwordHash" TEXT NOT NULL
      );
    `);

    console.log('✅ users table created successfully (or already exists).');

    // Seed default admin accounts if they do not exist
    await pool.query(`
      INSERT INTO users (id, name, email, username, role, "ordersCount", "createdAt", status, "passwordHash")
      VALUES 
        ('u-admin', 'System Admin', 'admin@petstore.co.ke', 'admin', 'administrator', 0, '2026-01-01', 'active', 'Admin2026!'),
        ('u-manager', 'Shop Manager', 'manager@petstore.co.ke', 'manager', 'shop_manager', 0, '2026-02-15', 'active', 'Manager2026!')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Default users seeded successfully.');
  } catch (err) {
    console.error('❌ Error initializing users:', err);
  } finally {
    await pool.end();
  }
}

run();
