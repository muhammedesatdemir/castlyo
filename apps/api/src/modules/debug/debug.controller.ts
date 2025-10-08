import { Controller, Get } from '@nestjs/common';
import { Pool } from 'pg';

@Controller('api/v1/debug')
export class DebugController {
  private pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  @Get('db-test')
  async dbTest() {
    const res = await this.pool.query(
      `select table_name from information_schema.tables where table_schema='public' and table_name in ('users','sessions','profiles')`
    );
    return { tables: res.rows.map(r => r.table_name) };
  }
}