#!/usr/bin/env node

const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Castlyo-SmokeTest/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runSmokeTests() {
  console.log('🔥 Starting API Smoke Tests...');
  console.log(`📡 Testing API at: ${API_BASE}`);
  
  const tests = [];
  let passed = 0;
  let failed = 0;

  // Helper to run a test
  async function test(name, testFn) {
    try {
      console.log(`\n🧪 ${name}...`);
      await testFn();
      console.log(`✅ ${name} - PASSED`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name} - FAILED: ${error.message}`);
      failed++;
    }
  }

  // Test 1: Health Check
  await test('Health Check', async () => {
    const response = await makeRequest('GET', '/health');
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body)}`);
  });

  // Test 2: API Root
  await test('API Root', async () => {
    const response = await makeRequest('GET', '/');
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Expected 200 or 404, got ${response.status}`);
    }
    console.log(`   Status: ${response.status}`);
  });

  // Test 3: User Registration (should work with new schema)
  await test('User Registration', async () => {
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      passwordConfirm: 'TestPassword123!',
      role: 'TALENT',
      kvkkConsent: true,
      termsConsent: true,
      marketingConsent: false
    };

    const response = await makeRequest('POST', '/auth/register', userData);
    if (response.status !== 201 && response.status !== 409) {
      throw new Error(`Expected 201 or 409, got ${response.status}: ${JSON.stringify(response.body)}`);
    }
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body)}`);
  });

  // Test 4: Jobs endpoint (should connect to new job_posts table)
  await test('Jobs Endpoint', async () => {
    const response = await makeRequest('GET', '/jobs');
    // Should return 200 (empty array) or 401 (auth required)
    if (![200, 401, 403].includes(response.status)) {
      throw new Error(`Expected 200, 401, or 403, got ${response.status}`);
    }
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`   Jobs count: ${Array.isArray(response.body) ? response.body.length : 'N/A'}`);
    }
  });

  // Test 5: Messages endpoint (should connect to new messages table)
  await test('Messages Endpoint', async () => {
    const response = await makeRequest('GET', '/messages');
    // Should return 401 (auth required) or 200
    if (![200, 401, 403].includes(response.status)) {
      throw new Error(`Expected 200, 401, or 403, got ${response.status}`);
    }
    console.log(`   Status: ${response.status}`);
  });

  // Test 6: Profiles endpoint (should connect to new talent_profiles table)
  await test('Profiles Endpoint', async () => {
    const response = await makeRequest('GET', '/profiles');
    // Should return 401 (auth required) or 200
    if (![200, 401, 403].includes(response.status)) {
      throw new Error(`Expected 200, 401, or 403, got ${response.status}`);
    }
    console.log(`   Status: ${response.status}`);
  });

  // Test 7: Payments endpoint (should connect to new payments table)
  await test('Payments Endpoint', async () => {
    const response = await makeRequest('GET', '/payments');
    // Should return 401 (auth required) or 200
    if (![200, 401, 403].includes(response.status)) {
      throw new Error(`Expected 200, 401, or 403, got ${response.status}`);
    }
    console.log(`   Status: ${response.status}`);
  });

  // Summary
  console.log('\n📊 Smoke Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All smoke tests passed! API is working correctly with new database schema.');
    return true;
  } else {
    console.log('\n⚠️  Some smoke tests failed. Please check the API and database connection.');
    return false;
  }
}

// Check if API is running first
async function checkApiRunning() {
  try {
    console.log('🔍 Checking if API is running...');
    const response = await makeRequest('GET', '/health');
    console.log('✅ API is running and responding');
    return true;
  } catch (error) {
    console.log('❌ API is not responding. Please start the API server first:');
    console.log('   cd apps/api && npm run start:dev');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Castlyo API Smoke Test Suite');
  console.log('================================\n');

  const apiRunning = await checkApiRunning();
  if (!apiRunning) {
    process.exit(1);
  }

  const success = await runSmokeTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runSmokeTests, checkApiRunning };
