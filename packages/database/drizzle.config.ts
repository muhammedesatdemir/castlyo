import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../dev.env' });

export default defineConfig({
  schema: './schema/*',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://castlyo:castlyo_password@localhost:5432/castlyo',
  },
  verbose: true,
  strict: true,
});
