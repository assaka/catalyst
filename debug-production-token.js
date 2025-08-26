/**
 * Production Token Debugging Script
 * Run this in browser console to debug the exact 401 issue
 */

console.log('🔍 Production Token Debugging');
console.log('=============================');

const debugProductionToken = async () => {
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  const selectedToken = authToken || token;
  
  if (!selectedToken) {
    console.log('❌ No token found in localStorage');
    return;
  }
  
  console.log('📋 Token Details:');
  console.log('   Length:', selectedToken.length);
  console.log('   Starts with:', selectedToken.substring(0, 30) + '...');
  console.log('   Source:', authToken ? 'auth_token' : 'token');
  
  // Parse JWT payload
  try {
    const parts = selectedToken.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format - not 3 parts');
      return;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    console.log('📋 JWT Payload:');
    console.log('   User ID:', payload.id);
    console.log('   Email:', payload.email);
    console.log('   Role:', payload.role);
    console.log('   Issued:', new Date(payload.iat * 1000).toLocaleString());
    console.log('   Expires:', new Date(payload.exp * 1000).toLocaleString());
    console.log('   Valid for:', Math.round((payload.exp - now) / 60), 'minutes');
    console.log('   Is expired:', payload.exp < now);
    
    if (payload.exp < now) {
      console.log('🚨 TOKEN IS EXPIRED! This is likely the issue.');
      console.log('   Solution: Log out and log back in');
      return;
    }
    
    if ((payload.exp - now) < 300) { // Less than 5 minutes
      console.log('⚠️ Token expires soon (< 5 min) - might expire during use');
    }
    
    // Test the exact auto-save request that's failing
    console.log('\n🧪 Testing Exact Auto-Save Request:');
    
    const testPayload = {
      filePath: 'src/debug/TestFile.jsx',
      originalCode: 'function Test() { return <div>Original</div>; }',
      modifiedCode: 'function Test() { return <div>Modified</div>; }',
      changeSummary: 'Production debug test',
      changeType: 'manual_edit'
    };
    
    console.log('   Request URL: /api/hybrid-patches/create');
    console.log('   Method: POST');
    console.log('   Authorization: Bearer', selectedToken.substring(0, 20) + '...');
    console.log('   Body:', testPayload);
    
    const response = await fetch('/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${selectedToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📊 Response:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);
    
    if (response.status === 401) {
      const errorData = JSON.parse(responseText);
      console.log('🔍 401 Error Analysis:');
      console.log('   Error:', errorData.error);
      console.log('   Message:', errorData.message);
      
      if (errorData.message === 'Invalid token') {
        console.log('\n💡 DIAGNOSIS: Token validation is failing');
        console.log('   Possible causes:');
        console.log('   1. JWT_SECRET mismatch between frontend auth and backend');
        console.log('   2. Token was issued by different environment');
        console.log('   3. Token corruption during storage/transmission');
        console.log('   4. Backend user lookup failing');
      }
    }
    
  } catch (error) {
    console.log('❌ Error parsing token:', error.message);
  }
};

const testWorkingEndpoint = async () => {
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  const selectedToken = authToken || token;
  
  console.log('\n🧪 Testing Working Endpoint for Comparison:');
  
  try {
    const response = await fetch('/api/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${selectedToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Profile endpoint:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Profile endpoint works with same token');
      console.log('   → Issue is specific to auto-save endpoint');
    } else {
      console.log('❌ Profile endpoint also fails');
      console.log('   → General authentication issue');
    }
    
  } catch (error) {
    console.log('❌ Error testing profile:', error.message);
  }
};

const suggestFixes = () => {
  console.log('\n💡 IMMEDIATE FIXES TO TRY:');
  console.log('1. 🔄 Refresh page and try again (token might be stale)');
  console.log('2. 🚪 Log out completely and log back in');
  console.log('3. 🧹 Clear localStorage: localStorage.clear() then re-login');
  console.log('4. 🕒 Wait a few minutes (server might be updating)');
  console.log('5. 💻 Try different browser/incognito mode');
  
  console.log('\n🔧 ADVANCED DEBUGGING:');
  console.log('If issue persists after fresh login:');
  console.log('- Backend JWT_SECRET environment variable issue');
  console.log('- Auto-save route has different auth requirements');
  console.log('- User database lookup failing specifically for auto-save');
};

// Make functions available globally  
window.debugProductionToken = debugProductionToken;
window.testWorkingEndpoint = testWorkingEndpoint;

// Auto-run debugging
console.log('🚀 Running automatic token analysis...\n');
debugProductionToken().then(() => {
  testWorkingEndpoint();
  suggestFixes();
});