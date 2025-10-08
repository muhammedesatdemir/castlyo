import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { pingDb } from './database/client';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  // Trust proxy for real IP detection (fixes rate limiting behind proxy)
  (app as any).set('trust proxy', 1);

  // Root route handler
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Castlyo API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/v1/health',
        docs: '/api/docs',
        jobs: '/api/v1/jobs'
      }
    });
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Cookie parser middleware
  app.use(cookieParser());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Global validation pipe with detailed error messages
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => {
      console.error('[VALIDATION ERRORS]', JSON.stringify(errors, null, 2));
      return new BadRequestException({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Invalid profile payload',
        details: errors,
      });
    },
  }));

  // CORS - Allow frontend domains
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000',
        'https://castlyo.com',
        'https://www.castlyo.com',
        'https://castlyo.onrender.com',
        'https://castlyo-web.onrender.com'
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Cookie'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Castlyo API')
    .setDescription('Professional casting and talent matching platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    useGlobalPrefix: true,
  });

  // Enhanced logging for dev
  app.useLogger(['error','warn','log','debug','verbose']);

  // Global exception handler for debugging
  process.on('uncaughtException', (error) => {
    console.error('🔥 Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Test database connection before starting server
  try {
    await pingDb();
    logger.log('✅ Database connection verified');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  const PORT = Number(process.env.PORT || 3001);
  const HOST = process.env.HOST || '0.0.0.0';

  await app.listen(PORT, HOST);
  logger.log(`🚀 API listening on http://${HOST}:${PORT}`);
  logger.log(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
  logger.log(`ENV CHECK → NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, DATABASE_URL=${process.env.DATABASE_URL}`);
}
bootstrap();
