require('dotenv/config');
const postgres = require('postgres');

async function addMissingColumns() {
  const client = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔧 Adding missing columns to users table...');
    
    // Add missing columns
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`;
    
    console.log('✅ Successfully added missing columns');
    
    // Verify columns exist
    const columns = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Current users table columns:');
    columns.forEach((col, i) => {
      console.log(`${i+1}. ${col.column_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addMissingColumns();
