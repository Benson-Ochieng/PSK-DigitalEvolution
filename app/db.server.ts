import pg from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrate.server';

dotenv.config({ override: true });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing!');
}

const isProduction = process.env.NODE_ENV === 'production';

let hasSslDisabled = false;
if (process.env.DATABASE_URL) {
  try {
    const urlStr = process.env.DATABASE_URL;
    // Extract hostname from connection string: postgresql://user:pass@host:port/db
    const hostPart = urlStr.split("@")[1]?.split("/")[0]?.split(":")[0];
    if (hostPart) {
      const lowerHost = hostPart.toLowerCase();
      if (
        lowerHost === "localhost" ||
        lowerHost === "127.0.0.1" ||
        lowerHost === "host.docker.internal" ||
        lowerHost === "petstore-db" ||
        lowerHost === "postgres" ||
        lowerHost === "db" ||
        lowerHost === "database" ||
        lowerHost.endsWith("-a") || // Render internal
        lowerHost.includes("internal")
      ) {
        hasSslDisabled = true;
      }
    }
  } catch (e) {
    console.warn("Failed to parse database hostname for SSL detection:", e);
  }
}

// Check explicit environment variables
if (
  process.env.DATABASE_SSL === "false" ||
  process.env.PGSSLMODE === "disable" ||
  process.env.DATABASE_URL?.includes("sslmode=disable")
) {
  hasSslDisabled = true;
}

const poolConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 20 : 5, // Limit connections in dev
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // standard connection timeout
  maxUses: 7500, // Close and replace a connection after 7500 queries to prevent memory leaks
  ssl: hasSslDisabled
    ? undefined
    : { rejectUnauthorized: false },
};

let pool: pg.Pool;

// A promise that resolves once migrations have run on startup.
// All route loaders should await ensureDbReady() before querying,
// preventing a race condition where the first request fires before
// the migration check has completed.
let _dbReadyResolve: () => void;
let _dbReadyReject: (err: any) => void;
let dbReadyPromise: Promise<void> = new Promise<void>((res, rej) => {
  _dbReadyResolve = res;
  _dbReadyReject = rej;
});

declare global {
  var __petstore_pool__: pg.Pool | undefined;
  var __petstore_db_ready__: Promise<void> | undefined;
}

// Startup migrations check
async function startDatabase() {
  console.log('Starting database migrations check...');
  try {
    await runMigrations(pool);
    console.log('Database migrations completed successfully.');
    _dbReadyResolve();
  } catch (err: any) {
    // Check if the connection failed because the server does not support SSL
    if (err.message?.includes('does not support SSL connections') && poolConfig.ssl) {
      console.warn('Database server does not support SSL. Recreating connection pool without SSL...');
      try {
        await pool.end();
      } catch (endErr) {
        // ignore
      }

      poolConfig.ssl = undefined;
      pool = new Pool(poolConfig);

      pool.on('error', (err: Error) => {
        console.error('Unexpected error on idle PostgreSQL client:', err);
      });

      console.log('Retrying migrations check without SSL...');
      try {
        await runMigrations(pool);
        console.log('Database migrations completed successfully (without SSL).');
        _dbReadyResolve();
      } catch (retryErr) {
        console.error('Auto migrations failed on retry (non-fatal):', retryErr);
        // Resolve anyway so loaders are not blocked indefinitely
        _dbReadyResolve();
      }
    } else {
      console.error('Auto migrations failed (non-fatal):', err);
      // Resolve anyway so loaders are not blocked indefinitely
      _dbReadyResolve();
    }
  }
}

if (isProduction) {
  pool = new Pool(poolConfig);
  startDatabase();
} else {
  if (!global.__petstore_pool__) {
    global.__petstore_pool__ = new Pool(poolConfig);
    pool = global.__petstore_pool__;
    // Store the ready promise globally so HMR reloads share the same one
    global.__petstore_db_ready__ = dbReadyPromise;
    startDatabase();
  } else {
    pool = global.__petstore_pool__;
    // Reuse the already-resolved promise from a previous HMR cycle
    dbReadyPromise = global.__petstore_db_ready__ ?? Promise.resolve();
    // Ensure the module-level resolve/reject are no-ops (promise already settled)
    _dbReadyResolve = () => {};
    _dbReadyReject = () => {};
  }
}

// Global pool error handler to prevent crashing the app on broken connections
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export default pool;

/**
 * Await this in any route loader that runs on startup to ensure migrations
 * have completed before the first query is executed.
 * After the first successful startup it resolves instantly (no overhead).
 */
export async function ensureDbReady(): Promise<void> {
  await dbReadyPromise;
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]) {
  // Wait for the startup migration check to complete before running any query.
  // This is instant on all subsequent requests after startup.
  await dbReadyPromise;
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (!isProduction && duration > 100) {
      console.warn(`Slow query warning: ${duration}ms - ${text.substring(0, 100)}`);
    }
    return res;
  } catch (error: any) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

// Transaction helper for executing multiple queries in a single transaction
export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  let client: pg.PoolClient;
  try {
    client = await pool.connect();
  } catch (error: any) {
    console.error('Database connection error in transaction:', error);
    throw error;
  }

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rollback due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Health check to verify DB is reachable
export async function checkDbHealth(): Promise<{ healthy: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { healthy: false, error: error.message || String(error) };
  }
}

// Graceful shutdown helper
export async function shutdownPool() {
  console.log('Shutting down PostgreSQL connection pool...');
  try {
    await pool.end();
  } catch (e) {}
  console.log('PostgreSQL pool has ended.');
}

// Handle termination signals to drain connection pool gracefully
if (isProduction) {
  process.on('SIGTERM', async () => {
    await shutdownPool();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await shutdownPool();
    process.exit(0);
  });
}
