import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Create postgres client
const client = postgres(process.env.DATABASE_URL || 'postgresql://castlyo:castlyo_password@localhost:5432/castlyo');

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export schema
export * from './schema';

// Export types
export type Database = typeof db;
export type Schema = typeof schema;

// Export database instance for NestJS
export { db as DatabaseModule };
