const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
    console.log("Columns in 'products' table:");
    console.log(res.rows);
    
    const countRes = await pool.query("SELECT COUNT(*) FROM products");
    console.log("Total products in DB:", countRes.rows[0].count);

    if (countRes.rows[0].count > 0) {
      const firstRow = await pool.query("SELECT * FROM products LIMIT 1");
      console.log("First product sample categories / tags:");
      console.log("Categories:", firstRow.rows[0].categories);
      console.log("Tags:", firstRow.rows[0].tags);
    }
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await pool.end();
  }
}

main();
