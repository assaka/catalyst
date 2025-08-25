#!/usr/bin/env node

console.log('🔍 Testing Correct Backend URL...');
console.log('==================================');

const testBackendURLs = async () => {
  // From the render.yaml, the correct backend URL should be:
  const possibleURLs = [
    'https://catalyst-backend.onrender.com',     // From check-render-status.js
    'https://catalyst-backend-fzhu.onrender.com', // From frontend .env
    'https://catalyst-backend-fzhu.onrender.com:10000',
  ];
  
  for (const baseUrl of possibleURLs) {
    console.log(`\n📡 Testing: ${baseUrl}`);
    
    try {
      // Test health endpoint
      const healthResponse = await fetch(baseUrl + '/health');
      console.log(`   /health: ${healthResponse.status}`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('   Health data:', healthData);
        
        if (healthData && healthData.environment === 'production') {
          console.log('   ✅ This looks like the correct backend URL!');
          
          // Now test the oauth-test endpoint
          console.log('   Testing oauth-test/callback...');
          const oauthResponse = await fetch(baseUrl + '/api/oauth-test/callback?code=test123');
          console.log(`   OAuth test status: ${oauthResponse.status}`);
          
          if (oauthResponse.status === 302) {
            console.log('   🎉 Got redirect (expected)');
            const location = oauthResponse.headers.get('location');
            console.log('   Redirect to:', location);
            
            // Extract JWT from redirect
            if (location && location.includes('token=')) {
              const tokenMatch = location.match(/token=([^&]+)/);
              if (tokenMatch) {
                const token = tokenMatch[1];
                console.log('   📋 Extracted JWT token:', token.substring(0, 50) + '...');
                
                // Test the token with the API
                console.log('   Testing token with API...');
                const apiResponse = await fetch(baseUrl + '/api/hybrid-patches/files/recent', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log(`   API test result: ${apiResponse.status}`);
                
                if (apiResponse.status === 200) {
                  console.log('   🎉 SUCCESS! Token works with production API!');
                  const apiData = await apiResponse.json();
                  console.log('   API response:', JSON.stringify(apiData, null, 2));
                } else if (apiResponse.status === 401) {
                  console.log('   ❌ Token rejected by API');
                }
              }
            }
          } else {
            console.log(`   ⚠️  Unexpected oauth response: ${oauthResponse.status}`);
            const oauthText = await oauthResponse.text();
            console.log('   Response:', oauthText.substring(0, 200) + '...');
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
};

testBackendURLs();