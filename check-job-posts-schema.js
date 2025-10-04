require('dotenv/config');
const postgres = require('postgres');

async function checkJobPostsSchema() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking job_posts schema...');
    
    const columns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'job_posts'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 job_posts columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkJobPostsSchema();
