const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { jobPosts } = require('./packages/database/dist/schema/index.js');
const { eq } = require('drizzle-orm');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/castlyo_dev';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkJobDirect() {
  try {
    console.log('🔍 Checking job directly in database...\n');
    
    const jobId = 'c9102411-cfbc-42e5-9ba3-6055d8e3fc68';
    
    console.log('1. Looking for job with ID:', jobId);
    const job = await db.select({
      id: jobPosts.id,
      title: jobPosts.title,
      status: jobPosts.status,
      agencyId: jobPosts.agencyId,
      applicationDeadline: jobPosts.applicationDeadline,
      currentApplications: jobPosts.currentApplications
    })
    .from(jobPosts)
    .where(eq(jobPosts.id, jobId))
    .limit(1);
    
    console.log('Job found:', job.length);
    if (job.length > 0) {
      console.log('Job details:', job[0]);
    } else {
      console.log('❌ Job not found in database');
      
      // List all jobs
      console.log('\n2. Listing all jobs...');
      const allJobs = await db.select({
        id: jobPosts.id,
        title: jobPosts.title,
        status: jobPosts.status
      })
      .from(jobPosts)
      .limit(10);
      
      console.log('All jobs:', allJobs);
    }
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkJobDirect();
