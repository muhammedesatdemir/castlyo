import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true,
  }));

  // CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Castlyo API')
    .setDescription('Professional casting and talent matching platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enhanced logging for dev
  app.useLogger(['error','warn','log','debug','verbose']);

  // Global exception handler for debugging
  process.on('uncaughtException', (error) => {
    console.error('🔥 Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
  });

  const PORT = Number(process.env.PORT || 3001);
  const HOST = process.env.HOST || '0.0.0.0';

  await app.listen(PORT, HOST);
  logger.log(`🚀 API listening on http://${HOST}:${PORT}`);
  logger.log(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
  logger.log(`ENV CHECK → NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, DATABASE_URL=${process.env.DATABASE_URL}`);
}
bootstrap();
