const postgres = require('postgres');

async function createTestJobs() {
  try {
    console.log('🔧 Creating test jobs...\n');
    
    const connectionString = 'postgresql://postgres:postgres@localhost:5432/castlyo';
    const sql = postgres(connectionString);
    
    // First, create a test agency user
    console.log('1. Creating test agency user...');
    const agencyUser = await sql`
      INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
      VALUES (
        '22ac8f9c-932c-4d81-9832-9ba736844e1b',
        'agency@test.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzqK2O',
        'AGENCY',
        'ACTIVE',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id, email, role
    `;
    console.log('✅ Agency user created/found:', agencyUser[0]?.email || 'Already exists');
    
    // Create agency profile
    console.log('\n2. Creating agency profile...');
    const agencyProfile = await sql`
      INSERT INTO agency_profiles (id, user_id, company_name, city, created_at, updated_at)
      VALUES (
        '22ac8f9c-932c-4d81-9832-9ba736844e1b',
        '22ac8f9c-932c-4d81-9832-9ba736844e1b',
        'Castlyo',
        'İstanbul',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id, company_name
    `;
    console.log('✅ Agency profile created/found:', agencyProfile[0]?.company_name || 'Already exists');
    
    // Create test jobs
    console.log('\n3. Creating test jobs...');
    const jobs = [
      {
        id: 'c9102411-cfbc-42e5-9ba3-6055d8e3fc68',
        title: 'Kısa Film Oyuncusu(Ankara)',
        description: '10 dakikalık kısa film başrolü için deneyimli oyuncu aranıyor.',
        location: 'Ankara',
        job_type: 'SHORT_FILM',
        status: 'PUBLISHED',
        budget_min: 15000,
        budget_max: 30000,
        application_deadline: '2025-12-23T20:59:59.000Z'
      },
      {
        id: 'a82ce4f3-2680-4df6-8a02-f67f14f1a02a',
        title: 'Reklam Oyuncusu(İstanbul)',
        description: 'Televizyon reklamı için genç ve dinamik oyuncu aranıyor.',
        location: 'İstanbul',
        job_type: 'COMMERCIAL',
        status: 'PUBLISHED',
        budget_min: 8000,
        budget_max: 15000,
        application_deadline: '2025-12-30T20:59:59.000Z'
      }
    ];
    
    for (const job of jobs) {
      const result = await sql`
        INSERT INTO job_posts (
          id, agency_id, title, description, location, job_type, status,
          budget_min, budget_max, application_deadline,
          created_at, updated_at
        )
        VALUES (
          ${job.id}, '22ac8f9c-932c-4d81-9832-9ba736844e1b', ${job.title}, ${job.description},
          ${job.location}, ${job.job_type}, ${job.status}, ${job.budget_min}, ${job.budget_max},
          ${job.application_deadline}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING id, title, status
      `;
      console.log(`✅ Job created/updated: ${result[0].title} (${result[0].status})`);
    }
    
    // Verify jobs
    console.log('\n4. Verifying jobs...');
    const allJobs = await sql`
      SELECT id, title, status 
      FROM job_posts 
      ORDER BY created_at DESC
    `;
    
    console.log(`✅ Total jobs in database: ${allJobs.length}`);
    allJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} (${job.status})`);
    });
    
    await sql.end();
    console.log('\n🎉 Test jobs created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating test jobs:', error.message);
    console.error('Full error:', error);
  }
}

createTestJobs();
