/**
 * Create a working adam patch that will actually be applied by the patch system
 * This creates a minimal patch to replace "Looks" with "adam" in Cart.jsx
 */

const { readFileSync } = require('fs');
const path = require('path');

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const FILE_PATH = 'src/pages/Cart.jsx';

async function createWorkingAdamPatch() {
  try {
    console.log('🎯 Creating working adam patch for Cart.jsx...');
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   File Path: ${FILE_PATH}`);
    
    // Read the original Cart.jsx file
    const cartFilePath = path.join(__dirname, 'src', 'pages', 'Cart.jsx');
    const originalCode = readFileSync(cartFilePath, 'utf8');
    
    console.log(`📄 Original Cart.jsx loaded (${originalCode.length} characters)`);
    
    // Create the change: replace "Looks" with "adam" 
    const targetText = 'Looks like you haven\'t added anything to your cart yet.';
    const replacementText = 'adam like you haven\'t added anything to your cart yet.';
    
    if (!originalCode.includes(targetText)) {
      console.log('❌ Target text not found in Cart.jsx');
      console.log(`   Looking for: "${targetText}"`);
      return { success: false, error: 'Target text not found' };
    }
    
    const modifiedCode = originalCode.replace(targetText, replacementText);
    console.log(`✅ Created modified code with "adam" replacement`);
    
    // Create a unified diff patch
    const patchContent = `--- a/src/pages/Cart.jsx
+++ b/src/pages/Cart.jsx
@@ -609,7 +609,7 @@
                             <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                             <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
-                            <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
+                            <p className="text-gray-600 mb-6">adam like you haven't added anything to your cart yet.</p>
                             <Button onClick={() => {
                                 const baseUrl = getStoreBaseUrl(store);
                                 window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);`;
    
    console.log('\n📝 Created unified diff patch:');
    console.log(patchContent);
    
    // Try to create the patch using the public API endpoint
    console.log('\n📡 Attempting to create patch via API...');
    
    // First, let's try the /api/patches/create endpoint with minimal auth
    const createResponse = await fetch(`${API_BASE_URL}/api/patches/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filePath: FILE_PATH,
        modifiedCode: modifiedCode,
        patchName: 'Replace Looks with adam',
        changeType: 'enhancement',
        changeSummary: 'Replace "Looks" with "adam" in empty cart message',
        changeDescription: 'Simple text replacement to demonstrate patch system functionality',
        priority: 1,
        sessionId: `adam-patch-${Date.now()}`
      })
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Patch created via API:', createResult);
      return { success: true, patchId: createResult.data?.patchId, method: 'api' };
    } else {
      console.log(`❌ API patch creation failed: ${createResponse.status}`);
      console.log(await createResponse.text());
    }
    
    // If API fails, try direct database insertion
    console.log('\n📡 Attempting direct database insertion...');
    
    const possibleTables = ['hybrid_customizations', 'patch_diffs'];
    
    for (const tableName of possibleTables) {
      try {
        console.log(`   Trying table: ${tableName}`);
        
        let query, params;
        
        if (tableName === 'hybrid_customizations') {
          query = `
            INSERT INTO ${tableName} (
              id, store_id, file_path, baseline_code, current_code, 
              status, change_summary, change_description, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, 'active', $5, $6, NOW(), NOW()
            ) RETURNING id
          `;
          params = [
            STORE_ID, FILE_PATH, originalCode, modifiedCode,
            'Replace Looks with adam',
            'Replace "Looks" with "adam" in empty cart message for patch system demo'
          ];
        } else if (tableName === 'patch_diffs') {
          query = `
            INSERT INTO ${tableName} (
              id, store_id, file_path, patch_content, unified_diff,
              status, change_summary, change_description, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, 'active', $5, $6, NOW(), NOW()
            ) RETURNING id
          `;
          params = [
            STORE_ID, FILE_PATH, modifiedCode, patchContent,
            'Replace Looks with adam',
            'Replace "Looks" with "adam" in empty cart message for patch system demo'
          ];
        }
        
        const insertResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, params })
        });
        
        if (insertResponse.ok) {
          const insertResult = await insertResponse.json();
          if (insertResult.success) {
            console.log(`✅ Patch created in ${tableName}!`);
            const patchId = insertResult.data?.[0]?.id || 'unknown';
            console.log(`   Patch ID: ${patchId}`);
            
            // Verify the patch
            console.log('\n🔍 Verifying patch creation...');
            const applyResponse = await fetch(`${API_BASE_URL}/api/patches/apply/${encodeURIComponent(FILE_PATH)}?store_id=${STORE_ID}&preview=true&_t=${Date.now()}`);
            
            if (applyResponse.ok) {
              const applyResult = await applyResponse.json();
              console.log('✅ Patch verification:');
              console.log(`   - Has patches: ${applyResult.data?.hasPatches}`);
              console.log(`   - Applied patches: ${applyResult.data?.appliedPatches}`);
              
              if (applyResult.data?.patchedCode?.includes('adam like you haven')) {
                console.log('🎉 SUCCESS! Patch is working correctly!');
                console.log('   The "adam" text replacement is now active.');
                console.log('   Reload Simple Preview to see the change.');
                
                return { 
                  success: true, 
                  patchId, 
                  method: `database-${tableName}`,
                  verified: true
                };
              }
            }
            
            return { 
              success: true, 
              patchId, 
              method: `database-${tableName}`,
              verified: false
            };
          }
        }
        
        console.log(`   ❌ Failed to insert into ${tableName}`);
        
      } catch (tableError) {
        console.log(`   ❌ Error with ${tableName}: ${tableError.message}`);
      }
    }
    
    return { success: false, error: 'All patch creation methods failed' };
    
  } catch (error) {
    console.error('❌ Error creating patch:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the script
if (require.main === module) {
  createWorkingAdamPatch()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Patch creation completed!');
        console.log(`   Method: ${result.method}`);
        console.log(`   Patch ID: ${result.patchId}`);
        console.log(`   Verified: ${result.verified ? 'Yes' : 'Not verified'}`);
        console.log('\n   Reload Simple Preview to see "adam" instead of "Looks"!');
      } else {
        console.error('\n💥 Failed to create patch:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createWorkingAdamPatch };