require('dotenv/config');
const postgres = require('postgres');

async function checkJobs() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking job posts...');
    
    const jobs = await client`
      SELECT 
        jp.id, 
        jp.title, 
        jp.status, 
        ap.user_id AS owner_user_id,
        ap.company_name AS agency_name
      FROM job_posts jp 
      JOIN agency_profiles ap ON ap.id = jp.agency_id 
      ORDER BY jp.created_at DESC 
      LIMIT 10
    `;
    
    console.log('📋 Recent job posts:');
    jobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title} (${job.status}) - Owner: ${job.owner_user_id} - Agency: ${job.agency_name}`);
    });
    
    // Check the specific job that's causing 403
    const problemJobId = '79c6eba0-f355-4dd2-9657-0f84';
    const problemJob = await client`
      SELECT 
        jp.id, 
        jp.title, 
        jp.status, 
        ap.user_id AS owner_user_id,
        ap.company_name AS agency_name
      FROM job_posts jp 
      JOIN agency_profiles ap ON ap.id = jp.agency_id 
      WHERE jp.id::text LIKE ${problemJobId + '%'}
    `;
    
    if (problemJob.length > 0) {
      console.log('\n🚨 Problem job details:');
      console.log(JSON.stringify(problemJob[0], null, 2));
    } else {
      console.log('\n❌ Problem job not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkJobs();
