const https = require('https');

const testEndpoints = [
  '/api/db-test/all',
  '/api/db-test/direct',
  '/api/db-test/supabase-direct',
  '/api/db-test/connection-string'
];

async function testLiveConnection(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'catalyst-backend-fzhu.onrender.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ endpoint, status: res.statusCode, data: result });
        } catch (e) {
          resolve({ endpoint, status: res.statusCode, error: 'Failed to parse response' });
        }
      });
    }).on('error', (err) => {
      resolve({ endpoint, error: err.message });
    });
  });
}

async function runTests() {
  console.log('Testing database connections on Render.com deployment...\n');
  
  for (const endpoint of testEndpoints) {
    console.log(`\nTesting ${endpoint}...`);
    const result = await testLiveConnection(endpoint);
    
    if (result.error) {
      console.error(`❌ Error: ${result.error}`);
    } else if (result.status !== 200) {
      console.error(`❌ HTTP ${result.status}`);
    } else {
      console.log(`✅ HTTP ${result.status}`);
      console.log(JSON.stringify(result.data, null, 2));
    }
  }
}

runTests().catch(console.error);