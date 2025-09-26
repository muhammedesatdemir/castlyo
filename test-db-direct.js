require('dotenv/config');
const postgres = require('postgres');

async function testDatabaseDirectly() {
  console.log('🔍 Testing Database Connection Directly');
  console.log('=======================================');
  
  const dbUrl = process.env.DATABASE_URL;
  console.log('📡 DATABASE_URL:', dbUrl ? dbUrl.replace(/:(\/\/[^:]+:)[^@]+@/, '://$1***@') : 'Not set');

  if (!dbUrl) {
    console.log('❌ DATABASE_URL not found');
    return;
  }

  const client = postgres(dbUrl);

  try {
    // Test basic connection
    console.log('\n🔌 Testing connection...');
    await client`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Test users table
    console.log('\n👥 Testing users table...');
    const users = await client`SELECT count(*) FROM users`;
    console.log('✅ Users table accessible, count:', users[0].count);

    // Test user creation (similar to what auth does)
    console.log('\n🆕 Testing user insertion...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    const insertResult = await client`
      INSERT INTO users (email, password_hash, role) 
      VALUES (${testEmail}, ${'hashed_password'}, 'TALENT') 
      RETURNING id, email, role, status, email_verified, created_at, updated_at
    `;
    
    console.log('✅ User insertion successful:', insertResult[0]);

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await client.end({ timeout: 5000 });
  }
}

testDatabaseDirectly();
