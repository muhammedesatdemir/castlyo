const fetch = require('node-fetch');

async function createTalentProfile() {
  try {
    console.log('🎭 Creating Talent Profile...\n');

    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestPass123!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;
    console.log('✅ Login successful');

    // 2. Create talent profile
    console.log('\n2. Creating talent profile...');
    const profileResponse = await fetch('http://localhost:3001/api/v1/profiles/talent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        city: 'İstanbul',
        bio: 'Test talent profile for application testing',
        skills: ['ACTING', 'MODELING'],
        languages: ['TURKISH', 'ENGLISH'],
        specialties: ['ACTING', 'MODELING'],
        height: 180,
        weight: 75,
        eyeColor: 'BROWN',
        hairColor: 'BLACK',
        isPublic: true
      })
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json().catch(() => ({}));
      throw new Error(`Profile creation failed: ${profileResponse.status} - ${errorData.message || 'Unknown error'}`);
    }

    const profileData = await profileResponse.json();
    console.log('✅ Talent profile created!');
    console.log('   Profile ID:', profileData.id);

    console.log('\n🎉 Talent profile creation completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

createTalentProfile();
