#!/usr/bin/env node

/**
 * Direct Auth Test - Bypasses webpack issues
 * Tests the authentication flow directly
 */

const baseUrl = 'http://localhost:3000';
const apiUrl = 'http://localhost:3001';

async function testAuthFlow() {
  console.log('🔐 Testing Direct Auth Flow...\n');

  try {
    // 1. Test backend login directly
    console.log('1. Testing backend login...');
    const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestPass123!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Backend login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Backend login successful');
    console.log('   Access token:', loginData.access_token ? 'Present' : 'Missing');
    console.log('   User:', loginData.user?.email);

    // 2. Test NextAuth CSRF
    console.log('\n2. Testing NextAuth CSRF...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    if (!csrfResponse.ok) {
      throw new Error(`CSRF failed: ${csrfResponse.status}`);
    }
    const csrfData = await csrfResponse.json();
    console.log('✅ CSRF token received');

    // 3. Test NextAuth providers
    console.log('\n3. Testing NextAuth providers...');
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    if (!providersResponse.ok) {
      throw new Error(`Providers failed: ${providersResponse.status}`);
    }
    const providersData = await providersResponse.json();
    console.log('✅ Providers endpoint working');
    console.log('   Available providers:', Object.keys(providersData));

    // 4. Test session endpoint
    console.log('\n4. Testing session endpoint...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    if (!sessionResponse.ok) {
      throw new Error(`Session failed: ${sessionResponse.status}`);
    }
    const sessionData = await sessionResponse.json();
    console.log('✅ Session endpoint working');
    console.log('   Session data:', sessionData);

    console.log('\n🎉 All auth endpoints are working!');
    console.log('\nNext steps:');
    console.log('1. Try logging in through the browser at http://localhost:3000/auth');
    console.log('2. Check if the login form works with testuser@example.com / TestPass123!');
    console.log('3. After login, check /api/auth/session for access_token');

  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    process.exit(1);
  }
}

testAuthFlow();
