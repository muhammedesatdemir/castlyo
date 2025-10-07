// apps/api/src/scripts/migrate.ts
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { join } from "path";

async function main() {
  console.log("[MIGRATE] Starting database migration...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);
  
  try {
    // Migrations folder path - adjust based on your project structure
    const migrationsFolder = join(__dirname, "../../../../packages/database/migrations");
    console.log("[MIGRATE] Migrations folder:", migrationsFolder);
    
    await migrate(db, { migrationsFolder });
    console.log("[MIGRATE] ✅ Database migration completed successfully");
  } catch (error) {
    console.error("[MIGRATE] ❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("[MIGRATE] Database connection closed");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[MIGRATE] Fatal error:", error);
    process.exit(1);
  });
}
