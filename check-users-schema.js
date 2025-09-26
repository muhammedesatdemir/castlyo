require('dotenv/config');
const postgres = require('postgres');

async function checkUsersSchema() {
  const client = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔍 Checking users table schema...');
    
    const columns = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 Users table columns:');
    columns.forEach((col, i) => {
      console.log(`${i+1}. ${col.column_name} - ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersSchema();
