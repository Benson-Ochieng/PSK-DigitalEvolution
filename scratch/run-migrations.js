import pool from '../app/db.server.js';

console.log("Database initialized. Waiting 3 seconds for migrations to complete...");
setTimeout(async () => {
  try {
    const res = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'media_assets'");
    console.log("Table check result:", res.rows.length > 0 ? "Table 'media_assets' EXISTS!" : "Table NOT found");
  } catch (e) {
    console.error("Error checking table:", e);
  } finally {
    await pool.end();
  }
}, 3000);
