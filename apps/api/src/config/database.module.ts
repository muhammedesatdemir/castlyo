import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const postgres = require('postgres');
import { drizzle } from 'drizzle-orm/postgres-js';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('DATABASE_URL');
        // Şüpheli maskeleri bırak, net log yaz:
        console.log('[DB] DATABASE_URL =', url);

        const client = postgres(url!, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
          // İstersen geçici SQL logu aç: (debug fazla gürültülüyse kapat)
          // debug: (conn, q) => console.log('[SQL]', q.text, q.args),
        });

        const db = drizzle(client);
        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
