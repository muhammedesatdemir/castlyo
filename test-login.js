const fetch = require('node-fetch');

async function testLogin() {
  const payload = {
    email: "test@example.com",
    password: "password123"
  };

  try {
    console.log('🚀 Testing login with payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log('📊 Response status:', response.status);
    console.log('📄 Response body:', text);

    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testLogin();
