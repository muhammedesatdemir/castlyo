// packages/database/migrate.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://castlyo:castlyo_password@localhost:5432/castlyo';

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  // ÖNEMLİ: dist/migrate.js dosyasından bakınca ../migrations doğru klasördür
  const migrationsFolder = path.join(__dirname, '..', 'migrations');
  console.log('Using migrations folder:', migrationsFolder);

  await migrate(db, { migrationsFolder });
  await sql.end();
  console.log('✅ Migrations applied');
}

main().catch((e) => {
  console.error('💥 Migration failed:', e);
  process.exit(1);
});
