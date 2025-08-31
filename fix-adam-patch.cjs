/**
 * Fix the existing adam patch to properly replace content in Cart.jsx
 * This will update the patch to replace "Looks" with "adam" in the cart page
 */

const { readFileSync } = require('fs');
const path = require('path');

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const EXISTING_PATCH_ID = '10722068-930f-41db-915b-e6c627e7f539';
const FILE_PATH = 'src/pages/Cart.jsx';

async function fixAdamPatch() {
  try {
    console.log('🔧 Fixing adam patch to properly replace content in Cart.jsx...');
    console.log(`   Patch ID: ${EXISTING_PATCH_ID}`);
    console.log(`   Target: Replace "Looks" with "adam"`);
    
    // Read the original Cart.jsx file to understand the structure
    const cartFilePath = path.join(__dirname, 'src', 'pages', 'Cart.jsx');
    const originalCode = readFileSync(cartFilePath, 'utf8');
    
    console.log(`📄 Original Cart.jsx loaded (${originalCode.length} characters)`);
    
    // Find the line with "Looks like you haven't added anything to your cart yet."
    const targetLine = 'Looks like you haven\'t added anything to your cart yet.';
    const replacementLine = 'adam like you haven\'t added anything to your cart yet.';
    
    // Check if the target line exists
    if (originalCode.includes(targetLine)) {
      console.log('✅ Found target line: "Looks like you haven\'t added anything to your cart yet."');
      
      // Create the modified code
      const modifiedCode = originalCode.replace(targetLine, replacementLine);
      
      console.log(`✅ Created modified code (${modifiedCode.length} characters)`);
      console.log(`   Change: "${targetLine}" → "${replacementLine}"`);
      
      // Try direct SQL update to fix the existing patch
      console.log('\n📡 Updating existing patch via SQL...');
      
      const updateResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            UPDATE hybrid_customizations 
            SET current_code = $1,
                baseline_code = $2,
                updated_at = NOW(),
                change_summary = $3,
                change_description = $4
            WHERE id = $5 AND store_id = $6
          `,
          params: [
            modifiedCode,
            originalCode,
            'Replace "Looks" with "adam" in cart empty message',
            'Updated cart empty state message to replace "Looks" with "adam" for testing patch system',
            EXISTING_PATCH_ID,
            STORE_ID
          ]
        })
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
          console.log('✅ Patch updated successfully via SQL!');
          console.log(`   Rows affected: ${updateResult.rowsAffected || 1}`);
          
          // Verify the change
          console.log('\n🔍 Verifying patch update...');
          const verifyResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                SELECT id, file_path, 
                       (current_code LIKE '%adam like you haven%') as contains_adam_text,
                       (baseline_code LIKE '%Looks like you haven%') as contains_original_text,
                       LENGTH(current_code) as current_length,
                       LENGTH(baseline_code) as baseline_length
                FROM hybrid_customizations 
                WHERE id = $1
              `,
              params: [EXISTING_PATCH_ID]
            })
          });
          
          if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            if (verifyResult.success && verifyResult.data && verifyResult.data.length > 0) {
              const patch = verifyResult.data[0];
              console.log('🔍 Verification results:');
              console.log(`   - Contains "adam like you haven": ${patch.contains_adam_text}`);
              console.log(`   - Contains "Looks like you haven": ${patch.contains_original_text}`);
              console.log(`   - Current code length: ${patch.current_length}`);
              console.log(`   - Baseline code length: ${patch.baseline_length}`);
              
              if (patch.contains_adam_text && patch.contains_original_text) {
                console.log('\n🎉 SUCCESS! Patch properly updated!');
                console.log('   The Simple Preview should now show "adam" instead of "Looks"');
                console.log('   in the empty cart message when you reload it.');
              } else {
                console.log('\n⚠️ Warning: Verification shows unexpected results');
              }
            }
          }
          
          return {
            success: true,
            patchId: EXISTING_PATCH_ID,
            message: 'Adam patch fixed successfully!'
          };
        } else {
          throw new Error(`SQL update failed: ${updateResult.error || 'Unknown error'}`);
        }
      } else {
        throw new Error(`HTTP ${updateResponse.status}: ${await updateResponse.text()}`);
      }
      
    } else {
      console.log('❌ Target line not found in Cart.jsx');
      console.log('   Looking for: "Looks like you haven\'t added anything to your cart yet."');
      
      // Let's search for similar text
      const lines = originalCode.split('\n');
      const matchingLines = lines.filter(line => line.toLowerCase().includes('looks') || line.toLowerCase().includes('cart'));
      
      console.log('\n🔍 Found related lines containing "looks" or "cart":');
      matchingLines.forEach((line, index) => {
        console.log(`   ${index + 1}. ${line.trim()}`);
      });
      
      return {
        success: false,
        error: 'Target line not found in Cart.jsx'
      };
    }
    
  } catch (error) {
    console.error('❌ Error fixing adam patch:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  fixAdamPatch()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Patch fix completed!');
        console.log('   Reload the Simple Preview to see "adam" text in the empty cart message.');
      } else {
        console.error('\n💥 Failed to fix patch:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { fixAdamPatch };