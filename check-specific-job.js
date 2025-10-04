require('dotenv/config');
const postgres = require('postgres');

async function checkSpecificJob() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking specific job...');
    
    const job = await client`
      SELECT 
        jp.id, 
        jp.title, 
        jp.status, 
        jp.location,
        ap.user_id AS owner_user_id,
        ap.company_name AS agency_name
      FROM job_posts jp 
      LEFT JOIN agency_profiles ap ON ap.id = jp.agency_id 
      WHERE jp.id = '79c6eba0-f355-4dd2-9657-0f843bf7e1e9'
    `;
    
    if (job.length > 0) {
      console.log('📋 Job details:');
      console.log(JSON.stringify(job[0], null, 2));
    } else {
      console.log('❌ Job not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkSpecificJob();
