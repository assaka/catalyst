/**
 * Test authentication issue with production backend
 */

console.log('🔍 Testing authentication with production backend...');

// Test the hybrid-patches endpoint without auth first
const backendUrl = 'https://catalyst-backend-fzhu.onrender.com';

async function testBackendAuth() {
  try {
    console.log('\n1. Testing unauthenticated call to hybrid-patches...');
    
    const response1 = await fetch(`${backendUrl}/api/hybrid-patches/files/recent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Response status:', response1.status);
    console.log('   Response headers:', Object.fromEntries(response1.headers.entries()));
    
    const text1 = await response1.text();
    console.log('   Response body:', text1);
    
    // Test with various token formats
    console.log('\n2. Testing with different token formats...');
    
    const testTokens = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      'invalid-token',
      'Bearer token-test'
    ];
    
    for (const token of testTokens) {
      console.log(`\n   Testing token: ${token.substring(0, 20)}...`);
      
      const response = await fetch(`${backendUrl}/api/hybrid-patches/files/recent`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 100)}...`);
    }
    
    console.log('\n3. Testing auth middleware directly...');
    
    // Test a simpler authenticated endpoint
    const response3 = await fetch(`${backendUrl}/api/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   /api/users/me status:', response3.status);
    const text3 = await response3.text();
    console.log('   Response:', text3);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBackendAuth();