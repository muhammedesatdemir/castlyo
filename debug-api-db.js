const fetch = require('node-fetch');

async function debugApiDb() {
  try {
    console.log('🔍 Debugging API database connection...\n');
    
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

    // 2. Test database connection endpoint
    console.log('\n2. Testing database connection...');
    const dbTestResponse = await fetch('http://localhost:3001/api/v1/debug/db-test', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (dbTestResponse.ok) {
      const dbTestData = await dbTestResponse.json();
      console.log('✅ Database test result:', dbTestData);
    } else {
      console.log('❌ Database test failed:', dbTestResponse.status);
    }

    // 3. Check talent profiles
    console.log('\n3. Checking talent profiles...');
    const talentResponse = await fetch('http://localhost:3001/api/v1/debug/check-talent-profiles', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (talentResponse.ok) {
      const talentData = await talentResponse.json();
      console.log('✅ Talent profiles check:', talentData);
    } else {
      console.log('❌ Talent profiles check failed:', talentResponse.status);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugApiDb();
