// scripts/reset-db.js
require('dotenv').config();
const postgres = require('postgres');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://castlyo:castlyo_password@localhost:5432/castlyo';

(async () => {
  const sql = postgres(DATABASE_URL, { max: 1 });
  try {
    await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    console.log('✅ public schema resetlendi');
  } catch (e) {
    console.error('💥 Reset hatası:', e);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
