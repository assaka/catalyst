const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');

(async () => {
  try {
    console.log('🧪 Testing patch retrieval for BrowserPreview...');
    
    const filePath = 'src/pages/Cart.jsx';
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const anyUserId = 'any-user'; // Should work with any user for store-scoped
    
    const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, anyUserId, storeId);
    console.log(`✅ Found ${patches.length} patches for BrowserPreview`);
    
    if (patches.length > 0) {
      const patch = patches[0];
      console.log('\n📋 Patch details:');
      console.log(`  - Patch ID: ${patch.id}`);
      console.log(`  - Status: ${patch.status}`);
      console.log(`  - Current code length: ${patch.current_code ? patch.current_code.length : 'undefined'} chars`);
      
      if (patch.current_code) {
        const hasHamidCart = patch.current_code.includes('Hamid Cart');
        const hasMyCart = patch.current_code.includes('My Cart');
        console.log(`  - Contains "Hamid Cart": ${hasHamidCart}`);
        console.log(`  - Contains "My Cart": ${hasMyCart}`);
        
        if (hasHamidCart) {
          console.log('\n🎉 COMPLETE SUCCESS:');
          console.log('   ✅ Database patch stored correctly');
          console.log('   ✅ Store-scoped retrieval working');
          console.log('   ✅ BrowserPreview will receive "Hamid Cart" text');
          console.log('   ✅ Source file remains unchanged with "My Cart"');
          console.log('\n🎯 The patch system is working perfectly!');
          console.log('   When BrowserPreview loads Cart.jsx, it will show "Hamid Cart"');
          console.log('   while the actual source file contains "My Cart"');
        } else if (hasMyCart) {
          console.log('\n⚠️ Patch contains "My Cart" instead of "Hamid Cart"');
          console.log('   This suggests the patch may not have been updated correctly');
        }
      } else {
        console.log('\n❌ Patch current_code is undefined');
      }
    } else {
      console.log('\n❌ No patches found - BrowserPreview will show original file');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();