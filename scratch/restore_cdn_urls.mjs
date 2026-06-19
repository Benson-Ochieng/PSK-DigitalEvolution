import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const clean = JSON.parse(fs.readFileSync('scratch/petfood_clean.json', 'utf8'));

for (let i = 0; i < clean.length; i++) {
  const url = clean[i].image_url || null;
  await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [url, i + 1]);
  if (url) console.log(`  ✅ [${i+1}] ${url.substring(0, 80)}`);
  else console.log(`  ⬜ [${i+1}] no image`);
}

await pool.end();
console.log('\nDone — CDN URLs restored to DB.');
