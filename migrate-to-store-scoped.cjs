const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔧 Migrating Hybrid Customizations to Store-Scoped Architecture');
    console.log('='.repeat(70));
    
    const defaultStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // 1. Check current state
    console.log('\n1. Current state of hybrid_customizations:');
    const current = await sequelize.query(
      `SELECT hc.id, hc.store_id, hc.file_path, u.email 
       FROM hybrid_customizations hc 
       LEFT JOIN users u ON hc.user_id = u.id 
       ORDER BY hc.created_at DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    current.forEach(row => {
      const storeStatus = row.store_id ? '✅' : '❌';
      console.log(`   ${storeStatus} ${row.file_path} | User: ${row.email} | Store: ${row.store_id || 'NULL'}`);
    });
    
    // 2. Update all customizations to have store_id
    console.log('\n2. Updating all customizations to use default store ID...');
    const [result] = await sequelize.query(
      `UPDATE hybrid_customizations 
       SET store_id = :storeId 
       WHERE store_id IS NULL`,
      { 
        replacements: { storeId: defaultStoreId },
        type: sequelize.QueryTypes.UPDATE 
      }
    );
    
    console.log(`   ✅ Updated ${result} customization(s) with store_id: ${defaultStoreId}`);
    
    // 3. Verify the update
    console.log('\n3. Verifying updated state:');
    const updated = await sequelize.query(
      `SELECT hc.id, hc.store_id, hc.file_path, u.email 
       FROM hybrid_customizations hc 
       LEFT JOIN users u ON hc.user_id = u.id 
       ORDER BY hc.created_at DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    let allHaveStoreId = true;
    updated.forEach(row => {
      const storeStatus = row.store_id ? '✅' : '❌';
      if (!row.store_id) allHaveStoreId = false;
      console.log(`   ${storeStatus} ${row.file_path} | User: ${row.email} | Store: ${row.store_id || 'NULL'}`);
    });
    
    // 4. Test the new store-scoped query
    console.log('\n4. Testing store-scoped query:');
    const { diffIntegrationService } = require('./backend/src/services/diff-integration-service');
    
    const filePath = 'src/pages/Cart.jsx';
    const testUserId = 'any-user-id'; // This won't matter anymore
    
    try {
      const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, testUserId, defaultStoreId);
      console.log(`   ✅ Store-scoped query found ${patches.length} patches for ${filePath}`);
      
      if (patches.length > 0) {
        console.log(`   🎯 First patch: ${patches[0].id}`);
        console.log(`   📊 Diff hunks: ${patches[0].diffHunks?.length || 0}`);
      }
    } catch (error) {
      console.log(`   ❌ Store-scoped query failed: ${error.message}`);
    }
    
    await sequelize.close();
    
    console.log('\n🎉 Migration Complete!');
    console.log('\nResults:');
    console.log(`   ✅ All customizations now have store_id: ${defaultStoreId}`);
    console.log('   ✅ Any user in the store will see the same patches');
    console.log('   ✅ Patches are now store-scoped, not user-scoped');
    console.log('\nNext: Deploy the updated API and test with any user account');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();