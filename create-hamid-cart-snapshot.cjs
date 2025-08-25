const { sequelize } = require('./backend/src/database/connection.js');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    console.log('🔧 Creating Hamid Cart snapshot...');
    
    const customizationId = '6233a191-ae58-483a-837c-7fa460e80a95';
    const userId = '96dc49e7-bf45-4608-b506-8b5107cb4ad0'; // playamin998@gmail.com
    
    // First, get the current and baseline code from the customization
    const [customization] = await sequelize.query(`
      SELECT current_code, baseline_code FROM hybrid_customizations WHERE id = :id
    `, { replacements: { id: customizationId } });
    
    if (customization.length === 0) {
      console.log('❌ Customization not found');
      return;
    }
    
    const { current_code, baseline_code } = customization[0];
    
    // Create patch operations showing the change from "My Cart" to "Hamid Cart"
    const patchOperations = [
      {
        op: 'replace',
        path: '/line/602',
        oldValue: '<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>',
        newValue: '<h1 className="text-3xl font-bold text-gray-900 mb-8">Hamid Cart</h1>',
        context: 'Cart page title modification'
      }
    ];
    
    const reversePatchOperations = [
      {
        op: 'replace', 
        path: '/line/602',
        oldValue: '<h1 className="text-3xl font-bold text-gray-900 mb-8">Hamid Cart</h1>',
        newValue: '<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>',
        context: 'Revert Cart page title modification'
      }
    ];
    
    // Create the new snapshot
    const snapshotId = uuidv4();
    const snapshotNumber = 2; // This will be snapshot #2
    
    await sequelize.query(`
      INSERT INTO customization_snapshots (
        id,
        customization_id,
        snapshot_number,
        change_type,
        change_summary,
        change_description,
        patch_operations,
        reverse_patch_operations,
        code_before,
        code_after,
        created_by,
        created_at
      ) VALUES (
        :id,
        :customization_id,
        :snapshot_number,
        :change_type,
        :change_summary,
        :change_description,
        :patch_operations,
        :reverse_patch_operations,
        :code_before,
        :code_after,
        :created_by,
        NOW()
      )
    `, {
      replacements: {
        id: snapshotId,
        customization_id: customizationId,
        snapshot_number: snapshotNumber,
        change_type: 'modification',
        change_summary: 'Changed cart title from "My Cart" to "Hamid Cart"',
        change_description: 'Modified the cart page title to display "Hamid Cart" instead of "My Cart" for personalization',
        patch_operations: JSON.stringify(patchOperations),
        reverse_patch_operations: JSON.stringify(reversePatchOperations),
        code_before: baseline_code,
        code_after: current_code,
        created_by: userId
      }
    });
    
    console.log('✅ Created Hamid Cart snapshot:');
    console.log('   Snapshot ID: ' + snapshotId);
    console.log('   Customization ID: ' + customizationId);
    console.log('   Snapshot Number: ' + snapshotNumber);
    console.log('   Change: "My Cart" → "Hamid Cart"');
    
    // Test that the diff service now returns the correct data
    console.log('\n🧪 Testing diff service with new snapshot...');
    const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');
    const patches = await diffIntegrationService.getDiffPatchesForFile(
      'src/pages/Cart.jsx', 
      'any-user', 
      '157d4590-49bf-4b0b-bd77-abe131909528'
    );
    
    if (patches.length > 0) {
      // Should now get the latest snapshot (snapshot #2)
      const latestPatch = patches[0];
      console.log('   Latest patch from service:');
      console.log('     ID: ' + latestPatch.id);
      console.log('     Change Summary: ' + latestPatch.change_summary);
      console.log('     Has diffHunks: ' + !!latestPatch.diffHunks);
      
      if (latestPatch.diffHunks && latestPatch.diffHunks.length > 0) {
        // Check if any change contains Hamid Cart
        let foundHamidCart = false;
        latestPatch.diffHunks.forEach(hunk => {
          if (hunk.changes) {
            hunk.changes.forEach(change => {
              if (change.content && change.content.includes('Hamid Cart')) {
                foundHamidCart = true;
                console.log('     ✅ Found Hamid Cart in change: ' + change.type + ' - "' + change.content + '"');
              }
            });
          }
        });
        
        if (foundHamidCart) {
          console.log('\n🎉 SUCCESS! Hamid Cart patch is now ready:');
          console.log('   ✅ Diff tab should show the "My Cart" → "Hamid Cart" change');
          console.log('   ✅ BrowserPreview should display "Hamid Cart" instead of "My Cart"');
        } else {
          console.log('     ❌ Still no Hamid Cart found in diff hunks');
        }
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error creating snapshot:', error.message);
    await sequelize.close();
  }
})();