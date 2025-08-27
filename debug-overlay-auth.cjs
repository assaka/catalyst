// Debug overlay API authentication issue
console.log('🔍 Debugging Overlay Authentication Issue');
console.log('='.repeat(50));

// Test 1: Check if we're in the right path context
console.log('\n1. Path Context Analysis:');
const currentPath = '/ai-context-window';
console.log('   Current Path: ' + currentPath);

const isAdminContext = currentPath.startsWith('/admin/') ||
                      currentPath === '/dashboard' || 
                      currentPath === '/auth' ||
                      currentPath === '/ai-context-window' ||
                      currentPath.startsWith('/editor/') ||
                      currentPath.includes('/dashboard') || 
                      currentPath.includes('/products') || 
                      currentPath.includes('/categories') || 
                      currentPath.includes('/settings') ||
                      currentPath.includes('/file-library');

console.log('   Is Admin Context: ' + isAdminContext);

// Test 2: Simulate token detection logic
console.log('\n2. Token Detection Simulation:');

// Check what's in localStorage (we can't access it in Node.js, but we can simulate)
console.log('   Checking localStorage keys that should exist:');
console.log('   - store_owner_auth_token: [should contain JWT token]');
console.log('   - store_owner_user_data: [should contain user data]');
console.log('   - user_logged_out: [should be null or false]');

// Test 3: Simulate API call structure
console.log('\n3. API Call Structure:');
console.log('   Endpoint: /api/hybrid-patches/modified-code/src%2Fpages%2FCart.jsx');
console.log('   Method: GET');
console.log('   Headers should include:');
console.log('   - Content-Type: application/json');
console.log('   - Authorization: Bearer [JWT_TOKEN]');
console.log('   - x-store-id: [STORE_ID] (optional)');

// Test 4: Expected vs. Actual behavior
console.log('\n4. Authentication Flow Analysis:');
console.log('   Expected Flow:');
console.log('   1. User is logged in as store_owner');
console.log('   2. localStorage contains store_owner_auth_token');
console.log('   3. apiClient.getToken() returns valid JWT');
console.log('   4. API request includes Authorization header');
console.log('   5. Backend validates token and returns overlay data');
console.log('');
console.log('   Actual Issue:');
console.log('   - API returns: {"error":"Access denied","message":"No token provided"}');
console.log('   - This means Authorization header is missing or invalid');

// Test 5: Debugging steps
console.log('\n5. Debugging Steps:');
console.log('   Frontend (in browser console):');
console.log('   1. Check localStorage.getItem("store_owner_auth_token")');
console.log('   2. Check window.apiClient.getToken()');
console.log('   3. Check window.apiClient.isLoggedOut');
console.log('   4. Check network tab for actual Authorization header');
console.log('');
console.log('   Backend (API logs):');
console.log('   1. Check if Authorization header is received');
console.log('   2. Check if JWT token is valid');
console.log('   3. Check if user has required permissions');

// Test 6: Potential fixes
console.log('\n6. Potential Fixes:');
console.log('   Option A: User needs to log in');
console.log('   - Navigate to /admin/auth and log in as store owner');
console.log('   - This should set store_owner_auth_token in localStorage');
console.log('');
console.log('   Option B: Token expired or invalid');
console.log('   - Clear localStorage and re-login');
console.log('   - apiClient.clearAllAuthData() then login again');
console.log('');
console.log('   Option C: API client not sending token');
console.log('   - Debug apiClient.getToken() to ensure it returns valid token');
console.log('   - Check network requests include Authorization header');

// Test 7: Browser console commands to try
console.log('\n7. Browser Console Debug Commands:');
console.log('   // Check current auth state');
console.log('   localStorage.getItem("store_owner_auth_token")');
console.log('   localStorage.getItem("user_logged_out")');
console.log('   window.apiClient.getToken()');
console.log('   window.apiClient.getCurrentUserRole()');
console.log('');
console.log('   // Test manual overlay API call');
console.log('   window.apiClient.get("hybrid-patches/modified-code/src%2Fpages%2FCart.jsx")');
console.log('     .then(console.log).catch(console.error)');
console.log('');
console.log('   // Force logout and re-login if needed');
console.log('   window.apiClient.clearAllAuthData()');
console.log('   // Then navigate to /admin/auth to login');

console.log('\n✅ Debug complete! Next step: Test authentication in browser console');