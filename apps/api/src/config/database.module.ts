import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as path from 'path';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  imports: [ConfigModule],
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

        // ESM-only paket => CJS projede dinamik import ile alınır
        const { default: postgres } = await import('postgres');

        // SSL configuration for production/Render
        const isProduction = nodeEnv === 'production';
        const dbSsl = cfg.get<string>('DB_SSL', 'false') === 'true';
        const shouldUseSSL = isProduction || dbSsl;

        console.log('[DB] SSL Configuration:', { isProduction, dbSsl, shouldUseSSL });

        const client = postgres(url!, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
          // SSL configuration - critical for Render Postgres
          ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
          // debug: (conn, q) => console.log('[SQL]', q.text, q.args),
        });

        const db = drizzle(client);

        // Sadece development'ta otomatik migration
        if (dbSync && nodeEnv !== 'production') {
          try {
            console.log('[DB] Checking if migration is needed...');

            // örnek kontrol: users tablosu var mı?
            const tableCheck = await client`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_name   = 'users'
              );
            `;

            const usersTableExists = tableCheck[0]?.exists;
            console.log('[DB] Users table exists:', usersTableExists);

            if (!usersTableExists) {
              console.log('[DB] Running Drizzle migrations...');
              // Runtime'da WORKDIR /app olduğu için CWD bazlı çözüm daha sağlam
              const migrationsPath = path.resolve(
                process.cwd(),
                'packages/database/migrations'
              );
              console.log('[DB] Migrations path:', migrationsPath);

              try {
                await migrate(db, { migrationsFolder: migrationsPath });
                console.log('[DB] ✅ Migration completed successfully');
              } catch (migrationError: any) {
                console.warn(
                  '[DB] ⚠️ Migration failed, but continuing:',
                  migrationError?.message ?? migrationError
                );
                console.log(
                  '[DB] Note: Tables might already exist from docker-entrypoint-initdb.d'
                );
              }
            } else {
              console.log('[DB] ✅ Tables already exist, skipping migration');
            }
          } catch (error: any) {
            console.warn(
              '[DB] ⚠️ Migration check failed, but continuing:',
              error?.message ?? error
            );
          }
        }

        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
