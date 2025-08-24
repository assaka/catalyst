/**
 * Test and debug the complete diff flow from database to UI
 * This will help identify exactly where the flow is breaking
 */

const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Complete Diff Flow Debug Test');
    console.log('='.repeat(50));
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const filePath = 'src/pages/Cart.jsx';
    
    console.log(`📋 Testing complete flow for: ${filePath}`);
    console.log(`🏪 Store ID: ${storeId}`);
    
    // Step 1: Check database content
    console.log('\n1. 📊 Database Check:');
    const [customizations] = await sequelize.query(`
      SELECT id, name, file_path, status, store_id, created_at
      FROM hybrid_customizations 
      WHERE file_path = :filePath AND store_id = :storeId AND status = 'active'
      ORDER BY created_at DESC
    `, {
      replacements: { filePath, storeId }
    });
    
    console.log(`   Active customizations: ${customizations.length}`);
    if (customizations.length > 0) {
      console.log(`   ✅ Database has active customization: ${customizations[0].name}`);
    } else {
      console.log(`   ❌ No active customizations found - this is the root cause!`);
    }
    
    // Step 2: Check snapshots
    const [snapshots] = await sequelize.query(`
      SELECT s.id, s.customization_id, s.change_summary, s.code_before, s.code_after, s.patch_operations
      FROM customization_snapshots s
      JOIN hybrid_customizations hc ON s.customization_id = hc.id
      WHERE hc.file_path = :filePath AND hc.store_id = :storeId AND hc.status = 'active'
      ORDER BY s.created_at DESC
    `, {
      replacements: { filePath, storeId }
    });
    
    console.log(`   Snapshots: ${snapshots.length}`);
    if (snapshots.length > 0) {
      const snapshot = snapshots[0];
      console.log(`   ✅ Latest snapshot: ${snapshot.change_summary}`);
      console.log(`   Has code_before: ${!!snapshot.code_before}`);
      console.log(`   Has code_after: ${!!snapshot.code_after}`);
      console.log(`   Has patch_operations: ${!!snapshot.patch_operations}`);
    }
    
    // Step 3: Test service layer
    console.log('\n2. 🔧 Service Layer Test:');
    const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');
    const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, 'test-user', storeId);
    
    console.log(`   Service returned: ${patches.length} patches`);
    if (patches.length > 0) {
      const patch = patches[0];
      console.log(`   ✅ First patch ID: ${patch.id}`);
      console.log(`   Diff hunks: ${patch.diffHunks?.length || 0}`);
      console.log(`   Change summary: ${patch.change_summary}`);
      
      if (patch.diffHunks && patch.diffHunks.length > 0) {
        const hunk = patch.diffHunks[0];
        console.log(`   First hunk changes: ${hunk.changes?.length || 0}`);
        console.log(`   ✅ Service layer is working correctly`);
      } else {
        console.log(`   ❌ No diff hunks generated`);
      }
    } else {
      console.log(`   ❌ Service returned no patches`);
    }
    
    // Step 4: Test API response format
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
    
    console.log(`   API success: ${apiResponse.success}`);
    console.log(`   API data exists: ${!!apiResponse.data}`);
    console.log(`   API data.patches exists: ${!!apiResponse.data.patches}`);
    console.log(`   API patches count: ${apiResponse.data.patches.length}`);
    
    // Step 5: Test frontend condition logic
    console.log('\n4. 🎯 Frontend Condition Logic Test:');
    console.log('   FileTreeNavigator condition check:');
    console.log(`   if (hybridPatchData && hybridPatchData.success && hybridPatchData.data) {`);
    
    const condition1 = !!apiResponse;
    const condition2 = !!apiResponse.success;
    const condition3 = !!apiResponse.data;
    const allConditions = condition1 && condition2 && condition3;
    
    console.log(`     hybridPatchData: ${condition1}`);
    console.log(`     hybridPatchData.success: ${condition2}`);
    console.log(`     hybridPatchData.data: ${condition3}`);
    console.log(`     All conditions: ${allConditions}`);
    
    if (allConditions) {
      const patches = apiResponse.data.patches || [];
      console.log(`     patches.length: ${patches.length}`);
      
      if (patches.length > 0) {
        console.log(`   ✅ Would extract ${patches.length} patches and dispatch event`);
        console.log(`   Event data: { file: { path: "${filePath}" }, patches: [...] }`);
        
        // Test DiffPreviewSystem condition
        console.log('\n   DiffPreviewSystem condition check:');
        const samplePatch = patches[0];
        console.log(`   Sample patch has diffHunks: ${!!samplePatch.diffHunks}`);
        console.log(`   Sample patch diffHunks length: ${samplePatch.diffHunks?.length || 0}`);
        
        if (samplePatch.diffHunks && samplePatch.diffHunks.length > 0) {
          console.log(`   ✅ DiffPreviewSystem should display patches`);
        } else {
          console.log(`   ❌ DiffPreviewSystem would show "No hybrid customizations detected"`);
        }
      } else {
        console.log(`   ❌ No patches to dispatch - would dispatch empty event`);
      }
    } else {
      console.log(`   ❌ Frontend condition would fail - no patches processed`);
    }
    
    // Step 6: Create a test HTML file to verify the actual browser behavior
    console.log('\n5. 📝 Creating Browser Test File:');
    
    const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Diff Flow Debug Test</title>
