// Simple test script to verify the /users/me endpoint returns the new fields
const http = require('http');

async function testUsersMe() {
  try {
    // First, try to register a test user
    console.log('1. Registering test user...');
    const registerResponse = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestPass123!',
        passwordConfirm: 'TestPass123!',
        role: 'TALENT',
        consents: {
          acceptedTerms: true,
          acceptedPrivacy: true,
          termsVersion: '1.0',
          privacyVersion: '1.0'
        }
      })
    });

    if (registerResponse.ok) {
      console.log('✅ User registered successfully');
    } else {
      const registerError = await registerResponse.text();
      console.log('ℹ️ Registration response:', registerError);
      if (registerResponse.status === 409) {
        console.log('   User already exists, continuing with login...');
      } else {
        throw new Error(`Registration failed: ${registerResponse.status} - ${registerError}`);
      }
    }

    // Now try to login
    console.log('\n2. Logging in to get access token...');
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestPass123!'
      })
    });

    if (!loginResponse.ok) {
      const loginError = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${loginError}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('   Access token:', loginData.access_token ? 'Present' : 'Missing');
    console.log('   User:', loginData.user?.email);

    // Now test the /users/me endpoint
    console.log('\n3. Testing /users/me endpoint...');
    const meResponse = await fetch('http://localhost:3001/api/v1/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${meResponse.status}`);
    
    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.log('Error response:', errorText);
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ /users/me successful');
    console.log('Response:', JSON.stringify(meData, null, 2));
    
    console.log('\n=== Response Analysis ===');
    console.log('Has isAgencyProfileComplete:', 'isAgencyProfileComplete' in meData);
    console.log('Has isTalentProfileComplete:', 'isTalentProfileComplete' in meData);
    console.log('Has canPostJobs:', 'canPostJobs' in meData);
    console.log('Has canApplyJobs:', 'canApplyJobs' in meData);
    
    if ('isAgencyProfileComplete' in meData) {
      console.log('isAgencyProfileComplete value:', meData.isAgencyProfileComplete);
    }
    if ('isTalentProfileComplete' in meData) {
      console.log('isTalentProfileComplete value:', meData.isTalentProfileComplete);
    }
    if ('canPostJobs' in meData) {
      console.log('canPostJobs value:', meData.canPostJobs);
    }
    if ('canApplyJobs' in meData) {
      console.log('canApplyJobs value:', meData.canApplyJobs);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUsersMe();
