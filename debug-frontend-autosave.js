/**
 * Frontend Auto-Save Debugging Script
 * Run this in the browser console at https://catalyst-pearl.vercel.app
 * to debug why auto-save isn't working for authenticated users
 */

console.log('🔍 Frontend Auto-Save Diagnostic');
console.log('='.repeat(40));

// Step 1: Check authentication status
console.log('\n📋 Step 1: Authentication Check');
const authToken = localStorage.getItem('auth_token');
const token = localStorage.getItem('token');
const selectedToken = authToken || token;

console.log('auth_token exists:', !!authToken);
console.log('token exists:', !!token);
console.log('Selected token length:', selectedToken?.length || 0);

if (selectedToken) {
  try {
    // Decode JWT payload to check validity
    const parts = selectedToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token user:', payload.email);
      console.log('Token role:', payload.role);
      console.log('Token expires:', new Date(payload.exp * 1000).toLocaleString());
      console.log('Token expired:', payload.exp < Date.now() / 1000);
      
      if (payload.exp < Date.now() / 1000) {
        console.log('⚠️ TOKEN IS EXPIRED - User needs to log in again');
      } else {
        console.log('✅ Token appears valid');
      }
    }
  } catch (e) {
    console.log('❌ Invalid token format:', e.message);
  }
} else {
  console.log('❌ No authentication tokens found');
}

// Step 2: Test if auto-save API works manually
console.log('\n📋 Step 2: Manual Auto-Save API Test');
const testAutoSaveAPI = async () => {
  if (!selectedToken) {
    console.log('❌ Cannot test API without token');
    return;
  }
  
  try {
    const response = await fetch('/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${selectedToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filePath: 'src/test/ManualTest.jsx',
        originalCode: 'function Test() { return <div>Original</div>; }',
        modifiedCode: 'function Test() { return <div>Modified</div>; }',
        changeSummary: 'Manual debug test',
        changeType: 'manual_edit',
        metadata: {
          source: 'debug_script',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    console.log('Manual API test status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Manual API test SUCCESS:', result);
      console.log('   → Auto-save API is working with current token');
      console.log('   → Issue is likely in the frontend trigger logic');
    } else {
      const error = await response.text();
      console.log('❌ Manual API test FAILED:', error);
      console.log('   → Auto-save API has issues with current token');
    }
  } catch (error) {
    console.log('❌ Manual API test ERROR:', error.message);
  }
};

// Step 3: Check for network request monitoring
console.log('\n📋 Step 3: Network Request Monitor Setup');
console.log('To debug auto-save triggers:');
console.log('1. Open Network tab in DevTools');
console.log('2. Filter by "hybrid-patches"');
console.log('3. Make code changes in the AI Context Window');
console.log('4. Watch for requests after 2-second delay');

// Step 4: Hook into console logs
console.log('\n📋 Step 4: Console Log Monitor');
console.log('Watch for these logs in console when editing code:');
console.log('✓ "💾 Auto-saving patch to database..."');
console.log('✓ "✅ Patch auto-saved successfully"');
console.log('✓ "❌ Failed to auto-save patch"');
console.log('✓ "⚠️ No auth token found - skipping auto-save"');
console.log('✓ "⚠️ No file path available - skipping auto-save"');

// Step 5: Auto-save trigger test
console.log('\n📋 Step 5: Auto-Save Trigger Logic');
console.log('The auto-save should trigger when:');
console.log('• User types in the CodeEditor component');
console.log('• Code content changes (newCode !== previousCode)');
console.log('• After 2 second debounce delay');
console.log('• Only if auth token exists');
console.log('• Only if file path is available');

console.log('\n📋 DEBUGGING CHECKLIST:');
console.log('1. ✓ Run testAutoSaveAPI() in console');
console.log('2. ✓ Monitor Network tab for hybrid-patches requests');
console.log('3. ✓ Watch console logs for auto-save messages');
console.log('4. ✓ Verify code changes trigger the debounce timer');
console.log('5. ✓ Check if selectedFile has proper path/name');

// Make the test function available globally
window.testAutoSaveAPI = testAutoSaveAPI;
window.checkAutoSaveTokens = () => {
  return {
    authToken: !!authToken,
    token: !!token,
    selectedToken: !!selectedToken,
    tokenLength: selectedToken?.length || 0
  };
};

console.log('\n🎯 IMMEDIATE ACTIONS:');
console.log('1. Run: testAutoSaveAPI()');
console.log('2. Run: checkAutoSaveTokens()');
console.log('3. Edit code in AI Context Window and watch Network/Console');

// Auto-run the API test
testAutoSaveAPI();