const fetch = require('node-fetch');

async function checkJobSimple() {
  try {
    console.log('🔍 Checking job via API...\n');
    
    // 1. Login first
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestPass123!'
      })
    });

    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;
    console.log('✅ Login successful');

    // 2. Get all jobs
    console.log('\n2. Getting all jobs...');
    const jobsResponse = await fetch('http://localhost:3001/api/v1/jobs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log('✅ Jobs found:', jobsData.data.length);
      
      jobsData.data.forEach((job, index) => {
        console.log(`${index + 1}. ID: ${job.id}`);
        console.log(`   Title: ${job.title}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Agency ID: ${job.agencyId}`);
        console.log('');
      });
      
      // Use the first job for testing
      if (jobsData.data.length > 0) {
        const firstJob = jobsData.data[0];
        console.log(`\n3. Testing application with first job: ${firstJob.id}`);
        
        const applicationResponse = await fetch('http://localhost:3001/api/v1/jobs/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            jobPostId: firstJob.id,
            coverLetter: 'Test application'
          })
        });

        console.log('Application response status:', applicationResponse.status);
        const result = await applicationResponse.json().catch(() => ({}));
        console.log('Application result:', result);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkJobSimple();
