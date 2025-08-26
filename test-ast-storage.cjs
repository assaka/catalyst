const { sequelize } = require('./backend/src/database/connection.js');
const VersionControlService = require('./backend/src/services/version-control-service.js');

(async () => {
  try {
    console.log('🧪 Testing complete AST diff storage with file_path...');
    
    // Initialize version control service
    const versionControl = new VersionControlService();
    
    // Find an existing customization to test with
    const [customizations] = await sequelize.query('SELECT id, file_path FROM hybrid_customizations WHERE status = \'active\' LIMIT 1;');
    
    if (customizations.length === 0) {
      console.log('❌ No active customizations found for testing');
      await sequelize.close();
      return;
    }
    
    const testCustomization = customizations[0];
    console.log('📁 Testing with customization:');
    console.log('  ID:', testCustomization.id);
    console.log('  File path:', testCustomization.file_path);
    
    // Test creating a new snapshot with AST diff
    console.log('\n🔧 Creating new snapshot with AST diff...');
    
    const testOldCode = 'function Cart() { return <div>Old Cart</div>; }';
    const testNewCode = 'function Cart() { return <div>New Cart with changes</div>; }';
    
    // Create diff (which includes AST diff)
    const diffResult = await versionControl.createCodeDiff(testOldCode, testNewCode);
    console.log('  AST diff created:', Boolean(diffResult.ast_diff));
    console.log('  Line diff created:', Boolean(diffResult.line_diff));
    console.log('  Unified diff created:', Boolean(diffResult.unified_diff));
    
    // Get a real user ID from the database
    const [users] = await sequelize.query("SELECT id FROM users WHERE role = 'store_owner' LIMIT 1;");
    const testUserId = users[0]?.id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // fallback UUID
    
    // Create snapshot via applyChanges method
    const result = await versionControl.applyChanges(testCustomization.id, {
      modifiedCode: testNewCode,
      changeSummary: 'Test AST diff with file_path',
      changeDescription: 'Testing file_path storage',
      changeType: 'manual_edit',
      createdBy: testUserId
    });
    
    if (result.success) {
      console.log('✅ Snapshot created successfully:');
      console.log('  Snapshot ID:', result.snapshot.id);
      console.log('  Change summary:', result.snapshot.change_summary);
      console.log('  file_path stored:', result.snapshot.file_path || 'NULL');
      console.log('  AST diff present:', Boolean(result.snapshot.ast_diff));
    } else {
      console.log('❌ Failed to create snapshot:', result.error);
    }
    
    // Verify the snapshot in database
    console.log('\n📊 Verifying snapshot in database...');
    const [verification] = await sequelize.query(`SELECT id, file_path, change_summary, ast_diff IS NOT NULL as has_ast_diff FROM customization_snapshots WHERE id = '${result.snapshot.id}';`);
    
    if (verification.length > 0) {
      const snap = verification[0];
      console.log('  Database verification:');
      console.log('    file_path:', snap.file_path || 'NULL');
      console.log('    has AST diff:', snap.has_ast_diff);
      console.log('    change summary:', snap.change_summary);
      
      if (snap.file_path && snap.has_ast_diff) {
        console.log('\n🎉 SUCCESS: AST diff stored with correct file_path!');
      } else {
        console.log('\n❌ ISSUE: Missing file_path or AST diff');
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();