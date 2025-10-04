require('dotenv/config');
const postgres = require('postgres');

async function listAllJobs() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Listing all job posts...');
    
    const jobs = await client`
      SELECT 
        jp.id, 
        jp.title, 
        jp.status, 
        jp.location,
        ap.user_id AS owner_user_id,
        ap.company_name AS agency_name
      FROM job_posts jp 
      LEFT JOIN agency_profiles ap ON ap.id = jp.agency_id 
      ORDER BY jp.created_at DESC
    `;
    
    console.log(`📋 Found ${jobs.length} job posts:`);
    jobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title} (${job.status}) - ID: ${job.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

listAllJobs();
