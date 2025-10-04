require('dotenv/config');
const postgres = require('postgres');

async function createTestAgency() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🏢 Creating test agency...');
    
    // Create agency user
    const agencyEmail = `agency+${Date.now()}@example.com`;
    const agencyUser = await client`
      INSERT INTO users (email, password_hash, role, status, email_verified) 
      VALUES (${agencyEmail}, ${'hashed_password'}, 'AGENCY', 'ACTIVE', true) 
      RETURNING id, email, role
    `;
    
    console.log('✅ Agency user created:', agencyUser[0]);
    
    // Create agency profile
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
        ${'Test Agency'}, 
        ${'İstanbul'}, 
        ${'https://testagency.com'}, 
        ${'Test agency for development'}
      ) 
      RETURNING id, company_name, user_id
    `;
    
    console.log('✅ Agency profile created:', agencyProfile[0]);
    
    // Create a test job post
    const jobPost = await client`
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
        ${'Dizi Oyuncusu(İstanbul)'},
        ${'Assistant actor for a drama film to be broadcast digitally...'},
        ${'TV_SERIES'},
        ${'İstanbul'},
        ${'PUBLISHED'},
        NOW() + INTERVAL '90 days',
        32000,
        32000
      ) 
      RETURNING id, title, status, agency_id
    `;
    
    console.log('✅ Job post created:', jobPost[0]);
    
    // Create another DRAFT job
    const draftJob = await client`
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
        ${'Figüran (Trabzon)'},
        ${'3-season planned action project...'},
        ${'FILM'},
        ${'Trabzon'},
        ${'DRAFT'},
        NOW() + INTERVAL '30 days',
        8000,
        15000
      ) 
      RETURNING id, title, status, agency_id
    `;
    
    console.log('✅ Draft job created:', draftJob[0]);
    
    console.log('\n🎉 Test data created successfully!');
    console.log('Agency User ID:', agencyUser[0].id);
    console.log('Agency Profile ID:', agencyProfile[0].id);
    console.log('Published Job ID:', jobPost[0].id);
    console.log('Draft Job ID:', draftJob[0].id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createTestAgency();
