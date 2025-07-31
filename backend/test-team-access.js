/**
 * Test team access functionality
 * Run this from the browser console to verify team access is working
 */
function testTeamAccess() {
  console.log('🧪 Testing team access functionality...');
  
  // Test API endpoint to check accessible stores
  fetch('/api/stores/dropdown', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('📊 Accessible stores:', data);
    
    const hamidStore = data.data.find(store => store.name === 'Hamid');
    if (hamidStore) {
      console.log('✅ SUCCESS: You have access to Hamid store!');
      console.log('🔑 Access details:', {
        role: hamidStore.access_role,
        isOwner: hamidStore.is_direct_owner
      });
      
      // Test accessing Hamid store specifically
      return fetch(`/api/stores/${hamidStore.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.log('❌ FAIL: No access to Hamid store found');
      return null;
    }
  })
  .then(response => {
    if (response) {
      return response.json();
    }
    return null;
  })
  .then(storeData => {
    if (storeData) {
      console.log('✅ SUCCESS: Individual store access works!');
      console.log('🏪 Store details:', storeData.data);
      console.log('🔐 Access info:', storeData.data.access_info);
    }
    
    console.log('🎉 Team access test completed!');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });
}

// Instructions to add this to browser
console.log(`
📋 INSTRUCTIONS:
1. Copy the testTeamAccess function above
2. Paste it in your browser console on the admin panel
3. Run: testTeamAccess()
4. Check if you now have access to the Hamid store

Alternative: Run this in console:
window.testTeamAccess = ${testTeamAccess.toString()}
testTeamAccess()
`);