/**
 * Test script to debug the auto-save authentication issue
 * This simulates the exact same API call being made by the frontend
 */

console.log('🧪 Testing Auto-Save Authentication Issue');
console.log('=' + '='.repeat(45));

// First, let's test the production API with a simulated request
const testAutoSaveAPI = async () => {
  try {
    console.log('\n📡 Testing auto-save API call format...');
    
    // This is the exact same request format as AIContextWindow.jsx line 414-431
    const testPayload = {
      filePath: 'src/test/TestComponent.jsx',
      originalCode: 'function Test() { return <div>Original</div>; }',
      modifiedCode: 'function Test() { return <div>Modified</div>; }',
      changeSummary: 'Auto-saved changes',
      changeType: 'manual_edit',
      metadata: {
        source: 'ai_context_window',
        fileName: 'TestComponent.jsx',
        timestamp: new Date().toISOString()
      }
    };

    console.log('📋 Request payload:', JSON.stringify(testPayload, null, 2));

    // Test against production backend
    console.log('\n🌐 Testing against production backend...');
    const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer invalid-token-for-testing`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:');
    response.headers.forEach((value, name) => {
      console.log(`   ${name}: ${value}`);
    });
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);

    if (response.status === 401) {
      console.log('\n✅ 401 response is EXPECTED with invalid token');
      console.log('   This confirms the API endpoint is working and requires valid authentication');
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

// Test token format validation
const testTokenFormat = () => {
  console.log('\n🔍 Testing token format validation...');
  
  const testTokens = [
    {
      name: 'Valid JWT Format',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OTAxMiIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJzdG9yZV9vd25lciIsImlhdCI6MTczNTIzNTYwNiwiZXhwIjoxNzM1MjM5MjA2fQ.test-signature',
      expected: 'Should pass format validation'
    },
    {
      name: 'Invalid Format',
      token: 'not-a-jwt-token',
      expected: 'Should fail JWT decode'
    },
    {
      name: 'Empty Token',
      token: '',
      expected: 'Should fail with no token provided'
    },
    {
      name: 'Null Token',
      token: null,
      expected: 'Should fail with no token provided'
    }
  ];

  testTokens.forEach((test, index) => {
    console.log(`\n   ${index + 1}. ${test.name}:`);
    console.log(`      Token: ${test.token}`);
    console.log(`      Expected: ${test.expected}`);
    
    // Simulate the token extraction logic from AIContextWindow.jsx
    const tokenToUse = test.token;
    const wouldSendRequest = !!(tokenToUse && tokenToUse.length > 0);
    console.log(`      Would send request: ${wouldSendRequest}`);
  });
};

// Check if this is running in a browser environment to access localStorage
const checkBrowserTokens = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    console.log('\n🔐 Browser Token Check:');
    const authToken = localStorage.getItem('auth_token');
    const token = localStorage.getItem('token');
    
    console.log(`   auth_token: ${authToken ? `✓ Present (${authToken.length} chars)` : '❌ Missing'}`);
    console.log(`   token: ${token ? `✓ Present (${token.length} chars)` : '❌ Missing'}`);
    
    const selectedToken = authToken || token;
    if (selectedToken) {
      console.log(`   Selected token: ${selectedToken.substring(0, 30)}...`);
      
      try {
        // Try to decode the JWT payload
        const parts = selectedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('   Token payload:', {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            issued: new Date(payload.iat * 1000).toLocaleString(),
            expires: new Date(payload.exp * 1000).toLocaleString()
          });
          
          // Check if expired
          if (payload.exp && payload.exp < Date.now() / 1000) {
            console.log('   ⚠️ TOKEN IS EXPIRED - User needs to log in again');
          } else {
            console.log('   ✅ Token appears valid and not expired');
          }
        }
      } catch (e) {
        console.log('   ❌ Could not decode token:', e.message);
      }
    } else {
      console.log('   💡 No tokens found - user needs to log in');
    }
  } else {
    console.log('\n🔐 Running in Node.js - cannot check browser localStorage');
    console.log('   To check tokens, run this script in browser console');
  }
};

// Main execution
const runTest = async () => {
  await testAutoSaveAPI();
  testTokenFormat();
  checkBrowserTokens();
  
  console.log('\n💡 DEBUGGING CONCLUSIONS:');
  console.log('   1. The API endpoint is working correctly and requires authentication');
  console.log('   2. 401 errors are expected when no valid token is provided');
  console.log('   3. The issue is likely:');
  console.log('      - User is not logged in (no token in localStorage)');
  console.log('      - Token is expired and needs refresh');
  console.log('      - Token format is invalid or corrupted');
  console.log('      - JWT signature verification is failing');
  
  console.log('\n🔧 NEXT STEPS TO FIX:');
  console.log('   1. Open browser console and run this script: test-auto-save-auth.js');
  console.log('   2. Check if auth_token or token exists in localStorage');
  console.log('   3. If no token: Log in to the application');
  console.log('   4. If token exists but expired: Log out and log back in');
  console.log('   5. Test auto-save functionality again');
  
  console.log('\n📍 To run in browser console:');
  console.log('   1. Open https://catalyst-pearl.vercel.app');
  console.log('   2. Open Developer Tools (F12)');
  console.log('   3. Paste this entire script in the console');
  console.log('   4. Check the token status and validation results');
};

// Auto-run in Node.js, provide instructions for browser
if (typeof window === 'undefined') {
  runTest();
} else {
  // Browser environment - can access localStorage
  runTest();
}