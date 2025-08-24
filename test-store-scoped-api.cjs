const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');

(async () => {
  try {
    console.log('🧪 Testing Store-Scoped Patch API...');
    console.log('='.repeat(50));
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const filePath = 'src/pages/Cart.jsx';
    
    console.log(`📋 Testing file: ${filePath}`);
    console.log(`🏪 Store ID: ${storeId}`);
    
    // Test 1: Store-scoped query (any user in the store should see patches)
    console.log('\n1. Store-scoped query (should find patches):');
    const anyUserId = 'any-user-id'; // Shouldn't matter for store-scoped
    const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, anyUserId, storeId);
    
    console.log(`   Found ${patches.length} patches`);
    if (patches.length > 0) {
      console.log('   ✅ Store-scoped patches working!');
      patches.forEach((patch, index) => {
        console.log(`   Patch ${index + 1}:`, patch.id);
      });
    } else {
      console.log('   ❌ No patches found - issue with query');
    }
    
    // Test 2: User-scoped query (old behavior, should fail with wrong user)
    console.log('\n2. User-scoped query with wrong user (should find no patches):');
    const wrongUserId = 'wrong-user-id';
    const userPatches = await diffIntegrationService.getDiffPatchesForFile(filePath, wrongUserId, null);
    
    console.log(`   Found ${userPatches.length} patches`);
    if (userPatches.length === 0) {
      console.log('   ✅ User-scoped correctly returns no patches for wrong user');
    } else {
      console.log('   ⚠️  User-scoped found patches unexpectedly');
    }
    
    // Test 3: User-scoped query with correct user
    console.log('\n3. User-scoped query with correct user (should find patches):');
    const correctUserId = '96dc49e7-bf45-4608-b506-8b5107cb4ad0'; // playamin998@gmail.com
    const correctUserPatches = await diffIntegrationService.getDiffPatchesForFile(filePath, correctUserId, null);
    
    console.log(`   Found ${correctUserPatches.length} patches`);
    if (correctUserPatches.length > 0) {
      console.log('   ✅ User-scoped works with correct user');
    } else {
      console.log('   ❌ User-scoped failed even with correct user');
    }
    
    console.log('\n🎯 Conclusion:');
    if (patches.length > 0) {
      console.log('   ✅ Store-scoped patches are working correctly!');
      console.log('   ✅ Any user in the store should now see the patches');
      console.log('   📋 Frontend should receive patches regardless of which user is logged in');
    } else {
      console.log('   ❌ Store-scoped patches are not working - need further debugging');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();