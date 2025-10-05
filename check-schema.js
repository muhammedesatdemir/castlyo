const postgres = require('postgres');

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    const connectionString = 'postgresql://postgres:postgres@localhost:5432/castlyo';
    const sql = postgres(connectionString);
    
    // Check job_posts table structure
    console.log('1. Checking job_posts table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'job_posts'
      ORDER BY ordinal_position
    `;
    
    console.log('✅ job_posts columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if table exists and has data
    console.log('\n2. Checking job_posts data...');
    const jobCount = await sql`SELECT COUNT(*) as count FROM job_posts`;
    console.log(`✅ Total jobs: ${jobCount[0].count}`);
    
    if (jobCount[0].count > 0) {
      const sampleJobs = await sql`SELECT * FROM job_posts LIMIT 3`;
      console.log('✅ Sample jobs:');
      sampleJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ID: ${job.id}, Title: ${job.title || 'N/A'}`);
      });
    }
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

checkSchema();