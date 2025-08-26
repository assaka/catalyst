// Comprehensive token mismatch debugging script
console.log('🔍 Token Mismatch & Storage Key Analysis');
console.log('='.repeat(60));

// Test 1: Check all possible token storage keys
console.log('\n1. Token Storage Analysis:');
const allStorageKeys = Object.keys(localStorage);
console.log('  All localStorage keys:', allStorageKeys);

const tokenKeys = allStorageKeys.filter(key => key.includes('token') || key.includes('auth'));
console.log('  Authentication-related keys:', tokenKeys);

const possibleTokenKeys = [
  'store_owner_auth_token',
  'customer_auth_token', 
  'auth_token',
  'token',
  'access_token',
  'bearer_token',
  'admin_token',
  'user_token'
];

console.log('\n  Token Key Analysis:');
possibleTokenKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    console.log(`  ✅ ${key}: Present (${value.length} chars)`);
    console.log(`     Preview: ${value.substring(0, 30)}...`);
    
    // Check if it looks like a JWT
    const isJWT = value.includes('.') && value.split('.').length === 3;
    console.log(`     Format: ${isJWT ? 'JWT' : 'Other'}`);
  } else {
    console.log(`  ❌ ${key}: Missing`);
  }
});

// Test 2: Check user data storage keys
console.log('\n2. User Data Storage Analysis:');
const userDataKeys = [
  'store_owner_user_data',
  'customer_user_data',
  'user_data',
  'auth_user',
  'current_user'
];

userDataKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    console.log(`  ✅ ${key}: Present`);
    try {
      const parsed = JSON.parse(value);
      console.log(`     User ID: ${parsed.id || 'Unknown'}`);
      console.log(`     Email: ${parsed.email || 'Unknown'}`);
      console.log(`     Role: ${parsed.role || 'Unknown'}`);
      console.log(`     Account Type: ${parsed.account_type || 'Unknown'}`);
    } catch (e) {
      console.log(`     ❌ Cannot parse JSON: ${e.message}`);
    }
  } else {
    console.log(`  ❌ ${key}: Missing`);
  }
});

// Test 3: Check API client token detection logic
console.log('\n3. API Client Token Detection:');
if (typeof window !== 'undefined' && window.apiClient) {
  console.log('  API Client Available: ✅');
  console.log('  API Client isLoggedOut:', window.apiClient.isLoggedOut);
  
  const currentToken = window.apiClient.getToken();
  console.log('  Current token from getToken():', currentToken ? `Present (${currentToken.length} chars)` : 'None');
  
  // Test path detection
  const currentPath = window.location.pathname.toLowerCase();
  console.log('  Current Path:', currentPath);
  
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
  
  const isCustomerContext = currentPath.startsWith('/public/') ||
                           currentPath.includes('/storefront') || 
                           currentPath.includes('/cart') || 
                           currentPath.includes('/checkout') ||
                           currentPath.includes('/customerdashboard');
  
  console.log('  Is Admin Context:', isAdminContext);
  console.log('  Is Customer Context:', isCustomerContext);
  
  // Manually check token priority logic
  const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
  const customerToken = localStorage.getItem('customer_auth_token');
  
  console.log('\n  Token Priority Logic:');
  console.log('    Store Owner Token Available:', !!storeOwnerToken);
  console.log('    Customer Token Available:', !!customerToken);
  
  if (isAdminContext && storeOwnerToken) {
    console.log('    Should Use: Store Owner Token (Admin Context)');
  } else if (isCustomerContext && customerToken) {
    console.log('    Should Use: Customer Token (Customer Context)');
  } else if (storeOwnerToken) {
    console.log('    Should Use: Store Owner Token (Default Priority)');
  } else if (customerToken) {
    console.log('    Should Use: Customer Token (Fallback)');
  } else {
    console.log('    Should Use: None (No tokens available)');
  }
  
} else {
  console.log('  ❌ API Client Not Available');
}

