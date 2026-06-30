const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM _migrations ORDER BY id ASC");
    console.log("Applied migrations in '_migrations' table:");
    console.log(res.rows);
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await pool.end();
  }
}

main();
