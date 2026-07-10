const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("=== Analysing Life Stage keywords in product names ===");
    
    const keywords = ['puppy', 'kitten', 'junior', 'adult', 'senior', 'mature', 'active'];
    for (const kw of keywords) {
      const res = await pool.query(
        `SELECT COUNT(*) FROM products WHERE name ILIKE $1`, 
        [`%${kw}%`]
      );
      console.log(`Keyword "${kw}": ${res.rows[0].count} products`);
    }

    console.log("\n=== Checking sample 'senior' products ===");
    const seniorRes = await pool.query(
      `SELECT name, categories, tags FROM products WHERE name ILIKE '%senior%' LIMIT 5`
    );
    console.log(JSON.stringify(seniorRes.rows, null, 2));

    console.log("\n=== Checking sample 'adult' products ===");
    const adultRes = await pool.query(
      `SELECT name, categories, tags FROM products WHERE name ILIKE '%adult%' LIMIT 5`
    );
    console.log(JSON.stringify(adultRes.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
main();
