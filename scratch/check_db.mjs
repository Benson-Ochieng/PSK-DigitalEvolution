import pg from 'pg';

const LOCAL_URL = 'postgresql://loki_user:loki_password@localhost:5433/petfood_aggregator';
const PROD_URL = 'postgres://postgres:n380fia9QZLvzb2twZkUsk4YCbWAYlsva4jf11UvofbCJ6GwyXf5PAV9Md2Dwwjh@46.225.146.51:5432/petfoodbag';

async function checkDb(url, label) {
  console.log(`Checking ${label}...`);
  const pool = new pg.Pool({ connectionString: url });
  try {
    const { rows } = await pool.query(`
      SELECT id, name, brand, food_type 
      FROM products 
      WHERE brand ILIKE '%farmers%' OR name ILIKE '%farmers%'
    `);
    console.log(rows);
  } catch (err) {
    console.error(`Error checking ${label}:`, err.message);
  } finally {
    await pool.end();
  }
}

async function run() {
  await checkDb(LOCAL_URL, 'Local DB');
  await checkDb(PROD_URL, 'Production DB');
}

run();
