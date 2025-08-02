const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'; // Adjust to your backend URL
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-auth-token'; // You'll need a valid auth token

async function testRoutes() {
  console.log('🧪 Testing Akeneo Integration Routes...\n');

  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Debug endpoint (should work without authentication issues)
    console.log('1️⃣ Testing debug endpoint...');
    try {
      const response = await fetch(`${BASE_URL}/api/integrations/test`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Debug endpoint working:', data.message);
      } else {
        console.log('❌ Debug endpoint failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Debug endpoint error:', error.message);
    }

    // Test 2: Test connection endpoint
    console.log('\n2️⃣ Testing test-connection endpoint...');
    try {
      const response = await fetch(`${BASE_URL}/api/integrations/akeneo/test-connection`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          baseUrl: 'https://demo.akeneo.com',
          clientId: 'test_client',
          clientSecret: 'test_secret',
          username: 'test_user',
          password: 'test_pass'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Test connection endpoint accessible (expected to fail with invalid credentials)');
        console.log('Response:', data);
      } else {
        console.log('❌ Test connection endpoint failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error details:', errorText);
      }
    } catch (error) {
      console.log('❌ Test connection error:', error.message);
    }

    // Test 3: Config status endpoint
    console.log('\n3️⃣ Testing config-status endpoint...');
    try {
      const response = await fetch(`${BASE_URL}/api/integrations/akeneo/config-status`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Config status endpoint working');
        console.log('Response:', data);
      } else {
        console.log('❌ Config status endpoint failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Config status error:', error.message);
    }

    // Test 4: Locales endpoint
    console.log('\n4️⃣ Testing locales endpoint...');
    try {
      const response = await fetch(`${BASE_URL}/api/integrations/akeneo/locales`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Locales endpoint working');
        console.log('Available locales:', data.locales?.length || 0);
      } else {
        console.log('❌ Locales endpoint failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Locales error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  console.log('\n🏁 Route testing completed!');
}

// Instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 Akeneo Integration Route Tester

Usage:
  node test-integration-routes.js

Environment Variables:
  BASE_URL - Backend URL (default: http://localhost:5000)
  AUTH_TOKEN - Valid authentication token for API access

Example:
  BASE_URL=https://your-backend.com AUTH_TOKEN=your-token node test-integration-routes.js

Note: You'll need a valid authentication token to test the protected routes.
  `);
  process.exit(0);
}

// Run tests
testRoutes().catch(console.error);