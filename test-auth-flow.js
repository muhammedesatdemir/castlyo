const https = require('https');
const http = require('http');

// HTTP isteği yapmak için yardımcı fonksiyon
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAuthFlow() {
  console.log('🧪 Testing Auth Flow...\n');

  try {
    // 1. CSRF token al
    console.log('1️⃣ Getting CSRF token...');
    const csrfRes = await makeRequest('http://localhost:3000/api/auth/csrf');
    console.log('CSRF Status:', csrfRes.status);
    console.log('CSRF Token:', csrfRes.data.csrfToken ? '✅ Received' : '❌ Missing');
    console.log('');

    // 2. Providers kontrol et
    console.log('2️⃣ Checking providers...');
    const providersRes = await makeRequest('http://localhost:3000/api/auth/providers');
    console.log('Providers Status:', providersRes.status);
    console.log('Credentials Provider:', providersRes.data.credentials ? '✅ Available' : '❌ Missing');
    console.log('');

    // 3. Session kontrol et (giriş yapmadan)
    console.log('3️⃣ Checking session (before login)...');
    const sessionRes = await makeRequest('http://localhost:3000/api/auth/session');
    console.log('Session Status:', sessionRes.status);
    console.log('Session Data:', JSON.stringify(sessionRes.data, null, 2));
    console.log('');

    // 4. NextAuth ile giriş yap
    console.log('4️⃣ Attempting login via NextAuth...');
    const loginData = `email=test@example.com&password=Password123!&csrfToken=${csrfRes.data.csrfToken}&callbackUrl=http://localhost:3000&redirect=false`;

    const loginRes = await makeRequest('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `next-auth.csrf-token=${csrfRes.data.csrfToken}`
      },
      body: loginData
    });

    console.log('Login Status:', loginRes.status);
    console.log('Login Response:', JSON.stringify(loginRes.data, null, 2));
    console.log('');

    // 5. Session kontrol et (giriş yaptıktan sonra)
    console.log('5️⃣ Checking session (after login)...');
    const sessionRes2 = await makeRequest('http://localhost:3000/api/auth/session');
    console.log('Session Status:', sessionRes2.status);
    console.log('Session Data:', JSON.stringify(sessionRes2.data, null, 2));
    
    if (sessionRes2.data.__probe === 'v7.2-probe') {
      console.log('✅ Auth probe detected - NextAuth working!');
    }
    
    if (sessionRes2.data.access_token) {
      console.log('✅ Access token found in session!');
    } else {
      console.log('❌ No access token in session');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthFlow();