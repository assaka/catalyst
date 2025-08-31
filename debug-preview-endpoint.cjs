/**
 * Debug the preview endpoint to see why the demo patch isn't being applied
 */

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const FILE_PATH = 'src/pages/Cart.jsx';

async function debugPreviewEndpoint() {
  try {
    console.log('🔍 Debugging preview endpoint behavior...');
    
    // Test with explicit debug info
    const previewUrl = `${API_BASE_URL}/preview/${STORE_ID}?fileName=${encodeURIComponent(FILE_PATH)}&patches=true&storeSlug=store&pageName=Cart&debug=true&_t=${Date.now()}`;
    console.log(`🌐 Testing preview URL: ${previewUrl}`);
    
    const response = await fetch(previewUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'manual'
    });
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    console.log('📋 Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    if (response.status === 200) {
      const body = await response.text();
      console.log(`📄 Response body (first 500 chars):`);
      console.log(body.substring(0, 500));
      console.log('...');
      
      if (body.includes('__CATALYST_PATCH_DATA__')) {
        console.log('✅ Found patch data injection!');
      } else {
        console.log('❌ No patch data injection found');
      }
    } else if (response.status === 302) {
      const location = response.headers.get('location');
      console.log(`🔀 Redirect to: ${location}`);
      
      // The issue might be that we're getting redirected instead of the patched content
      // Let's check if there's a condition that's preventing the demo patch from activating
      
      console.log('\n🔍 Analyzing why redirect happened instead of patch application...');
      console.log('Possible reasons:');
      console.log('1. Route resolution failed - no route found for "Cart"');
      console.log('2. Store not found with the given store ID');
      console.log('3. fileName parameter not matching exactly "src/pages/Cart.jsx"');
      console.log('4. Patch service returned success=true but hasPatches=false');
      console.log('5. Demo patch code not being reached due to deployment timing');
      
      // Let's test the route resolution
      console.log('\n🧪 Testing individual components...');
      
      // Test store lookup
      console.log('1. Testing store lookup...');
      try {
        const storeTestUrl = `${API_BASE_URL}/api/debug/simple-db`;
        const storeResponse = await fetch(storeTestUrl);
        if (storeResponse.ok) {
          console.log('✅ Database connection working');
        } else {
          console.log('❌ Database connection issue');
        }
      } catch (storeError) {
        console.log('❌ Store test failed:', storeError.message);
      }
      
    } else {
      const errorBody = await response.text();
      console.log(`❌ Error response body: ${errorBody}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the debug
if (require.main === module) {
  debugPreviewEndpoint()
    .then(result => {
      console.log('\n🎯 Debug completed!');
    })
    .catch(error => {
      console.error('\n💥 Debug error:', error);
    });
}

module.exports = { debugPreviewEndpoint };