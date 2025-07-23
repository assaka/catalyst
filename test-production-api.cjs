#!/usr/bin/env node

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';

// Test token from our previous test
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjllYmI2Zjk4LTk4MTgtNDE0Zi1iZjRlLWY2NWVmMWZlZjlhYSIsImVtYWlsIjoicGxheWFtaW45OThAZ21haWwuY29tIiwicm9sZSI6InN0b3JlX293bmVyIiwiaWF0IjoxNzUyNzY2NjgwLCJleHAiOjE3NTMzNzE0ODB9.IfGKvFI10cNPOVUajDJV_Oa9q3dQ_Uv1S1bTAi9HQFU';

function makeRequest(path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Client'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testProductionAPI() {
  console.log('🧪 Testing production API at:', API_BASE_URL);
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    try {
      const healthResponse = await makeRequest('/health');
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Response:`, healthResponse.data);
    } catch (error) {
      console.log(`   ❌ Health check failed: ${error.message}`);
    }
    
    // Test 2: Auth endpoint without token
    console.log('\n2. Testing auth/me without token...');
    try {
      const authResponse = await makeRequest('/api/auth/me');
      console.log(`   Status: ${authResponse.status}`);
      console.log(`   Response:`, authResponse.data);
    } catch (error) {
      console.log(`   ❌ Auth test failed: ${error.message}`);
    }
    
    // Test 3: Auth endpoint with token
    console.log('\n3. Testing auth/me with token...');
    try {
      const authTokenResponse = await makeRequest('/api/auth/me', TEST_TOKEN);
      console.log(`   Status: ${authTokenResponse.status}`);
      console.log(`   Response:`, JSON.stringify(authTokenResponse.data, null, 2));
    } catch (error) {
      console.log(`   ❌ Auth with token failed: ${error.message}`);
    }
    
    // Test 4: Stores endpoint with token
    console.log('\n4. Testing /api/stores with token...');
    try {
      const storesResponse = await makeRequest('/api/stores', TEST_TOKEN);
      console.log(`   Status: ${storesResponse.status}`);
      if (storesResponse.status === 200) {
        console.log(`   Found ${Array.isArray(storesResponse.data) ? storesResponse.data.length : 'unknown'} stores`);
        if (Array.isArray(storesResponse.data) && storesResponse.data.length > 0) {
          console.log('   First store:', storesResponse.data[0].name);
        }
      } else {
        console.log(`   Response:`, storesResponse.data);
      }
    } catch (error) {
      console.log(`   ❌ Stores test failed: ${error.message}`);
    }
    
    // Test 5: Stores debug endpoint
    console.log('\n5. Testing /api/stores/debug...');
    try {
      const debugResponse = await makeRequest('/api/stores/debug', TEST_TOKEN);
      console.log(`   Status: ${debugResponse.status}`);
      console.log(`   Response:`, JSON.stringify(debugResponse.data, null, 2));
    } catch (error) {
      console.log(`   ❌ Debug test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  console.log('\n🎉 Production API test completed!');
}

testProductionAPI();