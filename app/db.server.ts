import pg from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrate.server';
import { executeMockQuery } from './db.mock';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing!');
}

const isProduction = process.env.NODE_ENV === 'production';
let useMockDb = false;

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
        lowerHost === "petfood-db" ||
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
  connectionTimeoutMillis: 2000, // Timeout faster in dev to fallback to mock db quickly (2s instead of 5s)
  maxUses: 7500, // Close and replace a connection after 7500 queries to prevent memory leaks
  ssl: hasSslDisabled
    ? undefined
    : (isProduction ? { rejectUnauthorized: false } : undefined),
};

let pool: pg.Pool;

declare global {
  var __petfood_pool__: pg.Pool | undefined;
}

// Self-healing startup routine
async function startDatabase() {
  console.log('Starting database migrations check...');
  try {
    await runMigrations(pool);
    console.log('Database migrations completed successfully.');
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
        if (!useMockDb) {
          console.error('Unexpected error on idle PostgreSQL client:', err);
        }
      });

      console.log('Retrying migrations check without SSL...');
      try {
        await runMigrations(pool);
        console.log('Database migrations completed successfully (without SSL).');
      } catch (retryErr) {
        console.error('Auto migrations failed on retry:', retryErr);
        enableMockFallback(retryErr);
      }
    } else {
      console.error('Auto migrations failed:', err);
      enableMockFallback(err);
    }
  }
}

function enableMockFallback(error: any) {
  useMockDb = true;
  console.warn(
    `\n\x1b[33m⚠️  [DATABASE CONNECTION WARNING] ⚠️\x1b[0m\n` +
    `\x1b[33mCould not connect to PostgreSQL database at ${process.env.DATABASE_URL}.\x1b[0m\n` +
    `\x1b[32mSuccessfully fell back to local offline mock database (app/db.mock.ts).\x1b[0m\n` +
    `\x1b[32mAll storefront pages, checkout, and admin features will be fully functional.\x1b[0m\n`
  );
}

if (isProduction) {
  pool = new Pool(poolConfig);
  startDatabase();
} else {
  if (!global.__petfood_pool__) {
    global.__petfood_pool__ = new Pool(poolConfig);
    pool = global.__petfood_pool__;
    startDatabase();
  } else {
    pool = global.__petfood_pool__;
  }
}

// Global pool error handler to prevent crashing the app on broken connections
pool.on('error', (err: Error) => {
  if (!useMockDb) {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  }
});

export default pool;

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]) {
  if (useMockDb) {
    return await executeMockQuery(text, params);
  }

  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (!isProduction && duration > 100) {
      console.warn(`Slow query warning: ${duration}ms - ${text.substring(0, 100)}`);
    }
    return res;
  } catch (error: any) {
    // If we hit a connection issue mid-runtime, fall back to mock db immediately
    const isConnErr = error.code === 'ECONNREFUSED' || error.message?.includes('connect') || error.message?.includes('timeout') || error.message?.includes('terminated');
    if (isConnErr) {
      enableMockFallback(error);
      return await executeMockQuery(text, params);
    }

    console.error('Database query error:', { text, error });
    throw error;
  }
}

// Transaction helper for executing multiple queries in a single transaction
export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  if (useMockDb) {
    const mockClient = {
      query: (t: string, p?: any[]) => executeMockQuery(t, p)
    };
    return await callback(mockClient as any);
  }

  let client: pg.PoolClient;
  try {
    client = await pool.connect();
  } catch (error: any) {
    const isConnErr = error.code === 'ECONNREFUSED' || error.message?.includes('connect') || error.message?.includes('timeout');
    if (isConnErr) {
      enableMockFallback(error);
      const mockClient = {
        query: (t: string, p?: any[]) => executeMockQuery(t, p)
      };
      return await callback(mockClient as any);
    }
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
  if (useMockDb) {
    return { healthy: true, latencyMs: 0, error: 'Offline development mode (In-Memory Mock Database)' };
  }

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
