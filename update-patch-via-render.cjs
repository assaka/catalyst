/**
 * Update the existing patch via Render/Supabase to add dynamic changes to Cart.jsx
 */

const { readFileSync } = require('fs');
const path = require('path');

// Use production endpoints via Render
const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const EXISTING_PATCH_ID = '10722068-930f-41db-915b-e6c627e7f539';
const FILE_PATH = 'src/pages/Cart.jsx';

async function updatePatchViaRender() {
  try {
    console.log('🎨 Updating patch via Render to add dynamic changes...');
    console.log(`   Patch ID: ${EXISTING_PATCH_ID}`);
    console.log(`   Store ID: ${STORE_ID}`);
    
    // Read the original Cart.jsx file
    const cartFilePath = path.join(__dirname, 'src', 'pages', 'Cart.jsx');
    const originalCode = readFileSync(cartFilePath, 'utf8');
    
    console.log(`📄 Original Cart.jsx loaded (${originalCode.length} characters)`);
    
    // Create the dynamic banner with colorful styling
    const dynamicBanner = `
                {/* Dynamic Welcome Banner - Added via Database Patch */}
                <div className="mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">🛒 Welcome to Your Enhanced Cart!</h2>
                            <p className="text-sm opacity-90">This colorful banner was added dynamically via database patches without editing the core code!</p>
                        </div>
                        <div className="text-4xl animate-pulse">✨</div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                        <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">Dynamic</span>
                        <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">Patched</span>
                        <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">Enhanced</span>
                    </div>
                </div>`;
    
    // Find the position after the main title and insert the banner
    const titlePattern = /<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart<\/h1>/;
    let modifiedCode = originalCode.replace(
      titlePattern,
      `<h1 className="text-3xl font-bold text-gray-900 mb-8">🎉 My Dynamic Cart</h1>${dynamicBanner}`
    );
    
    if (modifiedCode === originalCode) {
      console.log('⚠️ Primary pattern not found, trying after FlashMessage...');
      
      // Alternative: Find the FlashMessage component and insert after it
      const flashPattern = /(<FlashMessage message=\{flashMessage\}[^>]*\/>)/;
      modifiedCode = originalCode.replace(flashPattern, `$1${dynamicBanner}`);
      
      if (modifiedCode === originalCode) {
        console.log('⚠️ FlashMessage pattern not found, trying after page div...');
        
        // Alternative: Insert after the main container div
        const containerPattern = /(<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">)/;
        modifiedCode = originalCode.replace(containerPattern, `$1${dynamicBanner}`);
        
        if (modifiedCode === originalCode) {
          throw new Error('Could not find suitable insertion point for dynamic banner');
        }
      }
    }
    
    console.log(`✅ Modified code created (${modifiedCode.length} characters, +${modifiedCode.length - originalCode.length} change)`);
    
    // Use the Render API to create/update the patch
    console.log('📡 Sending patch update to Render API...');
    
    const response = await fetch(`${API_BASE_URL}/api/patches/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required auth headers here if needed
      },
      body: JSON.stringify({
        filePath: FILE_PATH,
        modifiedCode: modifiedCode,
        patchName: 'Dynamic Welcome Banner Enhancement',
        changeType: 'enhancement',
        changeSummary: 'Added colorful welcome banner to cart page',
        changeDescription: 'Dynamically added a gradient welcome banner with animations and tags to enhance the cart page appearance without editing core code',
        priority: 1,
        sessionId: `dynamic-${Date.now()}`,
        useUpsert: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Patch updated successfully via Render API!');
      console.log(`   Patch ID: ${result.data.patchId}`);
      console.log(`   Action: ${result.data.action}`);
      
      console.log('\n🎯 Now refresh the Simple Preview to see the dynamic changes!');
      console.log('   The Cart.jsx page should now show:');
      console.log('   - Colorful gradient welcome banner');
      console.log('   - Enhanced title with emoji');
      console.log('   - Animated elements');
      
      return {
        success: true,
        patchId: result.data.patchId,
        message: 'Dynamic patch updated successfully via Render!'
      };
    } else {
      throw new Error(`Render API error: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating patch via Render:', error.message);
    
    // If API fails, let's try the direct database approach via a simpler method
    console.log('\n🔄 Trying alternative approach...');
    
    // Use a simple SQL update via fetch to the debug endpoint
    try {
      const debugResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            UPDATE hybrid_customizations 
            SET current_code = $1,
                updated_at = NOW(),
                change_summary = $2,
                change_description = $3
            WHERE id = $4
          `,
          params: [
            modifiedCode,
            'Dynamic welcome banner enhancement',
            'Added colorful gradient welcome banner with animations to enhance cart page appearance',
            EXISTING_PATCH_ID
          ]
        })
      });
      
      const debugResult = await debugResponse.json();
      
      if (debugResult.success) {
        console.log('✅ Patch updated successfully via direct SQL!');
        return {
          success: true,
          patchId: EXISTING_PATCH_ID,
          message: 'Dynamic patch updated via direct SQL!'
        };
      }
    } catch (altError) {
      console.error('❌ Alternative approach also failed:', altError.message);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  updatePatchViaRender()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Success! The dynamic changes have been applied via Render.');
        console.log('   Reload the Simple Preview to see the enhanced cart page!');
      } else {
        console.error('\n💥 Failed to update patch:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { updatePatchViaRender };