// Use global fetch (Node.js 18+)

(async () => {
  try {
    console.log('🧪 Testing API endpoints for Hamid Cart patch...');
    console.log('');
    
    const baseUrl = 'https://catalyst-backend-fzhu.onrender.com';
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const userId = '96dc49e7-bf45-4608-b506-8b5107cb4ad0';
    
    // Test 1: Direct diff patches endpoint
    console.log('1. Testing /api/diff-integration/patches/src/pages/Cart.jsx');
    try {
      const response1 = await fetch(`${baseUrl}/api/diff-integration/patches/src/pages/Cart.jsx?storeId=${storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   Status:', response1.status);
      const data1 = await response1.json();
      console.log('   Response:', JSON.stringify(data1, null, 2));
      
      if (data1.patches && data1.patches.length > 0) {
        const patch = data1.patches[0];
        console.log('   Latest patch summary:', patch.change_summary);
        
        // Check for Hamid Cart in diff hunks
        if (patch.diffHunks) {
          let foundHamid = false;
          patch.diffHunks.forEach(hunk => {
            if (hunk.changes) {
              hunk.changes.forEach(change => {
                if (change.content && change.content.includes('Hamid Cart')) {
                  foundHamid = true;
                  console.log('   ✅ Found Hamid Cart in API response:', change.content);
                }
              });
            }
          });
          
          if (!foundHamid) {
            console.log('   ❌ No Hamid Cart found in diff hunks');
          }
        }
      }
    } catch (error) {
      console.log('   ❌ API Error:', error.message);
    }
    
    // Test 2: BrowserPreview code endpoint
    console.log('');
    console.log('2. Testing /api/diff-integration/modified-code/src/pages/Cart.jsx');
    try {
      const response2 = await fetch(`${baseUrl}/api/diff-integration/modified-code/src/pages/Cart.jsx?storeId=${storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   Status:', response2.status);
      const data2 = await response2.json();
      
      if (data2.code) {
        const hasHamidCart = data2.code.includes('Hamid Cart');
        const hasMyCart = data2.code.includes('My Cart');
        
        console.log('   Code length:', data2.code.length, 'characters');
        console.log('   Contains "Hamid Cart":', hasHamidCart);
        console.log('   Contains "My Cart":', hasMyCart);
        
        if (hasHamidCart) {
          console.log('   ✅ BrowserPreview should show "Hamid Cart"');
        } else {
          console.log('   ❌ BrowserPreview will show original "My Cart"');
        }
      } else {
        console.log('   ❌ No code returned from API');
      }
    } catch (error) {
      console.log('   ❌ API Error:', error.message);
    }
    
    // Test 3: Frontend API call simulation
    console.log('');
    console.log('3. Simulating frontend API calls with auth headers...');
    try {
      // This simulates how the frontend might call the API
      const response3 = await fetch(`${baseUrl}/api/diff-integration/patches/src/pages/Cart.jsx`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': storeId,
          'x-user-id': userId
        }
      });
      
      console.log('   Status with headers:', response3.status);
      
      if (response3.ok) {
        const data3 = await response3.json();
        console.log('   Patches found:', data3.patches ? data3.patches.length : 0);
        
        if (data3.patches && data3.patches.length > 0) {
          const latestPatch = data3.patches[0];
          console.log('   Latest patch ID:', latestPatch.id);
          console.log('   Change summary:', latestPatch.change_summary);
        }
      } else {
        const errorText = await response3.text();
        console.log('   Error response:', errorText);
      }
    } catch (error) {
      console.log('   ❌ Simulation Error:', error.message);
    }
    
    console.log('');
    console.log('🔍 API endpoint testing complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();