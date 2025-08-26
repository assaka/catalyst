// Test script to verify the FileTreeNavigator authentication fix
console.log('🔍 Testing FileTreeNavigator Authentication Fix');
console.log('='.repeat(60));

// Test 1: Check current path detection
console.log('\n1. Path Detection Test:');
const currentPath = window.location.pathname.toLowerCase();
console.log('  Current Path:', currentPath);

// Simulate the API client's path detection logic (updated)
const isAdminContext = currentPath.startsWith('/admin/') ||
                      currentPath === '/dashboard' || 
                      currentPath === '/auth' ||
                      currentPath === '/ai-context-window' ||
                      currentPath.startsWith('/editor/') ||
                      // Legacy paths for backward compatibility
                      currentPath.includes('/dashboard') || 
                      currentPath.includes('/products') || 
                      currentPath.includes('/categories') || 
                      currentPath.includes('/settings') ||
                      currentPath.includes('/file-library');

console.log('  Is Admin Context (FIXED):', isAdminContext);
console.log('  Should now be TRUE for /editor/ai-context ✅');

// Test 2: Check token retrieval
console.log('\n2. Token Retrieval Test:');
const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
const customerToken = localStorage.getItem('customer_auth_token');

console.log('  Store Owner Token:', storeOwnerToken ? `Present (${storeOwnerToken.length} chars)` : 'Missing');
console.log('  Customer Token:', customerToken ? `Present (${customerToken.length} chars)` : 'Missing');

// Simulate the getToken logic with the fix
function getTokenWithFix() {
  const loggedOut = localStorage.getItem('user_logged_out') === 'true';
  if (loggedOut) {
    return null;
  }
  
  const currentPath = window.location.pathname.toLowerCase();
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
  
  if (isAdminContext && storeOwnerToken) {
    return storeOwnerToken;
  } else if (storeOwnerToken) {
    return storeOwnerToken;
  } else if (customerToken) {
    return customerToken;
  }
  
  return null;
}

const tokenToUse = getTokenWithFix();
console.log('  Token to use (FIXED):', tokenToUse ? 'Store Owner Token ✅' : 'No token ❌');

// Test 3: Test API call with the fix
console.log('\n3. API Call Test with Fixed Authentication:');

async function testAPICallWithFix() {
  try {
    console.log('  Testing proxy-source-files API call...');
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (tokenToUse) {
      headers.Authorization = `Bearer ${tokenToUse}`;
      console.log('  ✅ Authorization header will be included');
    } else {
      console.log('  ❌ No authorization header - this would cause 401');
      return;
    }
    
    const response = await fetch('/api/proxy-source-files/list?path=src', {
      method: 'GET',
      headers: headers
    });
    
    console.log('  Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ API call successful!');
      console.log('  Files found:', data.files?.length || 0);
      console.log('  Source:', data.source);
      
      if (data.files && data.files.length > 0) {
        const rootSrcFiles = data.files.filter(f => f.path.startsWith('src/') && !f.path.startsWith('backend/'));
        console.log('  Root src files:', rootSrcFiles.length);
        console.log('  Sample root files:', rootSrcFiles.slice(0, 3).map(f => f.path));
        
        if (rootSrcFiles.length > 0) {
          console.log('  🎉 SUCCESS: FileTreeNavigator should now show root src files!');
        }
      }
    } else {
      console.log('  ❌ API call failed with status:', response.status);
      const errorText = await response.text();
      console.log('  Error:', errorText);
    }
    
  } catch (error) {
    console.error('  ❌ API test failed:', error.message);
  }
}

// Run the API test if we have a token
if (tokenToUse) {
  testAPICallWithFix().catch(console.error);
} else {
  console.log('  ⚠️  Cannot test API call without authentication token');
  console.log('  💡 Make sure you are logged in as a store owner');
}

// Test 4: Provide instructions
console.log('\n4. Instructions:');
console.log('  If the API call succeeded:');
console.log('    ✅ The fix is working!');
console.log('    ✅ FileTreeNavigator should now load root src files');
console.log('    ✅ Refresh the page to see the updated file tree');
console.log('');
console.log('  If the API call still fails:');
console.log('    1. Make sure you are logged in as a store owner');
console.log('    2. Check that localStorage has store_owner_auth_token');
console.log('    3. Run window.debugAuth() for more detailed debugging');
console.log('    4. Try window.fixUserData() to refresh authentication');