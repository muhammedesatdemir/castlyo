import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { DatabaseModule } from './config/database.module';
// import { DbModule } from '../../packages/database/db.module'; // Artık kullanmıyoruz
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { UploadModule } from './modules/upload/upload.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MessagesModule } from './modules/messages/messages.module';
import { HealthModule } from './common/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
// import { ConsentModule } from './modules/consent/consent.module'; // Temporarily disabled
import { SearchModule } from './modules/search/search.module';
import { DebugModule } from './modules/debug/debug.module';
import { GlobalJwtAuthGuard } from './modules/auth/guards/global-jwt-auth.guard';
import { FEATURES } from './config/features';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // En çok kullanılan dosyaları sırayla dene:
      envFilePath: ['.env', 'apps/api/.env', 'dev.env'],
      // Varsayılanlar (PORT, JWT vs.) için ignoreEnvFile:false kalsın
    }),
    DatabaseModule,
    DebugModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    UploadModule,
    JobsModule,
    MessagesModule,
    // Conditional modules based on feature flags
    ...(FEATURES.SEARCH ? [SearchModule] : []),
    ...(FEATURES.PAYMENTS ? [PaymentsModule] : []),
    ...(FEATURES.ADV_PERMISSIONS ? [PermissionsModule] : []),
    // ...(FEATURES.ADV_PERMISSIONS ? [ConsentModule] : []), // Temporarily disabled for auth fix
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GlobalJwtAuthGuard,
    },
  ],
})
export class AppModule {}
