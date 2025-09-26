const fetch = require('node-fetch');

async function testExistingUserLogin() {
  const payload = {
    email: "test-1758812293675@example.com", // Az önce oluşturduğumuz user
    password: "hashed_password" // Gerçek plaintext değil, bcrypt hash gerekir
  };

  try {
    console.log('🚀 Testing login with existing user:', payload.email);
    
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

  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testExistingUserLogin();
