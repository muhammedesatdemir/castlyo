require('dotenv/config');
const postgres = require('postgres');

async function checkDatabase() {
  console.log('🔍 Database Check Script');
  console.log('========================');
  
  // Log DATABASE_URL (masking password for security)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const maskedUrl = dbUrl.replace(/:(\/\/[^:]+:)[^@]+@/, '://$1***@');
    console.log('📡 DATABASE_URL:', maskedUrl);
  } else {
    console.log('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const client = postgres(dbUrl!);

  try {
    // Test connection and get basic info
    console.log('\n🔌 Testing database connection...');
    const [dbInfo] = await client`select current_database(), current_schema()`;
    console.log('✅ Connected successfully');
    console.log('📊 Current database:', dbInfo.current_database);
    console.log('📂 Current schema:', dbInfo.current_schema);

    // List tables in public schema
    console.log('\n📋 Tables in public schema:');
    const tables = await client`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    if (tables.length === 0) {
      console.log('❌ No tables found in public schema');
    } else {
      console.log('✅ Found tables:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.tablename}`);
      });
    }

    // Check specific tables that should exist
    const requiredTables = ['users', 'profiles', 'user_consents'];
    console.log('\n🎯 Checking required tables:');
    
    for (const tableName of requiredTables) {
      const found = tables.some(t => t.tablename === tableName);
      if (found) {
        console.log(`✅ ${tableName} - exists`);
        
        // Get column count for each table
        const [countResult] = await client`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_name = ${tableName} AND table_schema = 'public'
        `;
        console.log(`   📊 Columns: ${countResult.count}`);
      } else {
        console.log(`❌ ${tableName} - missing`);
      }
    }

    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  } finally {
    await client.end({ timeout: 5000 });
  }
}

checkDatabase();
