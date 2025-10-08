import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolveMigrationsDir } from '../config/paths';

function makeClient() {
  const connectionString = process.env.DATABASE_URL!;
  const shouldUseSSL = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
  return new Client({
    connectionString,
    ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined,
  });
}

(async () => {
  console.log('[MIGRATE] Starting database migration...');
  const migrationsDir = resolveMigrationsDir();
  const journal = path.join(migrationsDir, 'meta', '_journal.json');
  console.log('[MIGRATE] Migrations dir:', migrationsDir);

  if (!fs.existsSync(journal)) {
    console.error(
      '[MIGRATE] ❌ Missing meta/_journal.json. You must COMMIT drizzle migrations to the repo and make sure the folder is available at runtime.\n' +
      'Expected at: ' + journal
    );
    process.exit(1);
  }

  const client = makeClient();
  await client.connect();
  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: migrationsDir });
    console.log('[MIGRATE] ✅ Migration complete');
  } catch (err: any) {
    console.error('[MIGRATE] ❌ Migration failed:', err?.code, err?.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
