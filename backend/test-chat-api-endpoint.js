/**
 * Test the chat plugin API endpoints
 */

const https = require('https');

async function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   URL: ${url}`);

    https.get(url, {
      headers: {
        'User-Agent': 'Node.js Test Script'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);

        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`   ✅ Success!`);
            if (json.data) {
              if (Array.isArray(json.data)) {
                console.log(`   📊 Found ${json.data.length} items`);
              } else {
                console.log(`   📊 Data keys:`, Object.keys(json.data));
              }
            }
            resolve(json);
          } catch (error) {
            console.log(`   ❌ Invalid JSON`);
            console.log(`   Response:`, data.substring(0, 200));
            reject(error);
          }
        } else {
          console.log(`   ❌ Failed with status ${res.statusCode}`);
          console.log(`   Response:`, data.substring(0, 200));
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    }).on('error', (error) => {
      console.log(`   ❌ Request failed:`, error.message);
      reject(error);
    });
  });
}

async function runTests() {
  console.log('🚀 Testing Chat Plugin API Endpoints\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get active plugins
    await testEndpoint(
      'https://catalyst-backend-g5dd.onrender.com/api/plugins/active',
      'GET /api/plugins/active (all active plugins)'
    );

    // Test 2: Get specific plugin
    await testEndpoint(
      'https://catalyst-backend-g5dd.onrender.com/api/plugins/active/customer-service-chat',
      'GET /api/plugins/active/customer-service-chat (plugin details)'
    );

    // Test 3: Get plugin scripts (frontend only)
    const scriptsResult = await testEndpoint(
      'https://catalyst-backend-g5dd.onrender.com/api/plugins/customer-service-chat/scripts?scope=frontend',
      'GET /api/plugins/customer-service-chat/scripts (frontend scripts)'
    );

    if (scriptsResult.data && scriptsResult.data.length > 0) {
      console.log('\n📄 Frontend Scripts Found:');
      scriptsResult.data.forEach(s => {
        console.log(`   - ${s.name} (${s.content.length} chars)`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All API endpoint tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Some tests failed');
    console.log('='.repeat(60));
  }
}

runTests();
