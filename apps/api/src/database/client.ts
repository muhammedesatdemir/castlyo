import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const DATABASE_URL = process.env.DATABASE_URL!;
const DB_SSL_FLAG = (process.env.DB_SSL === 'true') || process.env.NODE_ENV === 'production';

if (!DATABASE_URL) {
  // Fail-fast: protect privacy
  console.error('[DB] DATABASE_URL missing');
  process.exit(1);
}

console.log('[DB] Initializing database client...');
console.log('[DB] SSL enabled:', DB_SSL_FLAG);
console.log('[DB] NODE_ENV:', process.env.NODE_ENV);

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DB_SSL_FLAG ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool);

export async function pingDb() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[DB] ping OK (ssl=%s)', DB_SSL_FLAG);
    return true;
  } catch (error: any) {
    console.error('[DB] ping failed:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
      ssl: DB_SSL_FLAG,
    });
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[DB] Shutting down database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[DB] Shutting down database pool...');
  await pool.end();
  process.exit(0);
});
