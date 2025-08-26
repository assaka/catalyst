/**
 * Debug 401 Token Issue for Auto-Save
 * Run this in browser console to compare token behavior across endpoints
 */

console.log('🔍 Debugging 401 Token Issue');
console.log('============================');

const testTokenAcrossEndpoints = async () => {
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  const selectedToken = authToken || token;
  
  if (!selectedToken) {
    console.log('❌ No token found');
    return;
  }
  
  console.log('🔑 Using token:', selectedToken.substring(0, 20) + '...');
  
  // Test different endpoints to compare behavior
  const endpoints = [
    { name: 'Auto-Save (FAILING)', url: '/api/hybrid-patches/create', method: 'POST', body: {
      filePath: 'src/test/TokenTest.jsx',
      originalCode: 'test',
      modifiedCode: 'test modified',
      changeSummary: 'Token debug test',
      changeType: 'manual_edit'
    }},
    { name: 'User Profile', url: '/api/users/profile', method: 'GET' },
    { name: 'Stores List', url: '/api/stores', method: 'GET' },
    { name: 'Recent Files', url: '/api/hybrid-patches/files/recent', method: 'GET' }
  ];
  
  console.log('\n📊 Testing token across multiple endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${selectedToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      console.log(`🧪 Testing ${endpoint.name}...`);
      const response = await fetch(endpoint.url, options);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      } else if (response.ok) {
        console.log(`   ✅ Success`);
      } else {
        const errorText = await response.text();
        console.log(`   ⚠️ Status ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log(''); // Add spacing
  }
};

const analyzeToken = () => {
  console.log('\n🔍 Token Analysis:');
  
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  const selectedToken = authToken || token;
  
  if (!selectedToken) {
    console.log('❌ No token found');
    return;
  }
  
  try {
    const parts = selectedToken.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format');
      return;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('📋 Token Payload:');
    console.log('   User ID:', payload.id);
    console.log('   Email:', payload.email);
    console.log('   Role:', payload.role);
    console.log('   Issued At:', new Date(payload.iat * 1000).toLocaleString());
    console.log('   Expires At:', new Date(payload.exp * 1000).toLocaleString());
    console.log('   Expired:', payload.exp < Date.now() / 1000);
    
    if (payload.exp < Date.now() / 1000) {
      console.log('⚠️ TOKEN IS EXPIRED - This could be the issue!');
    }
    
    // Check if token has required fields for auto-save
    const hasRequiredFields = payload.id && payload.email && payload.role;
    console.log('   Has required fields:', hasRequiredFields);
    
  } catch (error) {
    console.log('❌ Error parsing token:', error.message);
  }
};

const checkAutoSaveSpecificIssues = () => {
  console.log('\n🔍 Auto-Save Specific Analysis:');
  console.log('If other endpoints work but auto-save fails, possible causes:');
  console.log('1. Auto-save endpoint using different auth middleware');
  console.log('2. Auto-save endpoint has additional validation');
  console.log('3. Token expiring between login and auto-save attempt');
  console.log('4. Different JWT_SECRET between environments');
  console.log('5. Auto-save endpoint not properly configured');
};

const suggestSolutions = () => {
  console.log('\n💡 Suggested Solutions:');
  console.log('1. Try logging out and logging back in to refresh token');
  console.log('2. Clear localStorage and re-authenticate');
  console.log('3. Check if token expiration is causing issues');
  console.log('4. Verify backend auto-save route configuration');
};

// Make functions available globally
window.testTokenAcrossEndpoints = testTokenAcrossEndpoints;
window.analyzeToken = analyzeToken;

console.log('\n🎯 IMMEDIATE ACTIONS:');
console.log('1. Run: testTokenAcrossEndpoints()');
console.log('2. Run: analyzeToken()');
console.log('3. Compare which endpoints work vs fail');

// Auto-run analysis
console.log('\n🚀 Running automatic analysis...\n');
analyzeToken();
checkAutoSaveSpecificIssues();
suggestSolutions();

// Auto-run endpoint tests
setTimeout(() => {
  testTokenAcrossEndpoints();
}, 1000);