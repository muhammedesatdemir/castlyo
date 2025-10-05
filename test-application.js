const fetch = require('node-fetch');

async function testApplication() {
  try {
    console.log('🧪 Testing Job Application Flow...\n');

    // 1. Login first
    console.log('1. Logging in...');
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

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;
    console.log('✅ Login successful');

    // 2. Get job details
    console.log('\n2. Getting job details...');
    const jobId = 'c9102411-cfbc-42e5-9ba3-6055d8e3fc68';
    const jobResponse = await fetch(`http://localhost:3001/api/v1/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!jobResponse.ok) {
      throw new Error(`Job fetch failed: ${jobResponse.status}`);
    }

    const jobData = await jobResponse.json();
    console.log('✅ Job found:', jobData.title);
    console.log('   Status:', jobData.status);
    console.log('   Current Applications:', jobData.currentApplications || 0);

    // 3. Apply to job
    console.log('\n3. Applying to job...');
    const applicationResponse = await fetch('http://localhost:3001/api/v1/jobs/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        jobPostId: jobId,
        coverLetter: 'Bu işe başvurmak istiyorum. Test başvurusu.'
      })
    });

    if (!applicationResponse.ok) {
      const errorData = await applicationResponse.json().catch(() => ({}));
      throw new Error(`Application failed: ${applicationResponse.status} - ${errorData.message || 'Unknown error'}`);
    }

    const applicationData = await applicationResponse.json();
    console.log('✅ Application successful!');
    console.log('   Application ID:', applicationData.id);

    // 4. Check job again to see updated count
    console.log('\n4. Checking updated job...');
    const updatedJobResponse = await fetch(`http://localhost:3001/api/v1/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (updatedJobResponse.ok) {
      const updatedJobData = await updatedJobResponse.json();
      console.log('✅ Job updated');
      console.log('   New Application Count:', updatedJobData.currentApplications || 0);
    }

    // 5. Check my applications
    console.log('\n5. Checking my applications...');
    const myAppsResponse = await fetch('http://localhost:3001/api/v1/jobs/my/applications', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (myAppsResponse.ok) {
      const myAppsData = await myAppsResponse.json();
      console.log('✅ My applications:', myAppsData.length);
      if (myAppsData.length > 0) {
        console.log('   Latest application:', myAppsData[0].jobTitle);
      }
    }

    console.log('\n🎉 Application flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testApplication();
