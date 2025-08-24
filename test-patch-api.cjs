/**
 * Test the hybrid-patches API endpoint directly
 * This simulates what the frontend FileTreeNavigator should be doing
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

(async () => {
  try {
    console.log('🧪 Testing Hybrid Patches API Endpoint');
    console.log('====================================');
    
    const baseUrl = NODE_ENV === 'production' 
      ? 'https://catalyst-backend-fzhu.onrender.com' 
      : 'http://localhost:8000';
    
    const filePath = 'src/pages/Cart.jsx';
    const encodedFilePath = encodeURIComponent(filePath);
    const url = `${baseUrl}/api/hybrid-patches/${encodedFilePath}`;
    
    console.log(`🔍 Testing API call to: ${url}`);
    console.log(`📋 File path: ${filePath}`);
    console.log(`📋 Encoded path: ${encodedFilePath}`);
    console.log(`🏪 Environment: ${NODE_ENV}`);
    
    // Test without authentication first
    console.log('\n1. 📡 Testing API call without authentication...');
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`   Response status: ${response.status}`);
      console.log(`   Response statusText: ${response.statusText}`);
      
      const responseText = await response.text();
      console.log(`   Response body: ${responseText}`);
      
      if (response.status === 401) {
        console.log('   ❌ API requires authentication (expected)');
      } else if (response.status === 200) {
        console.log('   ✅ API call successful!');
        try {
          const data = JSON.parse(responseText);
          console.log(`   📋 Patches found: ${data.data?.patches?.length || 0}`);
        } catch (parseError) {
          console.log('   ⚠️  Response not valid JSON');
        }
      } else {
        console.log(`   ⚠️  Unexpected response status: ${response.status}`);
      }
      
    } catch (fetchError) {
      console.log(`   ❌ Fetch error: ${fetchError.message}`);
    }
    
    // Test the API endpoint structure
    console.log('\n2. 🔍 API Endpoint Analysis:');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   API Path: /api/hybrid-patches/${encodedFilePath}`);
    console.log(`   Expected: GET request with authorization header`);
    console.log(`   Expected response: { success: true, data: { patches: [...] } }`);
    
    // Test URL encoding
    console.log('\n3. 🔧 URL Encoding Test:');
    const testPaths = [
      'src/pages/Cart.jsx',
      'src/components/ui/button.jsx',
      'src/utils/api-client.js'
    ];
    
    testPaths.forEach(path => {
      const encoded = encodeURIComponent(path);
      console.log(`   "${path}" -> "${encoded}"`);
    });
    
    console.log('\n4. 📋 Frontend Integration Check:');
    console.log('   The FileTreeNavigator.jsx should:');
    console.log('   - Make authenticated API call to /api/hybrid-patches/${filePath}');
    console.log('   - Receive response with patches array');
    console.log('   - Dispatch "hybridPatchesLoaded" custom event');
    console.log('   - DiffPreviewSystem.jsx should listen for this event');
    
    console.log('\n5. 🔍 Potential Issues:');
    console.log('   - Authentication: Frontend may not be sending auth headers');
    console.log('   - URL encoding: File paths may not be encoded correctly');
    console.log('   - CORS: Frontend and backend may have CORS issues');
    console.log('   - Event timing: DiffPreviewSystem may not be listening when event is dispatched');
    console.log('   - Component lifecycle: Event may be dispatched before DiffPreviewSystem mounts');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();