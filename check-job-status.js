require('dotenv/config');
const postgres = require('postgres');

async function checkJobStatus() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking job status...');
    
    // Önce tüm ilanları listele
    const allJobs = await client`
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
    
    console.log(`📋 Found ${allJobs.length} job posts:`);
    allJobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title} (${job.status}) - ID: ${job.id}`);
    });
    
    // Spesifik ilanı kontrol et
    const specificJob = await client`
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
    
    if (specificJob.length > 0) {
      console.log('\n🎯 Specific job found:');
      console.log(JSON.stringify(specificJob[0], null, 2));
    } else {
      console.log('\n❌ Specific job not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkJobStatus();
