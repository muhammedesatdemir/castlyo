#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config({ path: 'dev.env' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:AdminReis97@localhost:5432/castlyo';

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log(`📡 Database URL: ${DATABASE_URL.replace(/:[^:]*@/, ':***@')}`);
  
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Test users table
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`👤 Users table accessible: ${users[0].count} users`);
    
    // Test job_posts table
    const jobs = await sql`SELECT COUNT(*) as count FROM job_posts`;
    console.log(`💼 Job posts table accessible: ${jobs[0].count} jobs`);
    
    // Test if we can insert a test record (and then delete it)
    console.log('🧪 Testing insert capability...');
    const testUser = await sql`
      INSERT INTO users (email, password_hash, role, status) 
      VALUES ('test-connection@example.com', 'test-hash', 'TALENT', 'PENDING')
      RETURNING id, email
    `;
    console.log(`✅ Insert test successful: ${testUser[0].email}`);
    
    // Clean up test record
    await sql`DELETE FROM users WHERE email = 'test-connection@example.com'`;
    console.log('🧹 Test record cleaned up');
    
    console.log('\n🎉 Database is fully functional!');
    
  } catch (error) {
    console.error('💥 Database connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  } finally {
    await sql.end();
  }
  
  return true;
}

testConnection().catch(console.error);
