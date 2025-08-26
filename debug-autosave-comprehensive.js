/**
 * Comprehensive Auto-Save Debugging Script
 * Run this in browser console at https://catalyst-pearl.vercel.app
 * while using the AI Context Window to debug auto-save issues
 */

console.log('🔍 Comprehensive Auto-Save Debugging');
console.log('====================================');

// Step 1: Create monitoring hooks for auto-save activity
console.log('\n📋 Step 1: Setting up auto-save monitoring...');

// Hook into fetch to monitor API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Monitor auto-save API calls specifically
  if (url && url.includes('hybrid-patches')) {
    console.log('🌐 AUTO-SAVE API CALL DETECTED:');
    console.log('   URL:', url);
    console.log('   Method:', options?.method || 'GET');
    console.log('   Headers:', options?.headers || 'none');
    
    if (options?.body) {
      try {
        const body = JSON.parse(options.body);
        console.log('   Body:', body);
        console.log('   File Path:', body.filePath);
        console.log('   Has original code:', !!body.originalCode);
        console.log('   Has modified code:', !!body.modifiedCode);
      } catch (e) {
        console.log('   Body (unparsed):', options.body);
      }
    }
  }
  
  // Call original fetch and monitor response
  return originalFetch.apply(this, args).then(response => {
    if (url && url.includes('hybrid-patches')) {
      console.log('📊 AUTO-SAVE API RESPONSE:');
      console.log('   Status:', response.status, response.statusText);
      
      // Clone response to read it without consuming
      const clonedResponse = response.clone();
      clonedResponse.text().then(text => {
        console.log('   Response:', text.substring(0, 200));
        if (response.status >= 400) {
          console.log('❌ AUTO-SAVE API FAILED:', text);
        } else {
          console.log('✅ AUTO-SAVE API SUCCESS');
        }
      });
    }
    return response;
  });
};

// Step 2: Monitor code editor changes
console.log('\n📋 Step 2: Setting up code change monitoring...');

// Hook into setTimeout to monitor debounce activity
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(callback, delay, ...args) {
  // Monitor auto-save timeouts (2000ms delay)
  if (delay === 2000) {
    console.log('⏰ AUTO-SAVE DEBOUNCE TRIGGERED (2 second delay)');
    console.log('   Will execute auto-save in 2 seconds...');
    
    // Wrap callback to monitor execution
    const wrappedCallback = function() {
      console.log('🚀 AUTO-SAVE DEBOUNCE EXECUTING NOW');
      return callback.apply(this, arguments);
    };
    
    return originalSetTimeout.call(this, wrappedCallback, delay, ...args);
  }
  
  return originalSetTimeout.apply(this, arguments);
};

// Step 3: Authentication and selectedFile monitoring
const monitorAuthAndFile = () => {
  console.log('\n📋 Step 3: Current Authentication & File Status:');
  
  // Check tokens
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  const selectedToken = authToken || token;
  
  console.log('🔑 Authentication Status:');
  console.log('   auth_token exists:', !!authToken);
  console.log('   token exists:', !!token);
  console.log('   Selected token length:', selectedToken?.length || 0);
  
  if (selectedToken) {
    try {
      const parts = selectedToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('   Token user:', payload.email);
        console.log('   Token role:', payload.role);
        console.log('   Token expired:', payload.exp < Date.now() / 1000);
      }
    } catch (e) {
      console.log('   ❌ Invalid token format');
    }
  }
  
  // Check if we can find selectedFile in React component state
  console.log('\n📁 Selected File Status:');
  
  // Try to find React fiber and extract selectedFile
  const findReactFiber = (dom) => {
    for (let key in dom) {
      if (key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) {
        return dom[key];
      }
    }
    return null;
  };
  
  // Look for AI Context Window component
  const aiContextElements = document.querySelectorAll('[class*="ai-context"], [class*="context-window"]');
  let foundSelectedFile = false;
  
  for (let element of aiContextElements) {
    const fiber = findReactFiber(element);
    if (fiber) {
      // Traverse up to find the component with selectedFile state
      let current = fiber;
      while (current && !foundSelectedFile) {
        if (current.memoizedState || current.stateNode) {
          console.log('   🔍 Checking React component for selectedFile...');
          // This is a simplified check - actual implementation may vary
        }
        current = current.return;
      }
    }
  }
  
  if (!foundSelectedFile) {
    console.log('   ⚠️ Could not automatically detect selectedFile');
    console.log('   📋 Manual check: Open browser DevTools > Components tab');
    console.log('   📋 Find AIContextWindow component and check selectedFile prop');
  }
};

// Step 4: Test manual auto-save
const testManualAutoSave = async () => {
  console.log('\n📋 Step 4: Manual Auto-Save Test');
  
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  const selectedToken = authToken || token;
  
  if (!selectedToken) {
    console.log('❌ Cannot test - no auth token found');
    return;
  }
  
  try {
    const testPayload = {
      filePath: 'src/test/DebugTest.jsx',
      originalCode: 'function DebugTest() { return <div>Original</div>; }',
      modifiedCode: 'function DebugTest() { return <div>Modified for debug</div>; }',
      changeSummary: 'Comprehensive debug test',
      changeType: 'manual_edit'
    };
    
    console.log('🧪 Sending manual auto-save test...');
    const response = await fetch('/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${selectedToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📊 Manual test result:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Manual auto-save SUCCESS:', result);
    } else {
      const error = await response.text();
      console.log('❌ Manual auto-save FAILED:', error);
    }
  } catch (error) {
    console.log('❌ Manual test ERROR:', error.message);
  }
};

// Step 5: Monitoring setup completion
console.log('\n📋 Step 5: Monitoring Setup Complete');
console.log('✅ Fetch interceptor active - will log all auto-save API calls');
console.log('✅ setTimeout interceptor active - will log debounce triggers');
console.log('✅ Authentication monitoring available');

// Initial status check
monitorAuthAndFile();

// Make functions available globally
window.monitorAuthAndFile = monitorAuthAndFile;
window.testManualAutoSave = testManualAutoSave;

console.log('\n🎯 DEBUGGING INSTRUCTIONS:');
console.log('1. This script is now monitoring ALL auto-save activity');
console.log('2. Open the AI Context Window and select a file');
console.log('3. Make code changes in the editor');
console.log('4. Watch this console for auto-save activity logs');
console.log('5. Run testManualAutoSave() to test the API directly');
console.log('6. Run monitorAuthAndFile() to check current status');

console.log('\n🔍 WHAT TO WATCH FOR:');
console.log('✓ "⏰ AUTO-SAVE DEBOUNCE TRIGGERED" after code changes');
console.log('✓ "🚀 AUTO-SAVE DEBOUNCE EXECUTING NOW" after 2 seconds');
console.log('✓ "🌐 AUTO-SAVE API CALL DETECTED" when request is made');
console.log('✓ "📊 AUTO-SAVE API RESPONSE" with status code');

console.log('\n🚨 IMMEDIATE ACTION:');
console.log('Now make some code changes in the AI Context Window...');

// Auto-run manual test
setTimeout(() => {
  console.log('\n🧪 Running automatic manual test in 3 seconds...');
  testManualAutoSave();
}, 3000);