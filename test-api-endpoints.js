/**
 * Comprehensive API Endpoint Test Script
 * Tests all critical endpoints and cookie flows
 */

const axios = require('axios');

// Configuration
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const WEB_PROXY_BASE = process.env.WEB_PROXY_BASE || 'http://localhost:3000/api/proxy/api/v1';

// Test user data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  passwordConfirm: 'TestPassword123!',
  role: 'TALENT',
  consents: {
    acceptedTerms: true,
    acceptedPrivacy: true,
    termsVersion: '1.0',
    privacyVersion: '1.0'
  }
};

// Cookie jar to track cookies
const cookieJar = new Map();

// Helper function to extract cookies from response
function extractCookies(response) {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader) {
    setCookieHeader.forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      cookieJar.set(name.trim(), value.trim());
      console.log(`🍪 Cookie set: ${name.trim()}=${value.trim()}`);
    });
  }
}

// Helper function to get cookie header
function getCookieHeader() {
  const cookies = Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return cookies || '';
}

// Test functions
async function testHealthEndpoints() {
  console.log('\n🏥 Testing Health Endpoints...');
  
  try {
    // Test basic health
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ GET /health:', healthResponse.status, healthResponse.data);
    
    // Test database health
    const dbHealthResponse = await axios.get(`${API_BASE}/health/db`);
    console.log('✅ GET /health/db:', dbHealthResponse.status, dbHealthResponse.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.response?.data || error.message);
  }
}

async function testRegistration() {
  console.log('\n📝 Testing Registration...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, testUser, {
      withCredentials: true,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log('📊 Registration Response:', response.status, response.data);
    
    if (response.status === 201) {
      console.log('✅ Registration successful');
      extractCookies(response);
      return true;
    } else {
      console.log('⚠️ Registration failed with controlled error:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  
  try {
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    
    const response = await axios.post(`${API_BASE}/auth/login`, loginData, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('📊 Login Response:', response.status, response.data);
    
    if (response.status === 200) {
      console.log('✅ Login successful');
      extractCookies(response);
      return true;
    } else {
      console.log('⚠️ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function testUsersMe() {
  console.log('\n👤 Testing /users/me...');
  
  try {
    const response = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        'Cookie': getCookieHeader()
      },
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('📊 Users/me Response:', response.status, response.data);
    
    if (response.status === 200) {
      console.log('✅ /users/me successful');
      return true;
    } else {
      console.log('⚠️ /users/me failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ /users/me error:', error.response?.data || error.message);
    return false;
  }
}

async function testProfilesTalents() {
  console.log('\n🎭 Testing /profiles/talents...');
  
  try {
    const response = await axios.get(`${API_BASE}/profiles/talents?limit=12`, {
      validateStatus: () => true
    });
    
    console.log('📊 Profiles/talents Response:', response.status, response.data);
    
    if (response.status === 200) {
      console.log('✅ /profiles/talents successful');
      return true;
    } else {
      console.log('⚠️ /profiles/talents failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ /profiles/talents error:', error.response?.data || error.message);
    return false;
  }
}

async function testLogout() {
  console.log('\n🚪 Testing Logout...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: {
        'Cookie': getCookieHeader()
      },
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('📊 Logout Response:', response.status, response.data);
    
    if (response.status === 200) {
      console.log('✅ Logout successful');
      extractCookies(response); // Should clear cookies
      return true;
    } else {
      console.log('⚠️ Logout failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Logout error:', error.response?.data || error.message);
    return false;
  }
}

async function testProxyEndpoints() {
  console.log('\n🔄 Testing Proxy Endpoints...');
  
  try {
    // Test proxy health
    const proxyHealthResponse = await axios.get(`${WEB_PROXY_BASE}/health`, {
      validateStatus: () => true
    });
    console.log('✅ Proxy GET /health:', proxyHealthResponse.status);
    
    // Test proxy login
    const proxyLoginResponse = await axios.post(`${WEB_PROXY_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('📊 Proxy Login Response:', proxyLoginResponse.status);
    
    if (proxyLoginResponse.status === 200) {
      console.log('✅ Proxy login successful');
      extractCookies(proxyLoginResponse);
      
      // Test proxy /users/me
      const proxyMeResponse = await axios.get(`${WEB_PROXY_BASE}/users/me`, {
        headers: {
          'Cookie': getCookieHeader()
        },
        withCredentials: true,
        validateStatus: () => true
      });
      
      console.log('📊 Proxy /users/me Response:', proxyMeResponse.status);
      
      if (proxyMeResponse.status === 200) {
        console.log('✅ Proxy /users/me successful');
      }
    }
    
  } catch (error) {
    console.log('⚠️ Proxy tests skipped (Web server not running):', error.code);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Comprehensive API Tests...');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log(`📍 Web Proxy Base: ${WEB_PROXY_BASE}`);
  
  const results = {
    health: false,
    registration: false,
    login: false,
    usersMe: false,
    profilesTalents: false,
    logout: false,
    proxy: false
  };
  
  // Run tests in sequence
  results.health = await testHealthEndpoints();
  results.registration = await testRegistration();
  results.login = await testLogin();
  results.usersMe = await testUsersMe();
  results.profilesTalents = await testProfilesTalents();
  results.logout = await testLogout();
  results.proxy = await testProxyEndpoints();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error);
