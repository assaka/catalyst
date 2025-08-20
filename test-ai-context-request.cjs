const https = require('https');
const http = require('http');

console.log('🧪 Testing AI Context API request (mimicking frontend)...');

async function testAPIRequest() {
  const requestData = JSON.stringify({
    prompt: "Add a new function called fetchUserData that takes a userId parameter",
    sourceCode: `import React from 'react';

const MyComponent = () => {
  return <div>Hello World</div>;
};

export default MyComponent;`,
    filePath: 'TestComponent.jsx',
    context: {
      timestamp: new Date().toISOString()
    }
  });

  // Test against localhost first
  console.log('\n1. Testing against localhost...');
  await testEndpoint('localhost', 3000, requestData, 'test-token');

  // Test against production backend
  console.log('\n2. Testing against production backend...');
  await testProductionEndpoint(requestData);
}

function testEndpoint(hostname, port, data, token) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      path: '/api/ai-context/nl-to-patch',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`
      }
    };

    console.log(`   Making request to http://${hostname}:${port}${options.path}`);

    const req = http.request(options, (res) => {
      let responseData = '';
      
      console.log(`   Response status: ${res.statusCode}`);
      console.log(`   Response headers:`, JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`   Response body:`, JSON.stringify(parsed, null, 2));
        } catch (parseError) {
          console.log(`   Raw response:`, responseData);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Request error: ${error.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`   ❌ Request timeout`);
      req.destroy();
      resolve();
    });

    req.setTimeout(5000);
    req.write(data);
    req.end();
  });
}

function testProductionEndpoint(data) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'catalyst-backend-fzhu.onrender.com',
      port: 443,
      path: '/api/ai-context/nl-to-patch',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer test-token'
      }
    };

    console.log(`   Making request to https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log(`   Response status: ${res.statusCode}`);

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`   Response:`, parsed.success ? '✅ SUCCESS' : '❌ FAILED');
          if (!parsed.success) {
            console.log(`   Error:`, parsed.message);
          } else {
            console.log(`   Patch operations:`, parsed.data?.patch?.length || 0);
          }
        } catch (parseError) {
          console.log(`   Parse error:`, parseError.message);
          console.log(`   Raw response (first 200 chars):`, responseData.substring(0, 200));
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Request error: ${error.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`   ❌ Request timeout`);
      req.destroy();
      resolve();
    });

    req.setTimeout(10000);
    req.write(data);
    req.end();
  });
}

testAPIRequest().catch(error => {
  console.error('❌ Test failed:', error.message);
});