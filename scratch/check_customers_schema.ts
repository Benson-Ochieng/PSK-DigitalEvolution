import { query } from "../app/db.server";

async function main() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers'
    `);
    console.log("CUSTOMERS COLUMNS:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
