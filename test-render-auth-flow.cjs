#!/usr/bin/env node

console.log('🔍 Testing Render Production Authentication Flow...');
console.log('===================================================');

// Test if we can get a valid JWT from the production auth endpoint
const testProductionAuth = async () => {
  const baseUrl = 'https://catalyst-backend-fzhu.onrender.com';
  
  try {
    console.log('\n1. Testing OAuth test endpoint (uses fallback JWT)...');
    
    // The oauth-test endpoint uses fallback JWT secret
    const oauthTestResponse = await fetch(baseUrl + '/api/oauth-test/callback?code=test123');
    console.log('   OAuth test response status:', oauthTestResponse.status);
    
    if (oauthTestResponse.status === 302) {
      console.log('   ✅ OAuth test endpoint is working (redirect response)');
      const location = oauthTestResponse.headers.get('location');
      console.log('   Redirect location:', location);
      
      // Extract token from redirect URL if present
      if (location && location.includes('token=')) {
        const tokenMatch = location.match(/token=([^&]+)/);
        if (tokenMatch) {
          const testToken = tokenMatch[1];
          console.log('   📋 Extracted token from oauth-test:', testToken.substring(0, 50) + '...');
          
          // Test this token with the API
          console.log('\n2. Testing extracted token with API...');
          const apiTestResponse = await fetch(baseUrl + '/api/hybrid-patches/files/recent', {
            headers: {
              'Authorization': `Bearer ${testToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('   API test with oauth token:', apiTestResponse.status);
          
          if (apiTestResponse.status === 200) {
            console.log('   🎉 SUCCESS! OAuth test token works with production API');
            const data = await apiTestResponse.json();
            console.log('   Response:', JSON.stringify(data, null, 2));
          } else if (apiTestResponse.status === 401) {
            console.log('   ❌ OAuth token also rejected - different JWT secrets in use');
          }
        }
      }
    }
    
    console.log('\n3. Checking for environment variable hints...');
    
    // Try to get server info that might reveal JWT status
    const serverInfoResponse = await fetch(baseUrl + '/health');
    if (serverInfoResponse.ok) {
      const serverInfo = await serverInfoResponse.json();
      console.log('   Server info:', serverInfo);
      
      if (serverInfo.environment === 'production') {
        console.log('   ✅ Confirmed production environment');
        console.log('   🔍 Server uptime:', serverInfo.uptime, 'seconds');
      }
    }
    
    console.log('\n4. Testing if any unprotected endpoints exist...');
    
    // Try some endpoints that might not require auth
    const testEndpoints = [
      '/api/stores/public',
      '/api/health/public', 
      '/api/config',
      '/api/status'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(baseUrl + endpoint);
        console.log(`   ${endpoint}: ${response.status}`);
        
        if (response.status === 200) {
          const data = await response.text();
          console.log(`     Content: ${data.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`   ${endpoint}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Production auth flow test failed:', error.message);
  }
};

testProductionAuth();