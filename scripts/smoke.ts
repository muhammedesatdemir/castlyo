#!/usr/bin/env ts-node

/**
 * Comprehensive Smoke Test for Castlyo API
 * Tests all critical endpoints and database connectivity
 */

import axios from 'axios';

// Configuration
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const TEST_EMAIL = `smoke-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'SmokeTest123!';

console.log('🚀 Starting Castlyo API Smoke Tests...');
console.log(`📍 API Base: ${API_BASE}`);

interface TestResults {
  health: boolean;
  healthDb: boolean;
  register: boolean;
  login: boolean;
  usersMe: boolean;
  talents: boolean;
  logout: boolean;
}

let testResults: TestResults = {
  health: false,
  healthDb: false,
  register: false,
  login: false,
  usersMe: false,
  talents: false,
  logout: false,
};

let authCookies = '';

// Helper to extract cookies
function extractCookies(response: any) {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader) {
    authCookies = setCookieHeader.map((cookie: string) => cookie.split(';')[0]).join('; ');
    console.log('🍪 Cookies extracted:', authCookies);
  }
}

// Test functions
async function testHealth(): Promise<boolean> {
  try {
    console.log('\n🏥 Testing /health...');
    const response = await axios.get(`${API_BASE}/health`, { timeout: 10000 });
    console.log('✅ Health check:', response.status, response.data?.status);
    testResults.health = response.status === 200;
    return true;
  } catch (error: any) {
    console.error('❌ Health check failed:', error.response?.status, error.message);
    return false;
  }
}

async function testHealthDb(): Promise<boolean> {
  try {
    console.log('\n🗄️ Testing /health/db...');
    const response = await axios.get(`${API_BASE}/health/db`, { timeout: 15000 });
    console.log('✅ Database health check:', response.status, response.data?.database?.status);
    testResults.healthDb = response.status === 200;
    return true;
  } catch (error: any) {
    console.error('❌ Database health check failed:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

async function testRegister(): Promise<boolean> {
  try {
    console.log('\n📝 Testing registration...');
    const registerData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      role: 'TALENT',
      consents: {
        acceptedTerms: true,
        acceptedPrivacy: true,
        termsVersion: '1.0',
        privacyVersion: '1.0'
      }
    };

    const response = await axios.post(`${API_BASE}/auth/register`, registerData, {
      timeout: 15000,
      validateStatus: () => true // Accept all status codes
    });

    console.log('📊 Registration response:', response.status);
    
    if (response.status === 201) {
      console.log('✅ Registration successful');
      extractCookies(response);
      testResults.register = true;
      return true;
    } else if (response.status === 409) {
      console.log('⚠️ Email already exists (expected in repeated tests)');
      testResults.register = true;
      return true;
    } else {
      console.log('❌ Registration failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Registration error:', error.response?.data || error.message);
    return false;
  }
}

async function testLogin(): Promise<boolean> {
  try {
    console.log('\n🔐 Testing login...');
    const loginData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };

    const response = await axios.post(`${API_BASE}/auth/login`, loginData, {
      timeout: 15000,
      validateStatus: () => true
    });

    console.log('📊 Login response:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Login successful');
      extractCookies(response);
      testResults.login = true;
      return true;
    } else {
      console.log('❌ Login failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function testUsersMe(): Promise<boolean> {
  try {
    console.log('\n👤 Testing /users/me...');
    const response = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        'Cookie': authCookies
      },
      timeout: 10000,
      validateStatus: () => true
    });

    console.log('📊 Users/me response:', response.status);
    
    if (response.status === 200) {
      console.log('✅ /users/me successful');
      testResults.usersMe = true;
      return true;
    } else {
      console.log('❌ /users/me failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('❌ /users/me error:', error.response?.data || error.message);
    return false;
  }
}

async function testTalents(): Promise<boolean> {
  try {
    console.log('\n🎭 Testing /profiles/talents...');
    const response = await axios.get(`${API_BASE}/profiles/talents?limit=5`, {
      timeout: 10000,
      validateStatus: () => true
    });

    console.log('📊 Talents response:', response.status);
    
    if (response.status === 200) {
      console.log('✅ /profiles/talents successful');
      testResults.talents = true;
      return true;
    } else {
      console.log('❌ /profiles/talents failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('❌ /profiles/talents error:', error.response?.data || error.message);
    return false;
  }
}

async function testLogout(): Promise<boolean> {
  try {
    console.log('\n🚪 Testing logout...');
    const response = await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: {
        'Cookie': authCookies
      },
      timeout: 10000,
      validateStatus: () => true
    });

    console.log('📊 Logout response:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Logout successful');
      testResults.logout = true;
      return true;
    } else {
      console.log('❌ Logout failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Logout error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runSmokeTests() {
  console.log('Starting smoke tests...\n');
  
  // Critical path: Health checks first
  const healthOk = await testHealth();
  const dbHealthOk = await testHealthDb();
  
  if (!dbHealthOk) {
    console.log('\n🚨 CRITICAL: Database health check failed. Stopping tests.');
    console.log('🔧 Check DATABASE_URL and SSL configuration in environment variables.');
    process.exit(1);
  }
  
  // Authentication flow
  await testRegister();
  await testLogin();
  await testUsersMe();
  
  // Public endpoints
  await testTalents();
  
  // Cleanup
  await testLogout();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(testResults).filter(Boolean).length;
  const totalCount = Object.keys(testResults).length;
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All smoke tests passed! API is healthy.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('🔥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the tests
runSmokeTests().catch((error) => {
  console.error('🔥 Smoke test runner failed:', error.message);
  process.exit(1);
});
