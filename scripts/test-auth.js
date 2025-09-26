#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3001/api/v1');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Castlyo-AuthTest/1.0'
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

async function testAuth() {
  console.log('🔐 Testing Auth Endpoints...');
  
  // Test 1: Try to access auth without any path
  console.log('\n1. Testing /auth (should return method not allowed or similar)');
  try {
    const response = await makeRequest('GET', '/auth');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Try registration
  console.log('\n2. Testing POST /auth/register');
  try {
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
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Try login
  console.log('\n3. Testing POST /auth/login');
  try {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const response = await makeRequest('POST', '/auth/login', loginData);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 4: Check jobs endpoint (should require auth)
  console.log('\n4. Testing GET /jobs (should require auth)');
  try {
    const response = await makeRequest('GET', '/jobs');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testAuth().catch(console.error);
