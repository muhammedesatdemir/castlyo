const fetch = require('node-fetch');

async function debugJobLookup() {
  try {
    console.log('🔍 Debugging Job Lookup...\n');

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
    console.log('   ID:', jobData.id);
    console.log('   Status:', jobData.status);
    console.log('   Agency ID:', jobData.agencyId);
    console.log('   Current Applications:', jobData.currentApplications || 0);

    // 3. Check if job exists in database directly
    console.log('\n3. Testing direct job lookup...');
    const directLookupResponse = await fetch(`http://localhost:3001/api/v1/debug/check-job/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (directLookupResponse.ok) {
      const lookupData = await directLookupResponse.json();
      console.log('✅ Direct lookup result:', lookupData);
    } else {
      console.log('❌ Direct lookup failed:', directLookupResponse.status);
    }

    // 4. Try application with detailed error
    console.log('\n4. Trying application with detailed error...');
    const applicationResponse = await fetch('http://localhost:3001/api/v1/jobs/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        jobPostId: jobId,
        coverLetter: 'Test application'
      })
    });

    console.log('Application response status:', applicationResponse.status);
    const errorData = await applicationResponse.json().catch(() => ({}));
    console.log('Application error details:', errorData);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugJobLookup();
