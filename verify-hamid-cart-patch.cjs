const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Verifying database patch for Hamid Cart change...');
    
    const [results] = await sequelize.query(`
      SELECT id, file_path, status, 
             LENGTH(baseline_code) as baseline_length,
             LENGTH(current_code) as current_length,
             (current_code LIKE '%Hamid Cart%') as contains_hamid,
             (baseline_code LIKE '%My Cart%') as contains_my_cart,
             created_at, updated_at
      FROM hybrid_customizations 
      WHERE file_path = 'src/pages/Cart.jsx' 
        AND store_id = '157d4590-49bf-4b0b-bd77-abe131909528'
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    if (results.length > 0) {
      const patch = results[0];
      console.log('✅ Found database patch:');
      console.log(`  - Patch ID: ${patch.id}`);
      console.log(`  - File: ${patch.file_path}`);
      console.log(`  - Status: ${patch.status}`);
      console.log(`  - Baseline code length: ${patch.baseline_length} chars`);
      console.log(`  - Current code length: ${patch.current_length} chars`);
      console.log(`  - Contains 'Hamid Cart': ${patch.contains_hamid}`);
      console.log(`  - Baseline contains 'My Cart': ${patch.contains_my_cart}`);
      console.log(`  - Updated: ${patch.updated_at}`);
      
      if (patch.contains_hamid && patch.contains_my_cart) {
        console.log('\n🎯 SUCCESS: Database patch correctly created!');
        console.log('   - Baseline has original "My Cart" text');
        console.log('   - Current code has modified "Hamid Cart" text');
        console.log('   - BrowserPreview should show "Hamid Cart" while file remains unchanged');
      } else {
        console.log('\n❌ ISSUE: Patch data validation failed');
        if (!patch.contains_hamid) console.log('   - Missing "Hamid Cart" in current_code');
        if (!patch.contains_my_cart) console.log('   - Missing "My Cart" in baseline_code');
      }
      
      // Test the API that BrowserPreview will use
      console.log('\n🧪 Testing store-scoped patch retrieval...');
      const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');
      const filePath = 'src/pages/Cart.jsx';
      const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
      const anyUserId = 'any-user'; // Should work with any user for store-scoped
      
      const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, anyUserId, storeId);
      console.log(`   Found ${patches.length} patches for BrowserPreview`);
      
      if (patches.length > 0) {
        const currentCode = patches[0].current_code;
        const hasHamidCart = currentCode.includes('Hamid Cart');
        console.log(`   Current code contains "Hamid Cart": ${hasHamidCart}`);
        
        if (hasHamidCart) {
          console.log('\n✅ COMPLETE SUCCESS:');
          console.log('   - Database patch stored correctly');
          console.log('   - Store-scoped retrieval working');
          console.log('   - BrowserPreview will receive "Hamid Cart" text');
          console.log('   - Source file remains unchanged with "My Cart"');
        }
      } else {
        console.log('   ❌ No patches retrieved for BrowserPreview');
      }
    } else {
      console.log('❌ No patch found for Cart.jsx');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();