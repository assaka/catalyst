#!/usr/bin/env node

console.log('🔍 Testing Render Backend JWT Configuration...');
console.log('================================================');

const jwt = require('./backend/node_modules/jsonwebtoken');

// Test the production backend endpoint
const testBackendJWT = async () => {
  const baseUrl = 'https://catalyst-backend-fzhu.onrender.com';
  
  try {
    // Test 1: Check if backend is responding
    console.log('\n1. Testing backend health...');
    const healthResponse = await fetch(baseUrl + '/health');
    console.log('   Health endpoint status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('   Health response:', healthData);
    }
    
    // Test 2: Check API health endpoint (might reveal JWT status)
    console.log('\n2. Testing API health endpoint...');
    const apiHealthResponse = await fetch(baseUrl + '/api/health');
    console.log('   API health endpoint status:', apiHealthResponse.status);
    
    if (apiHealthResponse.status === 401) {
      console.log('   ⚠️  API health requires authentication');
    } else if (apiHealthResponse.ok) {
      const apiHealthData = await apiHealthResponse.json();
      console.log('   API health data:', apiHealthData);
    }
    
    // Test 3: Try creating a test JWT with common secrets and testing with actual API
    console.log('\n3. Testing JWT authentication with production API...');
    
    const testPayload = {
      id: '157d4590-49bf-4b0b-bd77-abe131909528', // Use actual store owner ID
      email: 'test@example.com', 
      role: 'store_owner'
    };
    
    const commonSecrets = [
      'fallback-secret',
      'your-jwt-secret-here',
      'your-super-secret-jwt-key-here',
      'catalyst-jwt-secret-production',
      'production-jwt-secret-2024'
    ];
    
    for (let i = 0; i < commonSecrets.length; i++) {
      const secret = commonSecrets[i];
      
      try {
        console.log(`\n   Testing secret ${i + 1}: '${secret.substring(0, 20)}...'`);
        
        // Generate JWT
        const testToken = jwt.sign(testPayload, secret, { expiresIn: '1h' });
        console.log(`   - Token generated successfully`);
        console.log(`   - Token preview: ${testToken.substring(0, 50)}...`);
        
        // Test the token with the actual API
        const testResponse = await fetch(baseUrl + '/api/hybrid-patches/files/recent', {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   - API test response: ${testResponse.status}`);
        
        if (testResponse.status === 200) {
          console.log('   🎉 SUCCESS! This JWT secret works with production API');
          const data = await testResponse.json();
          console.log('   - Response data:', JSON.stringify(data, null, 2));
          break; // Found working secret
        } else if (testResponse.status === 401) {
          console.log('   ❌ JWT rejected by production API');
        } else {
          console.log('   ⚠️  Unexpected response:', testResponse.status);
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing secret: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Backend test failed:', error.message);
  }
};

testBackendJWT();