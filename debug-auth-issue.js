/**
 * Debug authentication issue for hybrid-patches API
 */

console.log('🔍 Debugging authentication issue...');

// Check what tokens are in localStorage
const authToken = localStorage.getItem('auth_token');
const token = localStorage.getItem('token');

console.log('📋 localStorage tokens:');
console.log('  auth_token:', authToken ? `Present (${authToken.length} chars, starts with: ${authToken.substring(0, 20)}...)` : 'Missing');
console.log('  token:', token ? `Present (${token.length} chars, starts with: ${token.substring(0, 20)}...)` : 'Missing');

// Test API call with detailed logging
const testToken = authToken || token;
if (testToken) {
  console.log('\n🧪 Testing API call...');
  
  fetch('/api/hybrid-patches/files/recent', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(text => {
    console.log('📡 API Response body:', text);
    try {
      const json = JSON.parse(text);
      console.log('📡 Parsed JSON:', json);
    } catch (e) {
      console.log('📡 Response is not JSON');
    }
  })
  .catch(error => {
    console.error('❌ API Test failed:', error);
  });
} else {
  console.log('❌ No token available for testing');
}