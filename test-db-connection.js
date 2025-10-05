const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { jobPosts } = require('./packages/database/dist/schema/index.js');
const { eq } = require('drizzle-orm');

async function testDbConnection() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/castlyo';
    console.log('Connection string:', connectionString);
    
    const sql = postgres(connectionString);
    const db = drizzle(sql);
    
    console.log('1. Testing basic connection...');
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Basic connection works:', result[0]);
    
    console.log('\n2. Testing job_posts table...');
    const jobs = await db.select({
      id: jobPosts.id,
      title: jobPosts.title,
      status: jobPosts.status
    })
    .from(jobPosts)
    .limit(5);
    
    console.log('✅ Jobs found:', jobs.length);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ID: ${job.id}, Title: ${job.title}, Status: ${job.status}`);
    });
    
    console.log('\n3. Testing specific job lookup...');
    const specificJob = await db.select({
      id: jobPosts.id,
      title: jobPosts.title,
      status: jobPosts.status,
      agencyId: jobPosts.agencyId
    })
    .from(jobPosts)
    .where(eq(jobPosts.id, 'c9102411-cfbc-42e5-9ba3-6055d8e3fc68'))
    .limit(1);
    
    console.log('✅ Specific job lookup:', specificJob.length > 0 ? specificJob[0] : 'Not found');
    
    await sql.end();
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDbConnection();
