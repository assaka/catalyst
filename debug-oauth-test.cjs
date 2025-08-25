#!/usr/bin/env node

console.log('🔍 Debug OAuth Test Endpoint...');
console.log('================================');

const debugOAuthTest = async () => {
  const baseUrl = 'https://catalyst-backend-fzhu.onrender.com';
  
  try {
    console.log('\n1. Testing oauth-test/callback endpoint...');
    
    const response = await fetch(baseUrl + '/api/oauth-test/callback?code=test123');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    // Get all headers
    console.log('   Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`     ${key}: ${value}`);
    }
    
    // Try to get response body
    const responseText = await response.text();
    console.log('   Response body:', responseText);
    
    console.log('\n2. Testing oauth-test/google endpoint...');
    
    const googleResponse = await fetch(baseUrl + '/api/oauth-test/google');
    console.log('   Google endpoint status:', googleResponse.status);
    console.log('   Google endpoint headers:');
    for (const [key, value] of googleResponse.headers.entries()) {
      console.log(`     ${key}: ${value}`);
    }
    
    if (googleResponse.status === 302) {
      const location = googleResponse.headers.get('location');
      console.log('   Google redirect URL:', location);
    }
    
  } catch (error) {
    console.log('❌ OAuth test debug failed:', error.message);
  }
};

debugOAuthTest();