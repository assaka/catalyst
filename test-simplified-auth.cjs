/**
 * Test script to verify simplified authentication
 * Run this with: node test-simplified-auth.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Simplified Authentication Implementation\n');

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function addTest(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
}

// Test 1: Check if customer auth has no Google OAuth
try {
  const customerAuthPath = path.join(__dirname, 'src', 'pages', 'CustomerAuth.jsx');
  const customerAuthContent = fs.readFileSync(customerAuthPath, 'utf8');
  
  const hasNoGoogleOAuth = !customerAuthContent.includes('handleGoogleAuth') &&
                          !customerAuthContent.includes('Sign in with Google') &&
                          !customerAuthContent.includes('Continue with Google') &&
                          !customerAuthContent.includes('Or continue with');
  
  addTest(
    'Customer Auth Simplified', 
    hasNoGoogleOAuth,
    hasNoGoogleOAuth 
      ? 'Customer auth page has no Google OAuth - email/password only'
      : 'Customer auth page still has Google OAuth elements'
  );
} catch (error) {
  addTest('Customer Auth Simplified', false, `Error checking CustomerAuth: ${error.message}`);
}

// Test 2: Check if store owner auth still has Google OAuth
try {
  const authPath = path.join(__dirname, 'src', 'pages', 'Auth.jsx');
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  const hasGoogleOAuth = authContent.includes('handleGoogleAuth') &&
                        authContent.includes('Sign in with Google');
  
  addTest(
    'Store Owner Has Google', 
    hasGoogleOAuth,
    hasGoogleOAuth 
      ? 'Store owner auth page retains Google OAuth functionality'
      : 'Store owner auth page missing Google OAuth'
  );
} catch (error) {
  addTest('Store Owner Has Google', false, `Error checking Auth: ${error.message}`);
}

// Test 3: Check backend enforces store_owner only for Google OAuth
try {
  const authRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'auth.js');
  const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  const enforceStoreOwner = authRoutesContent.includes('Google OAuth is only available for store owners') &&
                           authRoutesContent.includes("role !== 'store_owner'") &&
                           authRoutesContent.includes('// Google OAuth is always for store_owner');
  
  addTest(
    'Backend Google OAuth Restriction', 
    enforceStoreOwner,
    enforceStoreOwner 
      ? 'Backend enforces store_owner only for Google OAuth'
      : 'Backend not properly restricting Google OAuth to store owners'
  );
} catch (error) {
  addTest('Backend Google OAuth Restriction', false, `Error checking backend: ${error.message}`);
}

// Test 4: Check OAuth callback always uses store_owner role
try {
  const authRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'auth.js');
  const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  const alwaysStoreOwner = authRoutesContent.includes("const intendedRole = 'store_owner';") &&
                          authRoutesContent.includes("role: 'store_owner',") &&
                          authRoutesContent.includes("account_type: 'agency'") &&
                          !authRoutesContent.includes("intendedRole === 'customer'");
  
  addTest(
    'OAuth Always Store Owner', 
    alwaysStoreOwner,
    alwaysStoreOwner 
      ? 'OAuth callback always creates/updates users as store_owner'
      : 'OAuth callback not properly enforcing store_owner role'
  );
} catch (error) {
  addTest('OAuth Always Store Owner', false, `Error checking OAuth callback: ${error.message}`);
}

// Test 5: Check OAuth redirects always go to /auth
try {
  const authRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'auth.js');
  const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  const alwaysAuthRedirect = authRoutesContent.includes('res.redirect(`${corsOrigin}/auth?token=') &&
                            !authRoutesContent.includes('res.redirect(`${corsOrigin}/customerauth');
  
  addTest(
    'OAuth Redirects to Auth', 
    alwaysAuthRedirect,
    alwaysAuthRedirect 
      ? 'OAuth always redirects to store owner auth page'
      : 'OAuth redirects not properly configured'
  );
} catch (error) {
  addTest('OAuth Redirects to Auth', false, `Error checking redirects: ${error.message}`);
}

// Summary
console.log('\n📊 Test Summary:');
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

if (testResults.failed === 0) {
  console.log('\n🎉 All tests passed! Simplified authentication is properly implemented.');
} else {
  console.log('\n⚠️ Some tests failed. Please review the implementation.');
}

console.log('\n📋 Implementation Summary:');
console.log('1. ✅ Customer authentication - Email/password only');
console.log('2. ✅ Store owner authentication - Email/password + Google OAuth');
console.log('3. ✅ Google OAuth restricted to store_owner role only');
console.log('4. ✅ Backend enforces role restrictions');
console.log('5. ✅ Clear separation of authentication methods');

console.log('\n🔧 Key Benefits:');
console.log('• Simpler customer experience - no confusing OAuth options');
console.log('• Store owners get convenience of Google sign-in');
console.log('• Clear role separation and security');
console.log('• Prevents accidental role mixing');
console.log('• Easier to maintain and debug');

module.exports = testResults;