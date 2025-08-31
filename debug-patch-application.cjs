/**
 * Debug why the adam patch isn't being applied properly in Simple Preview
 * This will help understand what's happening with patch application
 */

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const FILE_PATH = 'src/pages/Cart.jsx';

async function debugPatchApplication() {
  try {
    console.log('🔍 Debugging patch application for Cart.jsx...');
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   File Path: ${FILE_PATH}`);
    
    // 1. Test the same API call that Simple Preview uses
    console.log('\n📡 Testing patches/apply API endpoint (same as Simple Preview)...');
    const applyResponse = await fetch(`${API_BASE_URL}/api/patches/apply/${encodeURIComponent(FILE_PATH)}?store_id=${STORE_ID}&preview=true&_t=${Date.now()}`);
    
    if (applyResponse.ok) {
      const applyResult = await applyResponse.json();
      console.log('✅ Patches/apply API response:');
      console.log(`   - Success: ${applyResult.success}`);
      console.log(`   - Has patches: ${applyResult.data?.hasPatches}`);
      console.log(`   - Applied patches: ${applyResult.data?.appliedPatches}`);
      console.log(`   - Total patches: ${applyResult.data?.totalPatches}`);
      console.log(`   - Patched code length: ${applyResult.data?.patchedCode?.length || 0}`);
      console.log(`   - Baseline code length: ${applyResult.data?.baselineCode?.length || 0}`);
      
      if (applyResult.data?.patchedCode) {
        const containsAdam = applyResult.data.patchedCode.includes('adam');
        const containsAdamLine = applyResult.data.patchedCode.includes('adam like you haven');
        const containsOriginalLine = applyResult.data.patchedCode.includes('Looks like you haven');
        
        console.log('\n🔍 Content analysis:');
        console.log(`   - Contains "adam": ${containsAdam}`);
        console.log(`   - Contains "adam like you haven": ${containsAdamLine}`);
        console.log(`   - Contains "Looks like you haven": ${containsOriginalLine}`);
        
        if (containsAdamLine) {
          console.log('✅ SUCCESS: Patch is being applied correctly!');
          console.log('   The "Looks" text has been replaced with "adam" in the patched code.');
        } else if (containsOriginalLine) {
          console.log('⚠️ ISSUE: Original "Looks" text is still present');
          console.log('   This suggests the patch is not being applied or is incorrect.');
        } else {
          console.log('❓ UNCLEAR: Neither original nor patched text found');
        }
        
        // Find the specific line in the patched code
        const lines = applyResult.data.patchedCode.split('\n');
        const targetLines = lines.filter(line => 
          line.includes('like you haven') || 
          line.includes('haven\'t added anything')
        );
        
        if (targetLines.length > 0) {
          console.log('\n📄 Found relevant lines in patched code:');
          targetLines.forEach((line, index) => {
            console.log(`   ${index + 1}. ${line.trim()}`);
          });
        }
      } else {
        console.log('❌ No patched code returned from API');
      }
    } else {
      console.log(`❌ Patches/apply API failed: ${applyResponse.status}`);
      const errorText = await applyResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    // 2. Test the baseline API
    console.log('\n📡 Testing baseline API...');
    const baselineResponse = await fetch(`${API_BASE_URL}/api/patches/baseline/${encodeURIComponent(FILE_PATH)}`);
    
    if (baselineResponse.ok) {
      const baselineResult = await baselineResponse.json();
      console.log('✅ Baseline API response:');
      console.log(`   - Success: ${baselineResult.success}`);
      console.log(`   - Has baseline: ${baselineResult.data?.hasBaseline}`);
      console.log(`   - Baseline code length: ${baselineResult.data?.baselineCode?.length || 0}`);
      
      if (baselineResult.data?.baselineCode) {
        const containsOriginal = baselineResult.data.baselineCode.includes('Looks like you haven');
        console.log(`   - Contains original "Looks" line: ${containsOriginal}`);
      }
    } else {
      console.log(`❌ Baseline API failed: ${baselineResponse.status}`);
    }
    
    // 3. Test the preview URL generation (same as Simple Preview)
    console.log('\n🔗 Testing preview URL generation...');
    const previewUrl = `${API_BASE_URL}/preview/${STORE_ID}?fileName=${encodeURIComponent(FILE_PATH)}&patches=true&storeSlug=store&pageName=Cart&_t=${Date.now()}`;
    console.log(`   Preview URL: ${previewUrl}`);
    
    try {
      const previewResponse = await fetch(previewUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (previewResponse.ok) {
        const previewHtml = await previewResponse.text();
        const containsAdam = previewHtml.includes('adam');
        const containsAdamLine = previewHtml.includes('adam like you haven');
        const containsOriginalLine = previewHtml.includes('Looks like you haven');
        
        console.log('✅ Preview HTML response:');
        console.log(`   - HTML length: ${previewHtml.length}`);
        console.log(`   - Contains "adam": ${containsAdam}`);
        console.log(`   - Contains "adam like you haven": ${containsAdamLine}`);
        console.log(`   - Contains "Looks like you haven": ${containsOriginalLine}`);
        
        if (containsAdamLine) {
          console.log('🎉 SUCCESS: Preview HTML shows "adam" text!');
          console.log('   The patch is working correctly in the preview.');
        } else if (containsOriginalLine) {
          console.log('⚠️ ISSUE: Preview HTML still shows original "Looks" text');
          console.log('   The patch may not be applied to the preview rendering.');
        } else {
          console.log('❓ Neither text found in preview HTML');
        }
      } else {
        console.log(`❌ Preview URL failed: ${previewResponse.status}`);
      }
    } catch (previewError) {
      console.log(`❌ Preview URL error: ${previewError.message}`);
    }
    
    console.log('\n📊 Debug Summary:');
    console.log('1. Simple Preview uses /api/patches/apply to get patched code');
    console.log('2. Then generates preview URL with patches=true parameter');  
    console.log('3. The preview URL should serve the patched version');
    console.log('4. If patches API shows "adam" but preview doesn\'t, there\'s a rendering issue');
    
    return {
      success: true,
      message: 'Debug completed - check console output for details'
    };
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  debugPatchApplication()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Debug completed!');
        console.log('   Check the output above to understand patch application status.');
      } else {
        console.error('\n💥 Debug failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { debugPatchApplication };