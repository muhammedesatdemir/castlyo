#!/usr/bin/env node

/**
 * Register endpoint test
 */

const baseUrl = 'http://localhost:3000';

async function testRegister() {
  console.log('🧪 Register Endpoint Test\n');

  const testData = {
    email: 'test@example.com',
    password: 'TestPass123!',
    passwordConfirm: 'TestPass123!',
    role: 'TALENT',
    kvkkConsent: true,
    termsConsent: true
  };

  try {
    console.log('📝 Testing register endpoint with valid JSON...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    let responseData;
    try {
      responseData = await response.json();
      console.log('✅ JSON Response parsed successfully');
      console.log('Response:', JSON.stringify(responseData, null, 2));
    } catch (jsonError) {
      console.log('❌ Failed to parse JSON response');
      console.log('Raw response:', await response.text());
    }

    if (response.ok) {
      console.log('\n✅ Register test passed!');
    } else {
      console.log('\n❌ Register test failed');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test different scenarios
async function testErrorCases() {
  console.log('\n🧪 Testing Error Cases\n');
  
  // Test 1: Empty body
  try {
    console.log('1. Testing empty body...');
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });
    console.log(`   Status: ${response.status}`);
    const result = await response.json();
    console.log(`   Message: ${result.message}`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  // Test 2: Invalid JSON
  try {
    console.log('2. Testing invalid JSON...');
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email": "test", invalid json',
    });
    console.log(`   Status: ${response.status}`);
    const result = await response.json();
    console.log(`   Message: ${result.message}`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  // Test 3: Missing content-type
  try {
    console.log('3. Testing missing content-type...');
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: 'email=test@example.com&password=123',
    });
    console.log(`   Status: ${response.status}`);
    const result = await response.json();
    console.log(`   Message: ${result.message}`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
}

async function runAllTests() {
  await testRegister();
  await testErrorCases();
  console.log('\n🏁 All tests completed');
}

runAllTests();
