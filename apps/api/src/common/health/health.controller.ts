import { Controller, Get, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { DRIZZLE } from '../../config/database.module';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'Castlyo API',
      version: '1.0.0',
    };
  }

  @Public()
  @Get('db')
  async checkDatabase() {
    try {
      // Test database connection with a simple query
      const result = await this.db.execute(sql`SELECT 1 as health_check`);
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          responseTime: Date.now(),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: {
            status: 'disconnected',
            error: error.message,
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
