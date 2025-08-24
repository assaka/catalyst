const { sequelize } = require('./backend/src/database/connection.js');
const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');

(async () => {
  try {
    console.log('🔍 Debugging Patch Storage and Display Flow');
    console.log('='.repeat(60));
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const filePath = 'src/pages/Cart.jsx';
    const testUserId = 'any-user-id'; // Should not matter for store-scoped
    
    console.log(`📋 Testing file: ${filePath}`);
    console.log(`🏪 Store ID: ${storeId}`);
    
    // Step 1: Check what's in the database
    console.log('\n1. 📊 Database Content Check:');
    
    const [customizations] = await sequelize.query(`
      SELECT 
        id, 
        file_path, 
        name,
        current_code,
        baseline_code,
        status,
        store_id,
        created_at
      FROM hybrid_customizations 
      WHERE file_path = :filePath AND store_id = :storeId
      ORDER BY created_at DESC
    `, {
      replacements: { filePath, storeId }
    });
    
    console.log(`   Found ${customizations.length} customizations:`);
    customizations.forEach((c, index) => {
      console.log(`   ${index + 1}. ID: ${c.id}`);
      console.log(`      Name: ${c.name}`);
      console.log(`      Status: ${c.status}`);
      console.log(`      Has current_code: ${!!c.current_code}`);
      console.log(`      Has baseline_code: ${!!c.baseline_code}`);
      console.log(`      Created: ${c.created_at}`);
    });
    
    // Check snapshots
    const [snapshots] = await sequelize.query(`
      SELECT 
        s.id,
        s.customization_id,
        s.snapshot_number,
        s.change_summary,
        s.code_before,
        s.code_after,
        s.patch_operations,
        s.created_at
      FROM customization_snapshots s
      JOIN hybrid_customizations hc ON s.customization_id = hc.id
      WHERE hc.file_path = :filePath AND hc.store_id = :storeId
      ORDER BY s.created_at DESC
    `, {
      replacements: { filePath, storeId }
    });
    
    console.log(`\n   Found ${snapshots.length} snapshots:`);
    snapshots.forEach((s, index) => {
      console.log(`   ${index + 1}. Snapshot ID: ${s.id}`);
      console.log(`      Customization ID: ${s.customization_id}`);
      console.log(`      Snapshot #: ${s.snapshot_number}`);
      console.log(`      Summary: ${s.change_summary || 'No summary'}`);
      console.log(`      Has code_before: ${!!s.code_before}`);
      console.log(`      Has code_after: ${!!s.code_after}`);
      console.log(`      Has patch_operations: ${!!s.patch_operations}`);
      console.log(`      Created: ${s.created_at}`);
      
      // Show a snippet of the code changes
      if (s.code_before && s.code_after) {
        const beforeLines = s.code_before.split('\n');
        const afterLines = s.code_after.split('\n');
        console.log(`      Code change preview:`);
        console.log(`        Before (first line): "${beforeLines[0] || 'empty'}"`);
        console.log(`        After (first line):  "${afterLines[0] || 'empty'}"`);
        
        if (beforeLines.length !== afterLines.length) {
          console.log(`        Line count changed: ${beforeLines.length} → ${afterLines.length}`);
        }
      }
    });
    
    // Step 2: Test the service layer
    console.log('\n2. 🔧 Service Layer Test:');
    const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, testUserId, storeId);
    console.log(`   getDiffPatchesForFile returned ${patches.length} patches`);
    
    patches.forEach((patch, index) => {
      console.log(`\n   Patch ${index + 1}:`);
      console.log(`     ID: ${patch.id}`);
      console.log(`     Change Type: ${patch.change_type}`);
      console.log(`     Change Summary: ${patch.change_summary}`);
      console.log(`     Diff Hunks: ${patch.diffHunks ? patch.diffHunks.length : 0}`);
      console.log(`     Created: ${patch.created_at}`);
      
      if (patch.diffHunks && patch.diffHunks.length > 0) {
        patch.diffHunks.forEach((hunk, hunkIndex) => {
          console.log(`       Hunk ${hunkIndex + 1}: ${hunk.changes ? hunk.changes.length : 0} changes`);
          if (hunk.changes && hunk.changes.length > 0) {
            // Show first few changes
            hunk.changes.slice(0, 3).forEach(change => {
              console.log(`         ${change.type}: "${change.content}"`);
            });
            if (hunk.changes.length > 3) {
              console.log(`         ... and ${hunk.changes.length - 3} more changes`);
            }
          }
        });
      } else {
        console.log(`       ⚠️  No diff hunks generated!`);
      }
    });
    
    // Step 3: Test the API format
    console.log('\n3. 📡 API Response Format:');
    const apiResponse = {
      success: true,
      data: {
        file: { path: filePath },
        patches: patches,
        count: patches.length,
        type: 'hybrid_customization'
      },
      message: `Loaded ${patches.length} hybrid customization patches for ${filePath}`
    };
    
    console.log(`   API would return:`);
    console.log(`     success: ${apiResponse.success}`);
    console.log(`     patches count: ${apiResponse.data.count}`);
    console.log(`     file path: ${apiResponse.data.file.path}`);
    console.log(`     type: ${apiResponse.data.type}`);
    
    // Step 4: Identify potential issues
    console.log('\n4. 🚨 Potential Issues Analysis:');
    
    if (customizations.length === 0) {
      console.log('   ❌ ISSUE: No customizations found in database');
      console.log('      - Patches are not being created when code is modified');
      console.log('      - Check the auto-save functionality in frontend');
    }
    
    if (snapshots.length === 0 && customizations.length > 0) {
      console.log('   ❌ ISSUE: Customizations exist but no snapshots');
      console.log('      - Snapshots are not being created during code changes');
      console.log('      - Check the version-control-service createCustomization and applyChanges methods');
    }
    
    if (snapshots.length > 0 && patches.length === 0) {
      console.log('   ❌ ISSUE: Snapshots exist but no patches generated by service');
      console.log('      - The diff-integration-service is not transforming snapshots correctly');
      console.log('      - Check the transformSnapshotToDiffPatch method');
    }
    
    if (patches.length > 0) {
      let hasEmptyDiffHunks = false;
      patches.forEach(patch => {
        if (!patch.diffHunks || patch.diffHunks.length === 0) {
          hasEmptyDiffHunks = true;
        }
      });
      
      if (hasEmptyDiffHunks) {
        console.log('   ⚠️  ISSUE: Some patches have no diff hunks');
        console.log('      - The convertPatchOperationsToDiffHunks method may have issues');
        console.log('      - Check if code_before and code_after are properly stored');
      } else {
        console.log('   ✅ SUCCESS: Patches have diff hunks and should display in Diff tab');
      }
    }
    
    console.log('\n5. 📋 Summary and Next Steps:');
    console.log(`   Database: ${customizations.length} customizations, ${snapshots.length} snapshots`);
    console.log(`   Service: Generated ${patches.length} patches`);
    
    if (patches.length > 0) {
      console.log('   ✅ Patches should be visible in the Diff tab');
      console.log('   ✅ The issue might be in the frontend display logic');
      console.log('   🔧 Check: DiffPreviewSystem.jsx is receiving and processing the patches correctly');
    } else {
      console.log('   ❌ No patches to display - this is the root issue');
      if (customizations.length === 0) {
        console.log('   🔧 Fix: Check auto-save functionality - patches are not being created');
      } else if (snapshots.length === 0) {
        console.log('   🔧 Fix: Check snapshot creation in version-control-service');
      } else {
        console.log('   🔧 Fix: Check diff-integration-service transformation logic');
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();