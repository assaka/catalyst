// Debug script to test FileTreeNavigator authentication
console.log('🔍 Debugging FileTreeNavigator Authentication Issue');
console.log('='.repeat(60));

// Test 1: Check current authentication state
console.log('\n1. Current Authentication State:');
const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
const storeOwnerUser = localStorage.getItem('store_owner_user_data');
const loggedOut = localStorage.getItem('user_logged_out');

console.log('  Store Owner Token:', storeOwnerToken ? `Present (${storeOwnerToken.length} chars)` : 'Missing');
console.log('  Store Owner User Data:', storeOwnerUser ? 'Present' : 'Missing');
console.log('  Logged Out Flag:', loggedOut);

if (storeOwnerUser) {
  try {
    const userData = JSON.parse(storeOwnerUser);
    console.log('  User Role:', userData.role);
    console.log('  User Email:', userData.email);
  } catch (e) {
    console.log('  Error parsing user data:', e.message);
  }
}

// Test 2: Check API Client state
console.log('\n2. API Client State:');
if (typeof window !== 'undefined' && window.apiClient) {
  console.log('  API Client Available:', true);
  console.log('  API Client isLoggedOut:', window.apiClient.isLoggedOut);
  console.log('  API Client getToken():', window.apiClient.getToken() ? 'Token present' : 'No token');
  
  // Check URL context
  const currentPath = window.location.pathname.toLowerCase();
  console.log('  Current Path:', currentPath);
  console.log('  Is Admin Context:', currentPath.startsWith('/admin/') || currentPath === '/dashboard' || currentPath.includes('/ai-context-window'));
} else {
  console.log('  API Client Available:', false);
}

// Test 3: Test proxy-source-files API directly
console.log('\n3. Testing proxy-source-files API:');

async function testAPI() {
  try {
    if (!window.apiClient) {
      console.log('  ❌ API Client not available');
      return;
    }
    
    console.log('  Making API call to proxy-source-files/list...');
    const response = await window.apiClient.get('proxy-source-files/list?path=src');
    console.log('  ✅ API call successful:', response);
    console.log('  Response keys:', Object.keys(response));
    console.log('  Files found:', response.files?.length || 0);
    
    if (response.files && response.files.length > 0) {
      console.log('  Sample files:', response.files.slice(0, 3).map(f => f.path));
    }
  } catch (error) {
    console.log('  ❌ API call failed:', error.message);
    console.log('  Error status:', error.status);
    
    if (error.status === 401) {
      console.log('  🔍 401 Unauthorized - Authentication issue confirmed');
      
      // Check if token is actually being sent
      const token = window.apiClient.getToken();
      if (token) {
        console.log('  🔍 Token exists but server rejected it');
        console.log('  🔍 This suggests either:');
        console.log('    - Token is invalid/expired');
        console.log('    - Server authentication middleware issue');
        console.log('    - Token format/signature problem');
      } else {
        console.log('  🔍 No token being sent - this is the core issue');
        console.log('  🔍 Need to ensure proper authentication context');
      }
    }
  }
}

// Run the test
if (typeof window !== 'undefined') {
  testAPI().catch(console.error);
} else {
  console.log('Not running in browser environment');
}

// Test 4: Provide fix recommendations
console.log('\n4. Fix Recommendations:');
console.log('  If no token is being sent:');
console.log('    - Ensure FileTreeNavigator is wrapped in AuthMiddleware');
console.log('    - Check if user is properly logged in');
console.log('    - Verify API client context detection');
console.log('  If token exists but is rejected:');
console.log('    - Check if token is valid/not expired');
console.log('    - Test token with other authenticated endpoints');
console.log('    - Verify server-side authentication middleware');