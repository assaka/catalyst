const { sequelize } = require('./backend/src/database/connection.js');
const VersionControlService = require('./backend/src/services/version-control-service.js');

(async () => {
  try {
    console.log('🔍 Deep debugging of file_path issue in snapshots...');
    
    const versionControl = new VersionControlService();
    
    // Get a real user ID
    const [users] = await sequelize.query(`SELECT id FROM users LIMIT 1`);
    const userId = users[0].id;
    console.log(`👤 Using user ID: ${userId}`);
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const filePath = 'src/pages/DebugTest.jsx';
    const testCode = 'function DebugTest() { return <div>Debug</div>; }';
    
    console.log('\n📝 Step 1: Creating customization and checking each stage...');
    
    // Create customization directly to see what gets stored
    const { CustomizationOverlay } = require('./backend/src/models');
    
    console.log('Creating CustomizationOverlay record...');
    const customization = await CustomizationOverlay.create({
      user_id: userId,
      store_id: storeId,
      name: 'Debug Test Customization',
      description: 'Testing file_path storage',
      file_path: filePath,
      component_type: 'component',
      baseline_code: testCode,
      current_code: testCode,
      status: 'active',
      change_type: 'manual_edit',
      metadata: { test: true }
    });
    
    console.log(`✅ Customization created with ID: ${customization.id}`);
    console.log(`   file_path in object: "${customization.file_path}"`);
    console.log(`   file_path type: ${typeof customization.file_path}`);
    console.log(`   file_path is null/undefined: ${customization.file_path == null}`);
    
    // Check what's actually in the database
    const [dbCustomization] = await sequelize.query(`
      SELECT id, file_path, name, status 
      FROM customization_overlays 
      WHERE id = :customizationId
    `, {
      replacements: { customizationId: customization.id }
    });
    
    console.log('\n📊 Database verification for customization:');
    if (dbCustomization.length > 0) {
      console.log(`   DB file_path: "${dbCustomization[0].file_path}"`);
      console.log(`   DB file_path type: ${typeof dbCustomization[0].file_path}`);
      console.log(`   DB file_path is null: ${dbCustomization[0].file_path === null ? 'YES ❌' : 'NO ✅'}`);
    }
    
    console.log('\n📝 Step 2: Testing createSnapshot method...');
    
    // Now test the createSnapshot method directly
    try {
      const snapshot = await versionControl.createSnapshot(customization.id, {
        change_summary: 'Debug test snapshot',
        change_description: 'Testing file_path propagation',
        change_type: 'initial',
        ast_diff: null,
        line_diff: null,
        unified_diff: null,
        diff_stats: {},
        createdBy: userId
      });
      
      console.log(`✅ Snapshot created with ID: ${snapshot.id}`);
      console.log(`   Snapshot file_path in object: "${snapshot.file_path}"`);
      console.log(`   Snapshot file_path type: ${typeof snapshot.file_path}`);
      console.log(`   Snapshot file_path is null/undefined: ${snapshot.file_path == null}`);
      
      // Check snapshot in database
      const [dbSnapshot] = await sequelize.query(`
        SELECT id, file_path, customization_id, change_summary
        FROM customization_snapshots 
        WHERE id = :snapshotId
      `, {
        replacements: { snapshotId: snapshot.id }
      });
      
      console.log('\n📊 Database verification for snapshot:');
      if (dbSnapshot.length > 0) {
        console.log(`   DB snapshot file_path: "${dbSnapshot[0].file_path}"`);
        console.log(`   DB snapshot file_path type: ${typeof dbSnapshot[0].file_path}`);
        console.log(`   DB snapshot file_path is null: ${dbSnapshot[0].file_path === null ? 'YES ❌' : 'NO ✅'}`);
      }
      
      console.log('\n📝 Step 3: Testing the findByPk retrieval...');
      
      // Test what happens when we retrieve the customization using findByPk
      const retrievedCustomization = await CustomizationOverlay.findByPk(customization.id);
      console.log(`   Retrieved customization file_path: "${retrievedCustomization.file_path}"`);
      console.log(`   Retrieved file_path type: ${typeof retrievedCustomization.file_path}`);
      console.log(`   Retrieved file_path is null/undefined: ${retrievedCustomization.file_path == null}`);
      
      // Clean up
      console.log('\n🧹 Cleaning up test data...');
      await sequelize.query(`DELETE FROM customization_snapshots WHERE customization_id = :customizationId`, {
        replacements: { customizationId: customization.id }
      });
      await sequelize.query(`DELETE FROM customization_overlays WHERE id = :customizationId`, {
        replacements: { customizationId: customization.id }
      });
      console.log('✅ Test data cleaned up');
      
    } catch (snapshotError) {
      console.log('❌ Error creating snapshot:', snapshotError.message);
      console.log('   Stack:', snapshotError.stack);
      
      // Still clean up the customization
      await sequelize.query(`DELETE FROM customization_overlays WHERE id = :customizationId`, {
        replacements: { customizationId: customization.id }
      });
    }
    
    await sequelize.close();
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();