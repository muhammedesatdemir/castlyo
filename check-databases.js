const postgres = require('postgres');

async function checkDatabases() {
  try {
    console.log('🔍 Checking available databases...\n');
    
    // Try different database names
    const databases = ['postgres', 'castlyo', 'castlyo_dev', 'castlyo_prod'];
    
    for (const dbName of databases) {
      try {
        console.log(`Testing database: ${dbName}`);
        const connectionString = `postgresql://postgres:postgres@localhost:5432/${dbName}`;
        const sql = postgres(connectionString);
        
        const result = await sql`SELECT 1 as test`;
        console.log(`✅ ${dbName} - Connection works`);
        
        // Try to find job_posts table
        try {
          const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'job_posts'
          `;
          
          if (tables.length > 0) {
            console.log(`✅ ${dbName} - job_posts table exists`);
            
            // Count jobs
            const jobCount = await sql`SELECT COUNT(*) as count FROM job_posts`;
            console.log(`✅ ${dbName} - ${jobCount[0].count} jobs found`);
            
            // Show first few jobs
            const jobs = await sql`
              SELECT id, title, status 
              FROM job_posts 
              LIMIT 3
            `;
            
            jobs.forEach((job, index) => {
              console.log(`   ${index + 1}. ID: ${job.id}, Title: ${job.title}, Status: ${job.status}`);
            });
          } else {
            console.log(`❌ ${dbName} - job_posts table not found`);
          }
        } catch (tableError) {
          console.log(`❌ ${dbName} - Error checking tables: ${tableError.message}`);
        }
        
        await sql.end();
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${dbName} - Connection failed: ${error.message}`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabases();
