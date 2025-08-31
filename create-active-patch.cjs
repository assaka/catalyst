/**
 * Create an active patch in the patch_diffs table that will be found by the patch service
 * This will replace "Looks" with "adam" in Cart.jsx
 */

const { readFileSync } = require('fs');
const path = require('path');

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const FILE_PATH = 'src/pages/Cart.jsx';

async function createActivePatch() {
  try {
    console.log('🎯 Creating active patch for Cart.jsx adam replacement...');
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   File Path: ${FILE_PATH}`);
    
    // Read the original Cart.jsx file
    const cartFilePath = path.join(__dirname, 'src', 'pages', 'Cart.jsx');
    const originalCode = readFileSync(cartFilePath, 'utf8');
    
    console.log(`📄 Original Cart.jsx loaded (${originalCode.length} characters)`);
    
    // Create the unified diff patch that replaces "Looks" with "adam"
    const unifiedDiff = `--- a/src/pages/Cart.jsx
+++ b/src/pages/Cart.jsx
@@ -607,7 +607,7 @@ export default function Cart() {
                         <CardContent className="text-center py-12">
                             <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                             <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
-                            <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
+                            <p className="text-gray-600 mb-6">adam like you haven't added anything to your cart yet.</p>
                             <Button onClick={() => {
                                 const baseUrl = getStoreBaseUrl(store);
                                 window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);`;
    
    console.log('\n📝 Unified diff to be inserted:');
    console.log(unifiedDiff);
    
    // Create modified code for verification
    const modifiedCode = originalCode.replace(
      'Looks like you haven\'t added anything to your cart yet.',
      'adam like you haven\'t added anything to your cart yet.'
    );
    
    console.log(`✅ Modified code created (${modifiedCode.length} characters)`);
    
    // Try to insert into patch_diffs table with all required fields
    console.log('\n📡 Creating patch in patch_diffs table...');
    
    const insertQuery = `
      INSERT INTO patch_diffs (
        id, store_id, file_path, unified_diff, patch_content,
        is_active, status, patch_name, change_summary, change_description,
        priority, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        true, 'published', $5, $6, $7,
        1, NOW(), NOW()
      ) RETURNING id, created_at
    `;
    
    const params = [
      STORE_ID,                           // store_id
      FILE_PATH,                          // file_path  
      unifiedDiff,                        // unified_diff
      modifiedCode,                       // patch_content
      'Replace Looks with adam',          // patch_name
      'Replace "Looks" with "adam" text', // change_summary
      'Simple text replacement in empty cart message to demonstrate patch system functionality' // change_description
    ];
    
    const insertResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: insertQuery,
        params: params
      })
    });
    
    if (insertResponse.ok) {
      const insertResult = await insertResponse.json();
      
      if (insertResult.success && insertResult.data && insertResult.data.length > 0) {
        const patchId = insertResult.data[0].id;
        const createdAt = insertResult.data[0].created_at;
        
        console.log('✅ Patch created successfully!');
        console.log(`   Patch ID: ${patchId}`);
        console.log(`   Created at: ${createdAt}`);
        
        // Verify the patch is active and findable
        console.log('\n🔍 Verifying patch is discoverable...');
        
        const verifyQuery = `
          SELECT id, store_id, file_path, is_active, status, patch_name,
                 (unified_diff LIKE '%adam like you haven%') as contains_adam_change
          FROM patch_diffs 
          WHERE id = $1
        `;
        
        const verifyResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: verifyQuery,
            params: [patchId]
          })
        });
        
        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json();
          
          if (verifyResult.success && verifyResult.data && verifyResult.data.length > 0) {
            const patch = verifyResult.data[0];
            console.log('🔍 Patch verification:');
            console.log(`   - Store ID: ${patch.store_id}`);
            console.log(`   - File path: ${patch.file_path}`);
            console.log(`   - Is active: ${patch.is_active}`);
            console.log(`   - Status: ${patch.status}`);
            console.log(`   - Contains adam change: ${patch.contains_adam_change}`);
            
            if (patch.is_active && patch.contains_adam_change) {
              console.log('\n🎉 SUCCESS! Active patch created and verified!');
              
              // Test the patch application
              console.log('\n🧪 Testing patch application...');
              const testResponse = await fetch(`${API_BASE_URL}/api/patches/apply/${encodeURIComponent(FILE_PATH)}?store_id=${STORE_ID}&preview=true&_t=${Date.now()}`);
              
              if (testResponse.ok) {
                const testResult = await testResponse.json();
                console.log('✅ Patch application test:');
                console.log(`   - Success: ${testResult.success}`);
                console.log(`   - Has patches: ${testResult.data?.hasPatches}`);
                console.log(`   - Applied patches: ${testResult.data?.appliedPatches}`);
                
                if (testResult.data?.patchedCode?.includes('adam like you haven')) {
                  console.log('🎉 PATCH APPLICATION SUCCESSFUL!');
                  console.log('   The patch system is now working correctly.');
                  console.log('   Reload Simple Preview to see "adam" instead of "Looks"!');
                  
                  return {
                    success: true,
                    patchId,
                    verified: true,
                    patchApplicationWorking: true
                  };
                } else {
                  console.log('⚠️ Patch created but not being applied correctly');
                }
              }
            } else {
              console.log('⚠️ Patch created but verification failed');
            }
          }
        }
        
        return {
          success: true,
          patchId,
          verified: false
        };
        
      } else {
        console.log('❌ Patch creation failed:', insertResult.error || 'No data returned');
        return { success: false, error: 'Patch creation failed' };
      }
    } else {
      const errorText = await insertResponse.text();
      console.log(`❌ Database insertion failed: ${insertResponse.status}`);
      console.log(`   Error: ${errorText}`);
      return { success: false, error: `HTTP ${insertResponse.status}: ${errorText}` };
    }
    
  } catch (error) {
    console.error('❌ Error creating active patch:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the script
if (require.main === module) {
  createActivePatch()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Active patch creation completed!');
        console.log(`   Patch ID: ${result.patchId}`);
        console.log(`   Verified: ${result.verified}`);
        console.log(`   Working: ${result.patchApplicationWorking || false}`);
        
        if (result.patchApplicationWorking) {
          console.log('\n🚀 Ready to test!');
          console.log('   1. Reload the Simple Preview component');
          console.log('   2. You should now see "adam" instead of "Looks" in the empty cart message');
          console.log('   3. The preview system will apply patches when patches=true');
        }
      } else {
        console.error('\n💥 Failed to create active patch:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createActivePatch };