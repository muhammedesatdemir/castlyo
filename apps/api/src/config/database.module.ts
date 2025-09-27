import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const postgres = require('postgres');
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as path from 'path';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => {
        const url = cfg.get<string>('DATABASE_URL');
        const dbSync = cfg.get<string>('DB_SYNC', 'false') === 'true';
        const nodeEnv = cfg.get<string>('NODE_ENV', 'development');
        
        console.log('[DB] DATABASE_URL =', url);
        console.log('[DB] DB_SYNC =', dbSync);
        console.log('[DB] NODE_ENV =', nodeEnv);

        const client = postgres(url!, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
          // İstersen geçici SQL logu aç: (debug fazla gürültülüyse kapat)
          // debug: (conn, q) => console.log('[SQL]', q.text, q.args),
        });

        const db = drizzle(client);

        // Auto-migration fallback for development
        if (dbSync && nodeEnv !== 'production') {
          try {
            console.log('[DB] Checking if migration is needed...');
            
            // Check if users table exists
            const tableCheck = await client`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
              );
            `;
            
            const usersTableExists = tableCheck[0]?.exists;
            console.log('[DB] Users table exists:', usersTableExists);
            
            if (!usersTableExists) {
              console.log('[DB] Running Drizzle migrations...');
              const migrationsPath = path.resolve(__dirname, '../../../packages/database/migrations');
              console.log('[DB] Migrations path:', migrationsPath);
              
              try {
                await migrate(db, { migrationsFolder: migrationsPath });
                console.log('[DB] ✅ Migration completed successfully');
              } catch (migrationError) {
                console.warn('[DB] ⚠️ Migration failed, but continuing:', migrationError.message);
                console.log('[DB] Note: Tables might already exist from docker-entrypoint-initdb.d');
              }
            } else {
              console.log('[DB] ✅ Tables already exist, skipping migration');
            }
          } catch (error) {
            console.warn('[DB] ⚠️ Migration check failed, but continuing:', error.message);
          }
        }

        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
