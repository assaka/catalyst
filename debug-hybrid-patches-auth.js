/**
 * Debug script to test hybrid-patches authentication end-to-end
 */

console.log('🔍 Hybrid Patches Authentication Debug');
console.log('===================================');

// Test 1: Check what tokens are available in the production deployment
const testProductionAPI = async () => {
  try {
    console.log('\n1. Testing production API directly...');
    
    // First test: no authentication
    console.log('   Testing unauthenticated request...');
    const noAuthResponse = await fetch('https://catalyst-pearl.vercel.app/api/hybrid-patches/files/recent', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', noAuthResponse.status);
    const noAuthText = await noAuthResponse.text();
    console.log('   Response:', noAuthText.substring(0, 200));
    
    // Test with backend URL instead
    console.log('\n   Testing backend API directly...');
    const backendResponse = await fetch('https://catalyst-backend-fzhu.onrender.com/api/hybrid-patches/files/recent', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Backend Status:', backendResponse.status);
    const backendText = await backendResponse.text();
    console.log('   Backend Response:', backendText.substring(0, 200));
    
  } catch (error) {
    console.error('❌ Production API test failed:', error.message);
  }
};

// Test 2: Simulate the frontend authentication flow
const testFrontendAuth = () => {
  console.log('\n2. Testing frontend authentication flow...');
  
  // Check localStorage tokens (will be empty in Node.js but shows the pattern)
  console.log('   Token lookup pattern:');
  console.log('   - Tries localStorage.getItem("auth_token")');
  console.log('   - Falls back to localStorage.getItem("token")');
  console.log('   - Sends as: Authorization: Bearer ${token}');
  
  // Test different token formats
  const testTokens = [
    'invalid-token',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid', // Invalid JWT
    '', // Empty token
    null, // Null token
    undefined // Undefined token
  ];
  
  console.log('   Common token validation issues:');
  testTokens.forEach((token, index) => {
    console.log(`   ${index + 1}. Token: "${token}" - Type: ${typeof token} - Valid: ${!!(token && token.length > 10)}`);
  });
};

// Test 3: Check if authentication middleware logs show the issue
const testAuthMiddlewareLogging = () => {
  console.log('\n3. Authentication middleware logging analysis...');
  console.log('   The middleware logs:');
  console.log('   - 🔍 Auth middleware called for: POST /api/hybrid-patches/create');
  console.log('   - 🔍 Token present: true/false');
  console.log('   - 🔍 JWT decoded successfully: {...}');
  console.log('   - 👤 User found: {...}');
  console.log('   - ✅ Auth middleware completed successfully');
  console.log('');
  console.log('   If you see 401 "Invalid token", check which step fails:');
  console.log('   - No token provided → Frontend not sending token');
  console.log('   - JWT decode fails → Token format/signature issue');
  console.log('   - User not found → Token contains invalid user ID');
  console.log('   - Account inactive → User exists but is disabled');
};

// Main execution
const runDebug = async () => {
  await testProductionAPI();
  testFrontendAuth();
  testAuthMiddlewareLogging();
  
  console.log('\n💡 NEXT DEBUGGING STEPS:');
  console.log('   1. Check browser console for actual token being sent');
  console.log('   2. Check server logs for authentication middleware output');
  console.log('   3. Verify user is logged in with valid credentials');
  console.log('   4. Test with a fresh login to get new token');
  console.log('');
  console.log('🔧 TO FIX: ');
  console.log('   If no token → User needs to log in');
  console.log('   If invalid token → User needs to log out and log back in');
  console.log('   If expired token → User needs to log out and log back in');
  console.log('   If middleware fails → Check server logs for specific error');
};

// Run the debug script
if (typeof window !== 'undefined') {
  // Browser environment
  runDebug();
} else {
  // Node.js environment
  runDebug();
}