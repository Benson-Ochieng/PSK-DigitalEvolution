import pg from 'pg';
import { migrations } from './migrations';

export async function runMigrations(pool: pg.Pool) {
  console.log('Starting database migrations check...');
  
  // 1. Create migrations tracking table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. Fetch applied migrations
  const { rows } = await pool.query('SELECT id FROM _migrations ORDER BY id ASC');
  const appliedIds = new Set(rows.map((r: { id: number }) => r.id));

  // 3. Find pending migrations
  const pending = migrations.filter((m) => !appliedIds.has(m.id));

  if (pending.length === 0) {
    console.log('Database is up to date. No pending migrations.');
    return;
  }

  console.log(`Found ${pending.length} pending migration(s) to run.`);

  // 4. Run pending migrations in order
  for (const migration of pending) {
    console.log(`Running migration ${migration.id}: ${migration.name}...`);
    
    // Acquire a client from the pool to perform transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Execute the migration SQL
      await client.query(migration.up);
      
      // Track that this migration has run
      await client.query(
        'INSERT INTO _migrations (id, name) VALUES ($1, $2)',
        [migration.id, migration.name]
      );
      
      await client.query('COMMIT');
      console.log(`Migration ${migration.id} successfully applied.`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Migration ${migration.id} failed. Transaction rolled back.`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('Database migrations completed successfully!');
}
