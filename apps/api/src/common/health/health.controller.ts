import { Controller, Get, Inject, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { DRIZZLE } from '../../config/database.module';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

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
    const startTime = Date.now();
    
    try {
      // Test database connection with a simple query
      const result = await this.db.execute(sql`SELECT 1 as health_check`);
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
      
      // Log detailed error information for debugging
      this.logger.error('Database health check failed', {
        error: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        position: error.position,
        internalPosition: error.internalPosition,
        internalQuery: error.internalQuery,
        where: error.where,
        schema: error.schema,
        table: error.table,
        column: error.column,
        dataType: error.dataType,
        constraint: error.constraint,
        file: error.file,
        line: error.line,
        routine: error.routine,
        stack: error.stack,
        responseTime,
      });
      
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
