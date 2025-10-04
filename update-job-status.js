require('dotenv/config');
const postgres = require('postgres');

async function updateJobStatus() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Updating job status...');
    
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
    
    // Eğer ilan yoksa, test ilanı oluştur
    if (allJobs.length === 0) {
      console.log('\n🏢 Creating test agency and job...');
      
      // Agency user oluştur
      const agencyUser = await client`
        INSERT INTO users (email, password_hash, role, status, email_verified) 
        VALUES ('test-agency@example.com', 'hashed_password', 'AGENCY', 'ACTIVE', true) 
        RETURNING id, email, role
      `;
      
      console.log('✅ Agency user created:', agencyUser[0]);
      
      // Agency profile oluştur
      const agencyProfile = await client`
        INSERT INTO agency_profiles (
          user_id, 
          company_name, 
          city, 
          website, 
          description
        ) 
        VALUES (
          ${agencyUser[0].id}, 
          'Test Agency', 
          'İstanbul', 
          'https://testagency.com', 
          'Test agency for development'
        ) 
        RETURNING id, company_name, user_id
      `;
      
      console.log('✅ Agency profile created:', agencyProfile[0]);
      
      // Test job oluştur
      const testJob = await client`
        INSERT INTO job_posts (
          agency_id,
          title,
          description,
          job_type,
          location,
          status,
          application_deadline,
          budget_min,
          budget_max
        ) 
        VALUES (
          ${agencyProfile[0].id},
          'Dizi Oyuncusu(İstanbul)',
          'Dijitalde yayınlanacak dram filmi yardımcı oyuncu aranıyor...',
          'TV_SERIES',
          'İstanbul',
          'PUBLISHED',
          NOW() + INTERVAL '90 days',
          32000,
          32000
        ) 
        RETURNING id, title, status, agency_id
      `;
      
      console.log('✅ Test job created:', testJob[0]);
      console.log('🎉 Test data created successfully!');
      
    } else {
      // Mevcut ilanları PUBLISHED yap
      console.log('\n📝 Updating existing jobs to PUBLISHED...');
      
      const updatedJobs = await client`
        UPDATE job_posts 
        SET status = 'PUBLISHED', published_at = NOW()
        WHERE status != 'PUBLISHED'
        RETURNING id, title, status
      `;
      
      console.log(`✅ Updated ${updatedJobs.length} jobs to PUBLISHED:`);
      updatedJobs.forEach(job => {
        console.log(`- ${job.title} (${job.status}) - ID: ${job.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

updateJobStatus();
