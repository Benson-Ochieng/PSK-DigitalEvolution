import pg from 'pg';
const { Client } = pg;

async function test() {
  const client = new Client({
    connectionString: "postgresql://postgres.rsmmkitwgkdekhumlcro:UCbzLfJyIu8qOmkR@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log("Searching for date patterns in descriptions...");
  const res = await client.query(`
    SELECT id, name, description 
    FROM products 
    WHERE description ~ '\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}\\b' -- DD/MM/YYYY or MM/DD/YYYY
       OR description ~ '\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ ,:-]+\\d{4}\\b' -- Month Year
    LIMIT 10
  `);
  
  console.log("Found products with dates in description:", res.rows.length);
  res.rows.forEach(row => {
    console.log("ID:", row.id, "Name:", row.name);
    // Find matching date substring
    const match1 = row.description.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
    const match2 = row.description.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ ,:-]+\\d{4}\b/i);
    console.log("Matched dates:", { match1: match1?.[0], match2: match2?.[0] });
    console.log("-----------------------------------------");
  });

  await client.end();
}

test().catch(console.error);
