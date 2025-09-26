#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config({ path: 'dev.env' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:AdminReis97@localhost:5432/castlyo';

async function checkDatabase() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('🔍 Checking database state...');
    
    // Check if common tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📋 Existing tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database');
    }
    
    // Check if we have any of our expected tables
    const expectedTables = ['users', 'job_posts', 'job_applications', 'messages', 'payments'];
    const existingTableNames = tables.map(t => t.table_name);
    
    console.log('\n🔍 Expected tables status:');
    expectedTables.forEach(table => {
      const exists = existingTableNames.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });
    
  } catch (error) {
    console.error('💥 Database check failed:', error.message);
  } finally {
    await sql.end();
  }
}

checkDatabase().catch(console.error);
