/**
 * Script to create a dynamic change to Cart.jsx through the patch system
 * This will add a colorful "Welcome to Your Cart!" banner without editing core code
 */

const { readFileSync } = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

// Create a dynamic patch that adds a welcome banner
async function createDynamicCartChange() {
  try {
    console.log('🎨 Creating dynamic change for Cart.jsx...');
    
    // Read the original Cart.jsx file directly
    const cartFilePath = path.join(__dirname, 'src', 'pages', 'Cart.jsx');
    const originalCode = readFileSync(cartFilePath, 'utf8');
    
    // Add a dynamic welcome banner after the page title
    const dynamicBanner = `
                {/* Dynamic Welcome Banner - Added via Patch System */}
                <div className="mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">🛒 Welcome to Your Cart!</h2>
                            <p className="text-sm opacity-90">This colorful banner was added dynamically via patches!</p>
                        </div>
                        <div className="text-3xl animate-pulse">✨</div>
                    </div>
                </div>`;
    
    // Find the position after the main title and insert the banner
    const titlePattern = /<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart<\/h1>/;
    const modifiedCode = originalCode.replace(
      titlePattern,
      `<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>${dynamicBanner}`
    );
    
    if (modifiedCode === originalCode) {
      console.warn('⚠️ Pattern not found, trying alternative approach...');
      
      // Alternative: Insert after the first H1 tag
      const h1Pattern = /(<h1[^>]*>.*?<\/h1>)/;
      const altModifiedCode = originalCode.replace(h1Pattern, `$1${dynamicBanner}`);
      
      if (altModifiedCode === originalCode) {
        throw new Error('Could not find insertion point for dynamic banner');
      }
      
      console.log('✅ Found alternative insertion point');
      modifiedCode = altModifiedCode;
    }
    
    console.log('📝 Creating patch with dynamic banner...');
    
    // Create the patch via API
    const patchResponse = await fetch(`${API_BASE_URL}/api/patches/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filePath: 'src/pages/Cart.jsx',
        modifiedCode: modifiedCode,
        patchName: 'Dynamic Welcome Banner',
        changeType: 'enhancement',
        changeSummary: 'Added colorful welcome banner to cart page',
        changeDescription: 'Dynamically added a gradient welcome banner with animation to enhance the cart page appearance without editing core code',
        priority: 1
      })
    });
    
    const patchResult = await patchResponse.json();
    
    if (patchResult.success) {
      console.log('✅ Dynamic patch created successfully!');
      console.log(`   Patch ID: ${patchResult.data.patchId}`);
      console.log(`   Action: ${patchResult.data.action}`);
      
      console.log('\n🎯 Now visit the Simple Preview to see the dynamic change!');
      console.log(`   The Cart.jsx page should now show a colorful welcome banner.`);
      
      return {
        success: true,
        patchId: patchResult.data.patchId,
        message: 'Dynamic cart change created successfully!'
      };
    } else {
      throw new Error(`Failed to create patch: ${patchResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating dynamic change:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  createDynamicCartChange()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Success! The dynamic change has been applied.');
        console.log('   Reload the Simple Preview to see the colorful welcome banner!');
      } else {
        console.error('\n💥 Failed to create dynamic change:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createDynamicCartChange };