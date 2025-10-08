import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const requestId = uuidv4();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = (request as any).user?.id || 'anonymous';
    
    // Add requestId to request for use in other parts of the application
    (request as any).requestId = requestId;
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const latency = Date.now() - startTime;
          
          this.logger.log(
            `[${requestId}] ${method} ${url} ${statusCode} ${latency}ms - User: ${userId} - IP: ${ip} - UA: ${userAgent.substring(0, 100)}`
          );
        },
        error: (error) => {
          const latency = Date.now() - startTime;
          const statusCode = error?.status || error?.statusCode || 500;
          
          this.logger.error(
            `[${requestId}] ${method} ${url} ${statusCode} ${latency}ms - User: ${userId} - IP: ${ip} - Error: ${error?.message || 'Unknown error'}`
          );
        },
      }),
    );
  }
}
