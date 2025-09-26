const fetch = require('node-fetch');

async function testRegister() {
  const payload = {
    email: "testuser3@example.com",
    password: "Password123!",
    passwordConfirm: "Password123!",
    role: "TALENT",
    kvkkConsent: true,
    termsConsent: true
  };

  try {
    console.log('🚀 Testing registration with payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('http://localhost:3001/api/v1/auth/register', {
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
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed');
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testRegister();