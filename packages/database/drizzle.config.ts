import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import * as path from 'path';

// Load env from root directory
const envPath = path.resolve(__dirname, '../../dev.env');
require('dotenv').config({ path: envPath });

export default defineConfig({
  schema: './schema/**/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // opsiyonel:
  // casing: 'snake_case',
});
