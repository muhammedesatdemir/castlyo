import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://castlyo:castlyo_password@localhost:5432/castlyo';

export const client = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 30,
  prepare: true,
});

export const db = drizzle(client, { schema });

export async function healthcheck() {
  try {
    await client`select 1`;
    return true;
  } catch {
    return false;
  }
}

export async function closeDb() {
  await client.end({ timeout: 5000 });
}

// Export all schema
export * from './schema/enums';
export * from './schema/users';
export * from './schema/jobs';
export * from './schema/messages';
export * from './schema/permissions';
export * from './schema/subscriptions';
export * from './schema/payments';
export * from './schema/audit';
export * from './schema/verification';
export * from './schema/consent';

export type Database = typeof db;
export type Schema = typeof schema;
