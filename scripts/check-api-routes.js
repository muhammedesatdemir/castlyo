#!/usr/bin/env node

const http = require('http');

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3001');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Castlyo-RouteCheck/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkRoutes() {
  console.log('🔍 Checking API routes...');
  
  const routes = [
    '/',
    '/api/docs',
    '/api/v1',
    '/api/v1/health',
    '/health',
    '/api/v1/auth',
    '/auth'
  ];

  for (const route of routes) {
    try {
      console.log(`\n📍 Testing: ${route}`);
      const response = await makeRequest('GET', route);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            const json = JSON.parse(response.body);
            console.log(`   Response: ${JSON.stringify(json).substring(0, 100)}...`);
          } catch (e) {
            console.log(`   Response: JSON parse error`);
          }
        } else {
          console.log(`   Content-Type: ${contentType}`);
          console.log(`   Response length: ${response.body.length} chars`);
        }
      }
      
      if (response.status === 404) {
        console.log(`   ❌ Not found`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }
}

checkRoutes().catch(console.error);
