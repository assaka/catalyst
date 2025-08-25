#!/usr/bin/env node

console.log('🔍 Testing API Directly With Enhanced Logging...');
console.log('================================================');

const jwt = require('./backend/node_modules/jsonwebtoken');

// Test the production API directly with different code
const testAPIDirectly = async () => {
  const baseUrl = 'https://catalyst-backend-fzhu.onrender.com';
  
  try {
    console.log('\n1. Creating test JWT using fallback secret...');
    const testPayload = {
      id: '157d4590-49bf-4b0b-bd77-abe131909528',
      email: 'test@example.com', 
      role: 'store_owner'
    };
    
    // Use the fallback secret from oauth-test.js
    const testToken = jwt.sign(testPayload, 'fallback-secret', { expiresIn: '1h' });
    console.log('   Token created:', testToken.substring(0, 50) + '...');
    
    console.log('\n2. Testing API with DIFFERENT original and modified code...');
    
    const apiPayload = {
      filePath: 'src/pages/TestComponent.jsx',
      originalCode: `function TestComponent() {
  return (
    <div>
      <h1>Original Version</h1>
      <p>This is the original code</p>
    </div>
  );
}`,
      modifiedCode: `function TestComponent() {
  return (
    <div>
      <h1>Modified Version</h1>
      <p>This code has been changed</p>
      <p>Added this new line</p>
    </div>
  );
}`,
      changeSummary: 'Updated component with new content',
      changeType: 'manual_edit'
    };
    
    console.log('   Original code length:', apiPayload.originalCode.length);
    console.log('   Modified code length:', apiPayload.modifiedCode.length);
    console.log('   Codes are different:', apiPayload.originalCode !== apiPayload.modifiedCode);
    
    const apiResponse = await fetch(baseUrl + '/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });
    
    console.log('   API Response Status:', apiResponse.status);
    console.log('   API Response Headers:');
    for (const [key, value] of apiResponse.headers.entries()) {
      console.log(`     ${key}: ${value}`);
    }
    
    const responseText = await apiResponse.text();
    console.log('   API Response Body:', responseText);
    
    if (apiResponse.status === 200) {
      try {
        const responseData = JSON.parse(responseText);
        console.log('   🎉 SUCCESS! API is working with different codes');
        console.log('   Response data:', JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.log('   ⚠️  Response parsing error:', parseError.message);
      }
    } else if (apiResponse.status === 401) {
      console.log('   ❌ Authentication failed - JWT secret mismatch');
    } else {
      console.log('   ❌ API call failed with status:', apiResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Direct API test failed:', error.message);
  }
};

testAPIDirectly();