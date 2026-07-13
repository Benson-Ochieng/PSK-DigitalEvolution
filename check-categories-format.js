import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const res = await pool.query("SELECT id, name, categories FROM products WHERE status = 'publish' LIMIT 5");
    for (const row of res.rows) {
      console.log(`Product: "${row.name}"`);
      console.log("Categories:", JSON.stringify(row.categories, null, 2));
      console.log("------------------------");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
