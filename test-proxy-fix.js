#!/usr/bin/env node

/**
 * Test script to verify proxy enforcement and error handling
 */

const baseUrl = 'http://localhost:3000';

async function testProxyEnforcement() {
  console.log('🔐 Testing Proxy vs Direct API Calls...\n');

  const testPayload = {
    email: 'testuser3@example.com',
    password: 'Admin*123',
    passwordConfirm: 'Admin*123',
    role: 'TALENT',
    consents: {
      acceptedTerms: true,
      acceptedPrivacy: true,
      termsVersion: '2025-09-28',
      privacyVersion: '2025-09-28'
    }
  };

  try {
    // 1. Test registration through proxy
    console.log('1. Testing registration through PROXY...');
    const proxyResponse = await fetch(`${baseUrl}/api/proxy/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Proxy Status: ${proxyResponse.status}`);
    const proxyData = await proxyResponse.json().catch(() => ({}));
    console.log(`   Proxy Response:`, proxyData);

    // 2. Test registration through direct API
    console.log('\n2. Testing registration through DIRECT API...');
    const directResponse = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Direct Status: ${directResponse.status}`);
    const directData = await directResponse.json().catch(() => ({}));
    console.log(`   Direct Response:`, directData);

    // 3. Compare results
    console.log('\n3. Comparison:');
    if (proxyResponse.status === directResponse.status) {
      console.log('✅ Both proxy and direct return same status - issue is in backend');
    } else {
      console.log('❌ Different status codes - issue is in proxy');
      console.log(`   Proxy: ${proxyResponse.status}, Direct: ${directResponse.status}`);
    }

    // 4. Test login through proxy
    console.log('\n4. Testing login through proxy...');
    const loginResponse = await fetch(`${baseUrl}/api/proxy/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPayload.email,
        password: testPayload.password
      })
    });

    console.log(`   Login Status: ${loginResponse.status}`);
    const loginData = await loginResponse.json().catch(() => ({}));
    console.log(`   Login Response:`, loginData);

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log(`- Proxy Status: ${proxyResponse.status}`);
    console.log(`- Direct API Status: ${directResponse.status}`);
    console.log(`- Login Status: ${loginResponse.status}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testProxyEnforcement();
