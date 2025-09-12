import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@castlyo/database/schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

const databaseProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.get<string>('DATABASE_URL');
    const client = postgres(connectionString);
    return drizzle(client, { schema });
  },
  inject: [ConfigService],
};

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../dev.env',
      isGlobal: true,
    }),
  ],
  providers: [databaseProvider],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
