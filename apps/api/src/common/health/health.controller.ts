import { Controller, Get, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { pingDb } from '../../database/client';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

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
    const startTime = Date.now();
    
    try {
      // Test database connection using the centralized ping function
      await pingDb();
      const responseTime = Date.now() - startTime;
      
      this.logger.log(`Database health check successful in ${responseTime}ms`);
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          responseTime,
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Log specific PostgreSQL error codes for debugging
      if (error?.code === '42P01') {
        this.logger.error('[DB] Missing table(s) – run migrations', {
          code: error.code,
          message: error.message,
          detail: error.detail,
        });
      } else if (error?.code === '28000' || error?.code === '28P01') {
        this.logger.error('[DB] Authentication failed', {
          code: error.code,
          message: error.message,
          detail: error.detail,
        });
      } else if (error?.code === '53300') {
        this.logger.error('[DB] Too many connections', {
          code: error.code,
          message: error.message,
          detail: error.detail,
        });
      } else {
        this.logger.error('Database health check failed', {
          error: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          stack: error.stack,
          responseTime,
        });
      }
      
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: {
            status: 'disconnected',
            error: error.message,
            code: error.code,
            responseTime,
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
