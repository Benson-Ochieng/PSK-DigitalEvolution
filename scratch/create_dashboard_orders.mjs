import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

console.log('Creating dashboard_orders table in Supabase...');

async function run() {
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboard_orders (
        id                   TEXT PRIMARY KEY,
        date                 TEXT NOT NULL,
        "paymentMethod"      TEXT NOT NULL,
        items                JSONB NOT NULL,
        total                NUMERIC(10,2) NOT NULL,
        shipping             NUMERIC(10,2) NOT NULL,
        currency             TEXT NOT NULL,
        billing              JSONB NOT NULL,
        status               TEXT NOT NULL,
        "paymentGatewayData" JSONB
      );

      -- Grant permissions for roles
      GRANT ALL PRIVILEGES ON TABLE dashboard_orders TO anon, authenticated, service_role;
    `);
    console.log('✅ dashboard_orders table created and permissions granted successfully!');
  } catch (err) {
    console.error('❌ Error creating dashboard_orders table:', err);
  } finally {
    await pool.end();
  }
}

run();
