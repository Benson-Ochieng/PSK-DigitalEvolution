import pkg from 'pg';
const { Client } = pkg;

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  const saleRes = await client.query(`
    SELECT count(*) FROM products 
    WHERE categories @> '[{"slug": "sale"}]'::jsonb
  `);
  
  const clearanceRes = await client.query(`
    SELECT count(*) FROM products 
    WHERE categories @> '[{"slug": "clearance"}]'::jsonb
  `);

  const bundlesRes = await client.query(`
    SELECT count(*) FROM products 
    WHERE categories @> '[{"slug": "bundles"}]'::jsonb
  `);

  console.log("Sale category count:", saleRes.rows[0].count);
  console.log("Clearance category count:", clearanceRes.rows[0].count);
  console.log("Bundles category count:", bundlesRes.rows[0].count);
  
  await client.end();
}

test().catch(console.error);
