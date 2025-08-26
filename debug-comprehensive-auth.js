// Comprehensive authentication debugging script
console.log('🔍 COMPREHENSIVE AUTHENTICATION DEBUG');
console.log('='.repeat(60));

// Helper function to decode JWT safely
const decodeJWT = (token) => {
  try {
    if (!token || !token.includes('.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
};

// Test 1: Current Authentication State
console.log('\n1. CURRENT AUTHENTICATION STATE:');
console.log('   Current URL:', window.location.href);
console.log('   Current Path:', window.location.pathname);

// Check logout flags
const logoutFlag = localStorage.getItem('user_logged_out');
const apiClientLoggedOut = window.apiClient?.isLoggedOut;

console.log('   Logout Flag (localStorage):', logoutFlag);
console.log('   API Client Logged Out:', apiClientLoggedOut);

if (logoutFlag === 'true' || apiClientLoggedOut) {
  console.log('   ⚠️  USER IS MARKED AS LOGGED OUT');
  console.log('   This will prevent all authentication!');
}

// Test 2: Token Storage Analysis
console.log('\n2. TOKEN STORAGE ANALYSIS:');
const expectedKeys = {
  storeOwner: {
    token: 'store_owner_auth_token',
    user: 'store_owner_user_data'
  },
  customer: {
    token: 'customer_auth_token', 
    user: 'customer_user_data'
  }
};

// Check Store Owner tokens
console.log('   🏪 Store Owner Authentication:');
const storeOwnerToken = localStorage.getItem(expectedKeys.storeOwner.token);
const storeOwnerUser = localStorage.getItem(expectedKeys.storeOwner.user);

console.log(`     Token (${expectedKeys.storeOwner.token}):`);
if (storeOwnerToken) {
  console.log('       ✅ Present:', storeOwnerToken.length, 'chars');
  console.log('       Preview:', storeOwnerToken.substring(0, 30) + '...');
  
  // Decode JWT
  const payload = decodeJWT(storeOwnerToken);
  if (payload) {
    console.log('       JWT Valid: ✅');
    console.log('       User ID:', payload.id || payload.user_id || 'Unknown');
    console.log('       Role:', payload.role || 'Unknown');
    console.log('       Email:', payload.email || 'Unknown');
    
    if (payload.exp) {
      const expiry = new Date(payload.exp * 1000);
      const isExpired = expiry < new Date();
      console.log('       Expires:', expiry.toLocaleString());
      console.log('       Expired:', isExpired ? '❌ YES - TOKEN IS EXPIRED!' : '✅ No');
    }
  } else {
    console.log('       JWT Valid: ❌ Cannot decode');
  }
} else {
  console.log('       ❌ Missing');
}

console.log(`     User Data (${expectedKeys.storeOwner.user}):`);
if (storeOwnerUser) {
  try {
    const userData = JSON.parse(storeOwnerUser);
    console.log('       ✅ Present');
    console.log('       User ID:', userData.id || 'Unknown');
    console.log('       Role:', userData.role || 'Unknown');
    console.log('       Email:', userData.email || 'Unknown');
    
    // Check token-user consistency
    if (storeOwnerToken) {
      const tokenPayload = decodeJWT(storeOwnerToken);
      if (tokenPayload) {
        const tokenUserId = tokenPayload.id || tokenPayload.user_id;
        const userDataUserId = userData.id;
        const idsMatch = tokenUserId === userDataUserId;
        const rolesMatch = tokenPayload.role === userData.role;
        
        console.log('       Token-User Consistency:');
        console.log('         User IDs Match:', idsMatch ? '✅ Yes' : '❌ NO - MISMATCH!');
        console.log('         Roles Match:', rolesMatch ? '✅ Yes' : '❌ NO - MISMATCH!');
        
        if (!idsMatch || !rolesMatch) {
          console.log('         ⚠️  TOKEN-USER DATA MISMATCH DETECTED!');
        }
      }
    }
  } catch (e) {
    console.log('       ❌ Invalid JSON:', e.message);
  }
} else {
  console.log('       ❌ Missing');
}

// Check Customer tokens (for completeness)
console.log('\n   👤 Customer Authentication:');
const customerToken = localStorage.getItem(expectedKeys.customer.token);
const customerUser = localStorage.getItem(expectedKeys.customer.user);

console.log(`     Token (${expectedKeys.customer.token}):`, customerToken ? '✅ Present' : '❌ Missing');
console.log(`     User Data (${expectedKeys.customer.user}):`, customerUser ? '✅ Present' : '❌ Missing');

// Test 3: API Client Token Detection
console.log('\n3. API CLIENT TOKEN DETECTION:');
if (window.apiClient) {
  console.log('   API Client Available: ✅');
  
  // Test current path detection
  const currentPath = window.location.pathname.toLowerCase();
  console.log('   Current Path:', currentPath);
  
  // Test admin context detection (UPDATED LOGIC)
  const isAdminContext = currentPath.startsWith('/admin/') ||
                        currentPath === '/dashboard' || 
                        currentPath === '/auth' ||
                        currentPath === '/ai-context-window' ||
                        currentPath.startsWith('/editor/') ||  // ← This should catch /editor/ai-context
                        currentPath.includes('/dashboard') || 
                        currentPath.includes('/products') || 
                        currentPath.includes('/categories') || 
                        currentPath.includes('/settings') ||
                        currentPath.includes('/file-library');
  
  console.log('   Is Admin Context (UPDATED):', isAdminContext);
  console.log('   Expected for /editor/ai-context: ✅ TRUE');
  
  // Test token retrieval logic
  console.log('   Token Retrieval Logic:');
  if (logoutFlag === 'true' || apiClientLoggedOut) {
    console.log('     Result: null (logged out)');
  } else if (isAdminContext && storeOwnerToken) {
    console.log('     Result: Store Owner Token (Admin Context) ✅');
  } else if (storeOwnerToken) {
    console.log('     Result: Store Owner Token (Default Priority) ✅');
  } else if (customerToken) {
    console.log('     Result: Customer Token (Fallback)');
  } else {
    console.log('     Result: null (No tokens available) ❌');
  }
  
  // Test actual getToken() call
  const actualToken = window.apiClient.getToken();
  console.log('   Actual getToken() Result:', actualToken ? 'Token returned ✅' : 'null returned ❌');
  
  if (actualToken && storeOwnerToken) {
    console.log('   Token Match:', actualToken === storeOwnerToken ? '✅ Matches store owner' : '❌ Different token');
  }
  
} else {
  console.log('   ❌ API Client Not Available');
}

// Test 4: FileTreeNavigator API Test
console.log('\n4. FILETREE API TEST:');
async function testFileTreeAPI() {
  try {
    if (!window.apiClient) {
      console.log('   ❌ No API client available');
      return;
    }
    
    const token = window.apiClient.getToken();
    console.log('   Using Token:', token ? 'Available ✅' : 'Missing ❌');
    
    if (!token) {
      console.log('   ❌ Cannot test API without token');
      return;
    }
    
    console.log('   Testing /api/proxy-source-files/list?path=src...');
    
    const response = await fetch('/api/proxy-source-files/list?path=src', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('   Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API Call Successful!');
      console.log('   Response Keys:', Object.keys(data));
      console.log('   Success:', data.success);
      console.log('   Files Found:', data.files?.length || 0);
      console.log('   Source:', data.source);
      
      if (data.files && data.files.length > 0) {
        // Check for root src files vs backend src files
        const rootSrcFiles = data.files.filter(f => 
          f.path.startsWith('src/') && 
          !f.path.startsWith('src/backend/') && 
          !f.path.startsWith('backend/')
        );
        const backendSrcFiles = data.files.filter(f => 
          f.path.startsWith('backend/src/') || 
          f.path.startsWith('src/backend/')
        );
        
        console.log('   📊 File Analysis:');
        console.log('     Root src files:', rootSrcFiles.length);
        console.log('     Backend src files:', backendSrcFiles.length);
        
        if (rootSrcFiles.length > 0) {
          console.log('     ✅ ROOT SRC FILES FOUND!');
          console.log('     Sample root files:', rootSrcFiles.slice(0, 5).map(f => f.path));
          console.log('     🎉 FileTreeNavigator should show frontend files!');
        } else {
          console.log('     ❌ No root src files found');
        }
        
        if (backendSrcFiles.length > 0) {
          console.log('     Backend files sample:', backendSrcFiles.slice(0, 3).map(f => f.path));
        }
      }
    } else {
      console.log('   ❌ API Call Failed');
      const errorText = await response.text();
      console.log('   Error:', errorText);
      
      if (response.status === 401) {
        console.log('   🔍 401 Unauthorized - Token issue detected!');
      }
    }
    
  } catch (error) {
    console.error('   ❌ API Test Error:', error.message);
  }
}

// Run the API test
testFileTreeAPI().catch(console.error);

// Test 5: Quick Fixes
console.log('\n5. QUICK FIXES AVAILABLE:');
console.log('   Clear logout state: window.clearLogoutState()');
console.log('   Refresh user data: window.fixUserData()');
console.log('   Debug auth state: window.debugAuth()');
console.log('   Create auth session: window.createAuthSession()');

// Test 6: Issue Summary
setTimeout(() => {
  console.log('\n6. ISSUE SUMMARY:');
  
  const hasStoreOwnerAuth = !!(storeOwnerToken && storeOwnerUser);
  const isNotLoggedOut = !(logoutFlag === 'true' || apiClientLoggedOut);
  const pathDetectionWorks = currentPath.startsWith('/editor/');
  
  console.log('   Store Owner Auth Available:', hasStoreOwnerAuth ? '✅' : '❌');
  console.log('   Not Logged Out:', isNotLoggedOut ? '✅' : '❌');  
  console.log('   Path Detection Works:', pathDetectionWorks ? '✅' : '❌');
  
  if (hasStoreOwnerAuth && isNotLoggedOut && pathDetectionWorks) {
    console.log('   🎉 ALL CHECKS PASS - FileTreeNavigator should work!');
  } else {
    console.log('   ⚠️  ISSUES DETECTED:');
    if (!hasStoreOwnerAuth) {
      console.log('     - Need to log in as store owner');
    }
    if (!isNotLoggedOut) {
      console.log('     - Need to clear logout flag');
    }
    if (!pathDetectionWorks) {
      console.log('     - Path detection may need fixing');
    }
  }
}, 2000); // Delay to let API test complete

console.log('\n📝 Run this script in browser console on /editor/ai-context page');
console.log('📝 Script will automatically test the FileTreeNavigator API call');