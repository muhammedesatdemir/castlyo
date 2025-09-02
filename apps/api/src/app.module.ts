import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { UploadModule } from './modules/upload/upload.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SearchModule } from './modules/search/search.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MessagesModule } from './modules/messages/messages.module';
import { HealthModule } from './common/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../dev.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get('RATE_LIMIT_TTL', 60) * 1000, // Convert to milliseconds
            limit: configService.get('RATE_LIMIT_MAX', 100),
          },
          {
            name: 'auth',
            ttl: 15 * 60 * 1000, // 15 minutes
            limit: 5, // 5 attempts per 15 minutes for auth endpoints
          }
        ],
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    UploadModule,
    JobsModule,
    SearchModule,
    PaymentsModule,
    MessagesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