// Test 4: JWT Token Analysis
console.log('\n4. JWT Token Analysis:');
const analyzeJWT = (tokenName, token) => {
  if (!token || !token.includes('.')) {
    console.log(`  ${tokenName}: Not a JWT token`);
    return;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log(`  ${tokenName}: Invalid JWT format (${parts.length} parts)`);
      return;
    }
    
    // Decode header
    const headerBase64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const header = JSON.parse(atob(headerBase64));
    
    // Decode payload
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadBase64));
    
    console.log(`  ${tokenName} JWT Analysis:`);
    console.log(`    Algorithm: ${header.alg || 'Unknown'}`);
    console.log(`    Type: ${header.typ || 'Unknown'}`);
    console.log(`    User ID: ${payload.id || payload.user_id || payload.sub || 'Unknown'}`);
    console.log(`    Email: ${payload.email || 'Unknown'}`);
    console.log(`    Role: ${payload.role || 'Unknown'}`);
    console.log(`    Account Type: ${payload.account_type || 'Unknown'}`);
    
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = expDate < now;
      console.log(`    Expires: ${expDate.toLocaleString()}`);
      console.log(`    Expired: ${isExpired ? '❌ YES' : '✅ NO'}`);
      
      if (isExpired) {
        console.log(`    ⚠️  TOKEN IS EXPIRED! This is likely the issue.`);
      }
    }
    
    if (payload.iat) {
      const issuedDate = new Date(payload.iat * 1000);
      console.log(`    Issued: ${issuedDate.toLocaleString()}`);
    }
    
  } catch (error) {
    console.log(`  ${tokenName}: Error decoding JWT - ${error.message}`);
  }
};

const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
const customerToken = localStorage.getItem('customer_auth_token');

if (storeOwnerToken) {
  analyzeJWT('Store Owner Token', storeOwnerToken);
}

if (customerToken) {
  analyzeJWT('Customer Token', customerToken);
}

// Test 5: Token-User Data Consistency Check
console.log('\n5. Token-User Data Consistency:');
const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
const customerUserData = localStorage.getItem('customer_user_data');

if (storeOwnerToken && storeOwnerUserData) {
  try {
    const userData = JSON.parse(storeOwnerUserData);
    const tokenParts = storeOwnerToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      console.log('  Store Owner Data Consistency:');
      console.log(`    Token User ID: ${payload.id || payload.user_id || 'Unknown'}`);
      console.log(`    Stored User ID: ${userData.id || 'Unknown'}`);
      console.log(`    IDs Match: ${(payload.id || payload.user_id) === userData.id ? '✅ YES' : '❌ NO'}`);
      console.log(`    Token Role: ${payload.role || 'Unknown'}`);
      console.log(`    Stored Role: ${userData.role || 'Unknown'}`);
      console.log(`    Roles Match: ${payload.role === userData.role ? '✅ YES' : '❌ NO'}`);
      
      if ((payload.id || payload.user_id) !== userData.id || payload.role !== userData.role) {
        console.log('    ⚠️  TOKEN-USER DATA MISMATCH DETECTED!');
      }
    }
  } catch (e) {
    console.log('  ❌ Error checking store owner consistency:', e.message);
  }
}

// Test 6: Check logout flags
console.log('\n6. Logout State Analysis:');
const logoutFlag = localStorage.getItem('user_logged_out');
console.log('  user_logged_out flag:', logoutFlag);
console.log('  API client isLoggedOut:', window.apiClient?.isLoggedOut);

if (logoutFlag === 'true' && (storeOwnerToken || customerToken)) {
  console.log('  ⚠️  CONFLICT: Logout flag is true but tokens exist!');
  console.log('  This could cause authentication failures.');
}

// Test 7: Recommendations
console.log('\n7. Recommendations:');
if (storeOwnerToken) {
  console.log('  ✅ Store owner token found - this should work for FileTreeNavigator');
} else {
  console.log('  ❌ No store owner token - user needs to log in');
}

if (logoutFlag === 'true') {
  console.log('  🔧 Clear logout flag: localStorage.removeItem("user_logged_out")');
}

console.log('\n8. Quick Fixes:');
console.log('  Clear logout state: window.clearLogoutState()');
console.log('  Refresh user data: window.fixUserData()');
console.log('  Debug auth state: window.debugAuth()');
console.log('  Check token data: window.checkTokenData()');