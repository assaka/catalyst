const { sequelize } = require('./backend/src/database/connection.js');
const VersionControlService = require('./backend/src/services/version-control-service.js');

(async () => {
  try {
    console.log('🧪 Testing new snapshot creation to check file_path...');
    
    const versionControl = new VersionControlService();
    
    // Get a real user ID
    const [users] = await sequelize.query(`SELECT id FROM users LIMIT 1`);
    const userId = users[0].id;
    console.log(`👤 Using user ID: ${userId}`);
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const filePath = 'src/pages/TestFile.jsx';
    const testCode = 'function TestFile() { return <div>Test</div>; }';
    const modifiedCode = 'function TestFile() { return <div>Modified Test</div>; }';
    
    console.log('\n📝 Step 1: Creating new customization...');
    
    const result = await versionControl.createCustomization({
      userId,
      storeId,
      name: 'Test File Customization',
      description: 'Testing file_path in snapshots',
      componentType: 'component',
      filePath,
      baselineCode: testCode,
      initialCode: testCode,
      changeType: 'manual_edit',
      changeSummary: 'Initial test creation'
    });
    
    if (result.success) {
      console.log('✅ Customization created successfully');
      console.log(`   Customization ID: ${result.customization.id}`);
      console.log(`   Customization file_path: "${result.customization.file_path}"`);
      console.log(`   Initial snapshot ID: ${result.snapshot.id}`);
      console.log(`   Initial snapshot file_path: "${result.snapshot.file_path}"`);
      
      // Check database directly
      const [dbSnapshot] = await sequelize.query(`
        SELECT id, file_path, change_summary, customization_id
        FROM customization_snapshots 
        WHERE id = :snapshotId
      `, {
        replacements: { snapshotId: result.snapshot.id }
      });
      
      if (dbSnapshot.length > 0) {
        console.log('\n📊 Database verification:');
        console.log(`   DB snapshot file_path: "${dbSnapshot[0].file_path}"`);
        console.log(`   Is NULL: ${dbSnapshot[0].file_path === null ? 'YES ❌' : 'NO ✅'}`);
      }
      
      console.log('\n📝 Step 2: Adding changes to existing customization...');
      
      const changeResult = await versionControl.applyChanges(result.customization.id, {
        modifiedCode,
        changeSummary: 'Modified test code',
        changeDescription: 'Updated the component',
        changeType: 'manual_edit',
        createdBy: userId
      });
      
      if (changeResult.success) {
        console.log('✅ Changes applied successfully');
        console.log(`   New snapshot ID: ${changeResult.snapshot.id}`);
        console.log(`   New snapshot file_path: "${changeResult.snapshot.file_path}"`);
        
        // Check new snapshot in database
        const [newDbSnapshot] = await sequelize.query(`
          SELECT id, file_path, change_summary, customization_id
          FROM customization_snapshots 
          WHERE id = :snapshotId
        `, {
          replacements: { snapshotId: changeResult.snapshot.id }
        });
        
        if (newDbSnapshot.length > 0) {
          console.log('\n📊 New snapshot database verification:');
          console.log(`   DB snapshot file_path: "${newDbSnapshot[0].file_path}"`);
          console.log(`   Is NULL: ${newDbSnapshot[0].file_path === null ? 'YES ❌' : 'NO ✅'}`);
        }
        
        console.log('\n📋 All snapshots for this customization:');
        const [allSnapshots] = await sequelize.query(`
          SELECT id, file_path, change_summary, version_number, created_at
          FROM customization_snapshots 
          WHERE customization_id = :customizationId
          ORDER BY version_number ASC
        `, {
          replacements: { customizationId: result.customization.id }
        });
        
        allSnapshots.forEach((snapshot, index) => {
          console.log(`   ${index + 1}. ID: ${snapshot.id.substring(0, 8)}...`);
          console.log(`      file_path: "${snapshot.file_path}" ${snapshot.file_path ? '✅' : '❌'}`);
          console.log(`      change_summary: ${snapshot.change_summary}`);
          console.log(`      version: ${snapshot.version_number}`);
        });
        
        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await sequelize.query(`DELETE FROM customization_snapshots WHERE customization_id = :customizationId`, {
          replacements: { customizationId: result.customization.id }
        });
        await sequelize.query(`DELETE FROM customization_overlays WHERE id = :customizationId`, {
          replacements: { customizationId: result.customization.id }
        });
        console.log('✅ Test data cleaned up');
        
      } else {
        console.log('❌ Failed to apply changes:', changeResult.error);
      }
      
    } else {
      console.log('❌ Failed to create customization:', result.error);
    }
    
    await sequelize.close();
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();