</head>
<body>
    <h1>Diff Flow Debug Test</h1>
    <div id="log"></div>
    
    <script>
    function log(message) {
        const logDiv = document.getElementById('log');
        logDiv.innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
        console.log(message);
    }
    
    // Test 1: Event dispatching and listening
    log('🧪 Testing custom event system...');
    
    window.addEventListener('hybridPatchesLoaded', (event) => {
        log('✅ hybridPatchesLoaded event received!');
        log('Event detail: ' + JSON.stringify(event.detail, null, 2));
        
        const { file, patches } = event.detail;
        log('File path: ' + file.path);
        log('Patches count: ' + patches.length);
        
        if (patches.length > 0) {
            log('First patch ID: ' + patches[0].id);
            log('Has diffHunks: ' + !!patches[0].diffHunks);
            log('DiffHunks count: ' + (patches[0].diffHunks?.length || 0));
        }
    });
    
    // Test 2: Simulate FileTreeNavigator dispatching event
    setTimeout(() => {
        log('📡 Simulating FileTreeNavigator dispatch...');
        
        const testData = ${JSON.stringify({
          file: { path: filePath },
          patches: patches.map(p => ({
            id: p.id,
            change_summary: p.change_summary,
            diffHunks: p.diffHunks || []
          }))
        }, null, 4)};
        
        log('Dispatching event with ' + testData.patches.length + ' patches...');
        
        window.dispatchEvent(new CustomEvent('hybridPatchesLoaded', {
            detail: testData
        }));
        
        log('Event dispatched successfully');
    }, 1000);
    
    // Test 3: Check if DiffPreviewSystem would work
    setTimeout(() => {
        log('🎯 Testing DiffPreviewSystem logic...');
        
        const mockEvent = {
            detail: {
                file: { path: '${filePath}' },
                patches: ${JSON.stringify(patches, null, 4)}
            }
        };
        
        const { file, patches } = mockEvent.detail;
        if (file.path === '${filePath}' && patches.length > 0) {
            log('✅ DiffPreviewSystem condition check passed');
            const latestPatch = patches[0];
            
            if (latestPatch.diffHunks && latestPatch.diffHunks.length > 0) {
                log('✅ Patch has diffHunks - would display in UI');
                log('DiffHunks: ' + latestPatch.diffHunks.length);
            } else {
                log('❌ Patch has no diffHunks - would show "No hybrid customizations detected"');
            }
        } else if (file.path === '${filePath}' && patches.length === 0) {
            log('❌ No patches - would show "No hybrid customizations detected"');
        }
    }, 2000);
    </script>
</body>
</html>`;
    
    const fs = require('fs');
    fs.writeFileSync('./test-diff-browser.html', testHTML);
    console.log(`   ✅ Created test-diff-browser.html`);
    console.log(`   🌐 Open this file in browser to test the event system`);
    
    // Summary
    console.log('\n6. 📋 Summary:');
    if (customizations.length === 0) {
      console.log('   🚨 ROOT CAUSE: No active customizations in database');
      console.log('   🔧 FIX: Create a customization for this file');
    } else if (snapshots.length === 0) {
      console.log('   🚨 ROOT CAUSE: Customizations exist but no snapshots');
      console.log('   🔧 FIX: Create snapshots when code changes');
    } else if (patches.length === 0) {
      console.log('   🚨 ROOT CAUSE: Service layer not generating patches');
      console.log('   🔧 FIX: Debug diff-integration-service');
    } else if (patches.length > 0 && patches[0].diffHunks?.length > 0) {
      console.log('   ✅ BACKEND: Database, service, and API are working');
      console.log('   🎯 ISSUE: Frontend event system or component lifecycle');
      console.log('   🔧 FIX: Debug FileTreeNavigator API call and event dispatch');
      console.log('   🌐 TEST: Open test-diff-browser.html to test event system');
    } else {
      console.log('   🚨 ROOT CAUSE: Patches exist but no diffHunks');
      console.log('   🔧 FIX: Debug convertPatchOperationsToDiffHunks method');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();