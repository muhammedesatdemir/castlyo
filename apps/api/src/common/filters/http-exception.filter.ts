import { 
  ArgumentsHost, 
  Catch, 
  ExceptionFilter, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    let status: number;
    let error: string;
    let message: string | string[];

    // Handle HttpException (NestJS exceptions)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        error = exceptionResponse;
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as any;
        error = resp.error || exception.constructor.name;
        message = resp.message || resp.error || exception.message;
      } else {
        error = exception.constructor.name;
        message = exception.message;
      }
    }
    // Handle Database constraint violations (Drizzle/Prisma)
    else if (exception?.code === "23505" || exception?.constraint?.includes("unique")) {
      status = HttpStatus.CONFLICT;
      error = 'UNIQUE_CONSTRAINT_VIOLATION';
      message = 'Email already exists';
    }
    else if (exception?.code === "23503") {
      status = HttpStatus.BAD_REQUEST;
      error = 'FOREIGN_KEY_VIOLATION';
      message = 'Invalid reference';
    }
    else if (exception?.code === "23502") {
      status = HttpStatus.BAD_REQUEST;
      error = 'NOT_NULL_VIOLATION';
      message = 'Required field missing';
    }
    // Handle custom errors with status property
    else if (exception?.status && typeof exception.status === 'number') {
      status = exception.status;
      error = exception.name || 'CUSTOM_ERROR';
      message = exception.message || 'An error occurred';
      
      // Map specific error messages
      if (message === "CONSENTS_REQUIRED") {
        status = HttpStatus.BAD_REQUEST;
        error = 'VALIDATION_ERROR';
        message = 'Required consents must be accepted';
      } else if (message === "PASSWORDS_DO_NOT_MATCH") {
        status = HttpStatus.BAD_REQUEST;
        error = 'VALIDATION_ERROR';
        message = 'Passwords do not match';
      }
    }
    // Handle JWT errors
    else if (exception?.name === 'JsonWebTokenError') {
      status = HttpStatus.UNAUTHORIZED;
      error = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
    }
    else if (exception?.name === 'TokenExpiredError') {
      status = HttpStatus.UNAUTHORIZED;
      error = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
    }
    // Handle bcrypt errors
    else if (exception?.message?.includes('bcrypt')) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'ENCRYPTION_ERROR';
      message = 'Password processing failed';
      this.logger.error(`[${requestId}] Bcrypt error: ${exception.message}`, exception.stack);
    }
    // Handle all other errors as 500
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred';
      
      // Log the full error for debugging
      this.logger.error(
        `[${requestId}] Unhandled exception: ${exception?.message || 'Unknown error'}`,
        exception?.stack || exception
      );
    }

    // Create rich error payload
    const errorResponse = {
      statusCode: status,
      error,
      message,
      path,
      timestamp,
      requestId,
    };

    // Log the request and response for monitoring
    this.logger.warn(
      `[${requestId}] ${method} ${path} -> ${status} | ${error} | User: ${(request as any).user?.id || 'anonymous'}`
    );

    response.status(status).json(errorResponse);
  }
}
