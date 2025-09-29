import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Handle Drizzle/Prisma unique constraint violations
    if (exception?.code === "23505" || exception?.constraint?.includes("unique")) {
      return response.status(HttpStatus.CONFLICT).json({ 
        message: "EMAIL_IN_USE",
        success: false 
      });
    }
    
    // Handle Drizzle/Prisma foreign key violations
    if (exception?.code === "23503") {
      return response.status(HttpStatus.BAD_REQUEST).json({ 
        message: "INVALID_REFERENCE",
        success: false 
      });
    }
    
    // Handle Drizzle/Prisma not null violations
    if (exception?.code === "23502") {
      return response.status(HttpStatus.BAD_REQUEST).json({ 
        message: "REQUIRED_FIELD_MISSING",
        success: false 
      });
    }
    
    // Handle custom errors with status codes
    if (exception?.status && exception?.message) {
      const status = exception.status;
      const message = exception.message;
      
      // Map specific error messages to user-friendly ones
      if (message === "CONSENTS_REQUIRED") {
        return response.status(HttpStatus.BAD_REQUEST).json({ 
          message: "Zorunlu onaylar işaretlenmeli",
          success: false 
        });
      }
      
      if (message === "PASSWORDS_DO_NOT_MATCH") {
        return response.status(HttpStatus.BAD_REQUEST).json({ 
          message: "Şifreler eşleşmiyor",
          success: false 
        });
      }
      
      return response.status(status).json({ 
        message: message,
        success: false 
      });
    }
    
    // Handle validation errors
    if (exception?.response?.message) {
      return response.status(HttpStatus.BAD_REQUEST).json({ 
        message: exception.response.message,
        success: false 
      });
    }
    
    // Default to 500 for unexpected errors
    console.error('🔥 Unhandled exception:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
      message: "INTERNAL_SERVER_ERROR",
      success: false 
    });
  }
}
