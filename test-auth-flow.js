#!/usr/bin/env node

/**
 * E2E Auth Flow Test Script
 * Tests: Register → Verify → Login
 */

const baseUrl = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🚀 Auth Flow Test Başlıyor...\n');

  // Test data
  const testUser = {
    email: 'test@example.com',
    password: 'TestPass123!',
    passwordConfirm: 'TestPass123!',
    role: 'TALENT',
    kvkkConsent: true,
    termsConsent: true,
    firstName: 'Test',
    lastName: 'User'
  };

  try {
    // 1. REGISTER TEST
    console.log('📝 1. KAYIT TESTI');
    console.log(`Email: ${testUser.email}`);
    
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    console.log(`Register Response Status: ${registerResponse.status}`);
    console.log(`Register Response:`, registerData);

    if (!registerResponse.ok) {
      throw new Error(`Register failed: ${registerData.message || registerData.error}`);
    }

    console.log('✅ Kayıt başarılı!\n');

    // 2. MOCK VERIFICATION (simulating clicking email link)
    console.log('📧 2. E-POSTA DOĞRULAMA TESTI');
    console.log('Terminal loglarından verification token\'ı bulup test edeceğiz...');
    
    // For now, let's create a mock token to test the verification endpoint
    // In real scenario, this would come from the email link
    const mockToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    console.log(`Mock token ile test: ${mockToken.substring(0, 16)}...`);
    
    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: mockToken }),
    });

    const verifyData = await verifyResponse.json();
    console.log(`Verify Response Status: ${verifyResponse.status}`);
    console.log(`Verify Response:`, verifyData);

    // Don't fail the test if verification fails with mock token
    // This is expected since we're using a fake token
    if (verifyResponse.status === 400) {
      console.log('⚠️  Mock token ile beklenen hata (gerçek token gerekli)');
    }

    console.log('ℹ️  Gerçek test için terminal loglarından verification linkini kullanın\n');

    // 3. LOGIN TEST (will fail if not verified, but let's test the flow)
    console.log('🔐 3. GİRİŞ TESTI');
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        csrfToken: 'test', // This might be needed for NextAuth
      }),
    });

    console.log(`Login Response Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`Login Response:`, loginData);
      console.log('✅ Giriş başarılı!');
    } else {
      console.log('❌ Giriş başarısız (beklenen - e-posta doğrulanmamış olabilir)');
      console.log('Response:', await loginResponse.text());
    }

    console.log('\n📊 TEST TAMAMLANDI');
    console.log('Terminal loglarını kontrol ederek Mock Store istatistiklerini görebilirsiniz.');
    
  } catch (error) {
    console.error('❌ Test Hatası:', error.message);
    console.error(error);
  }
}

// Wait a bit for the server to start, then run test
setTimeout(() => {
  testAuthFlow();
}, 3000);
