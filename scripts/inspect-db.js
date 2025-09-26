#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config({ path: 'dev.env' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:AdminReis97@localhost:5432/castlyo';

async function inspectDatabase() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('🔍 Inspecting database structure...');
    
    // Get table columns
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 User table structure:');
    userColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    const profileColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'talent_profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Profile table structure:');
    profileColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Sample data
    console.log('\n🔍 Sample User data:');
    const sampleUsers = await sql`SELECT * FROM "users" LIMIT 2`;
    console.log(sampleUsers);
    
    console.log('\n🔍 Sample Profile data:');
    const sampleProfiles = await sql`SELECT * FROM "talent_profiles" LIMIT 2`;
    console.log(sampleProfiles);
    
  } catch (error) {
    console.error('💥 Database inspection failed:', error.message);
  } finally {
    await sql.end();
  }
}

inspectDatabase().catch(console.error);
