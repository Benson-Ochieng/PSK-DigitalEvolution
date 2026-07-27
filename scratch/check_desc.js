import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const res = await client.query('SELECT slug, description, short_description FROM products WHERE description IS NOT NULL AND short_description IS NOT NULL LIMIT 5');
  console.log('Sample products:', JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
