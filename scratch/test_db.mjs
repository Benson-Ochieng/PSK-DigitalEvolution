import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing connection to:', process.env.DATABASE_URL);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000
});

async function run() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Successfully connected to database!', res.rows[0]);
  } catch (err) {
    console.error('Failed to connect to database:', err);
  } finally {
    await pool.end();
  }
}

run();
