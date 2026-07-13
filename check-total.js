import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const res = await pool.query("SELECT jsonb_typeof(categories) as type, count(*) as count FROM products GROUP BY jsonb_typeof(categories)");
    console.log("Types of categories column in database:", res.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
