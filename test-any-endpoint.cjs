// Test any public endpoint to see if ANY new code is deployed
const https = require('https');

// Test the main API root
const testRoot = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'catalyst-backend-fzhu.onrender.com',
      port: 443,
      path: '/',
      method: 'GET'
    };

    console.log('🔍 Testing API root...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Root response status:', res.statusCode);
        console.log('Root response:', data.substring(0, 200));
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Root request failed:', error.message);
      resolve();
    });

    req.end();
  });
};

// Test health endpoint
const testHealth = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'catalyst-backend-fzhu.onrender.com',
      port: 443,
      path: '/health',
      method: 'GET'
    };

    console.log('🔍 Testing health endpoint...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Health response status:', res.statusCode);
        console.log('Health response:', data.substring(0, 200));
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Health request failed:', error.message);
      resolve();
    });

    req.end();
  });
};

async function runTests() {
  await testRoot();
  await testHealth();
  
  // Check if deployment timestamp changed at all
  console.log('\n🕐 Current time:', new Date().toISOString());
  console.log('🔍 If deployment worked, we should see new server logs with "🚀 SERVER STARTING - VERSION 3.0"');
}

runTests();