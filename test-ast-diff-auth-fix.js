// Test script to verify AST diff authentication fix
console.log('🧪 Testing AST Diff Authentication Fix');
console.log('='.repeat(50));

// Test 1: Check authentication token retrieval
console.log('\n1. Testing Authentication Token Retrieval:');

const getAuthToken = () => {
  const loggedOut = localStorage.getItem('user_logged_out') === 'true';
  if (loggedOut) return null;
  
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
  
  const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
  const customerToken = localStorage.getItem('customer_auth_token');
  
  console.log('  Current path:', currentPath);
  console.log('  Is admin context:', isAdminContext);
  console.log('  Store owner token:', storeOwnerToken ? `Present (${storeOwnerToken.length} chars)` : 'Missing');
  console.log('  Customer token:', customerToken ? `Present (${customerToken.length} chars)` : 'Missing');
  
  if (isAdminContext && storeOwnerToken) {
    return storeOwnerToken;
  } else if (storeOwnerToken) {
    return storeOwnerToken;
  } else if (customerToken) {
    return customerToken;
  }
  
  return null;
};

const token = getAuthToken();
console.log('  Selected token:', token ? '✅ Available' : '❌ None');

// Test 2: Test AST diff API call
console.log('\n2. Testing AST Diff API Call:');

if (!token) {
  console.log('  ❌ Cannot test API call - no authentication token');
  console.log('  💡 Make sure you are logged in as a store owner');
} else {
  // Test the API call that was failing
  const testFilePath = 'src/database/connection.js';
  console.log(`  Testing file: ${testFilePath}`);
  
  fetch(`/api/hybrid-patches/${encodeURIComponent(testFilePath)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log(`  Response status: ${response.status}`);
    
    if (response.ok) {
      console.log('  ✅ API call successful!');
      return response.json();
    } else {
      console.log('  ❌ API call failed');
      return response.text().then(text => {
        console.log('  Error response:', text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      });
    }
  })
  .then(data => {
    if (data) {
      console.log('  📋 Response data:');
      console.log('    Success:', data.success);
      console.log('    Patches count:', data.patches?.length || 0);
      
      if (data.patches && data.patches.length > 0) {
        const latestPatch = data.patches[0];
        console.log('    Latest patch AST diff available:', !!latestPatch.ast_diff);
        
        if (latestPatch.ast_diff && !latestPatch.ast_diff.placeholder) {
          console.log('    🎉 SUCCESS: Real AST diff data available!');
          console.log('    AST changes count:', latestPatch.ast_diff.changes?.length || 0);
        } else if (latestPatch.ast_diff?.placeholder) {
          console.log('    ⚠️ Still getting placeholder AST diff data');
        }
      }
    }
  })
  .catch(error => {
    console.error('  ❌ API test failed:', error.message);
  });
}

// Test 3: Instructions
console.log('\n3. Instructions:');
console.log('  ✅ Authentication fix applied to DiffPreviewSystem');
console.log('  ✅ Now using store_owner_auth_token for admin contexts');
console.log('  ✅ Added proper authentication validation');
console.log('');
console.log('  🔄 Refresh the AI Context Window to test the fix');
console.log('  📱 The AST diff should now load without 401 errors');