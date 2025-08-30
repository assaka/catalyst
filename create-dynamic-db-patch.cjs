/**
 * Create a dynamic change to Cart.jsx by inserting directly into the database
 * This will add a colorful welcome banner without editing the core Cart.jsx file
 */

const { sequelize } = require('./backend/src/database/connection.js');
const { readFileSync } = require('fs');
const path = require('path');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const USER_ID = '96dc49e7-bf45-4608-b506-8b5107cb4ad0'; // Default user
const FILE_PATH = 'src/pages/Cart.jsx';
const EXISTING_PATCH_ID = '10722068-930f-41db-915b-e6c627e7f539'; // Use existing patch

async function createDynamicDbPatch() {
  try {
    console.log('🎨 Creating dynamic Cart.jsx change via database patch...');
    
    // Read the original Cart.jsx file
    const cartFilePath = path.join(__dirname, 'src', 'pages', 'Cart.jsx');
    const originalCode = readFileSync(cartFilePath, 'utf8');
    
    console.log(`📄 Original Cart.jsx loaded (${originalCode.length} characters)`);
    
    // Create the dynamic banner
    const dynamicBanner = `
                {/* Dynamic Welcome Banner - Added via Database Patch */}
                <div className="mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-4 rounded-lg shadow-lg animate-pulse">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">🛒 Welcome to Your Enhanced Cart!</h2>
                            <p className="text-sm opacity-90">This colorful banner was added dynamically via database patches!</p>
                        </div>
                        <div className="text-3xl animate-bounce">✨</div>
                    </div>
                </div>`;
    
    // Find the position after the main title and insert the banner
    const titlePattern = /<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart<\/h1>/;
    let modifiedCode = originalCode.replace(
      titlePattern,
      `<h1 className="text-3xl font-bold text-gray-900 mb-8">🎉 My Dynamic Cart</h1>${dynamicBanner}`
    );
    
    if (modifiedCode === originalCode) {
      console.log('⚠️ Primary pattern not found, trying alternative approach...');
      
      // Alternative: Find the FlashMessage component and insert after it
      const flashPattern = /<FlashMessage[^>]*\/>/;
      modifiedCode = originalCode.replace(flashPattern, `$&${dynamicBanner}`);
      
      if (modifiedCode === originalCode) {
        throw new Error('Could not find suitable insertion point for dynamic banner');
      }
    }
    
    console.log(`✅ Modified code created (${modifiedCode.length} characters, +${modifiedCode.length - originalCode.length} change)`);
    
    // Use the existing patch ID provided
    const customizationId = EXISTING_PATCH_ID;
    const action = 'updated';
    
    console.log(`🔄 Updating existing patch: ${customizationId}`);
    
    // Update the existing patch with our dynamic changes
    await sequelize.query(`
      UPDATE hybrid_customizations 
      SET current_code = :currentCode,
          updated_at = NOW(),
          change_summary = :changeSummary,
          change_description = :changeDescription
      WHERE id = :id
    `, {
      replacements: {
        id: customizationId,
        currentCode: modifiedCode,
        changeSummary: 'Dynamic welcome banner enhancement',
        changeDescription: 'Added colorful gradient welcome banner with animations to enhance cart page appearance'
      }
    });
    
    console.log(`✅ Database patch ${action} successfully!`);
    console.log(`   Customization ID: ${customizationId}`);
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   File Path: ${FILE_PATH}`);
    
    // Verify the patch was created
    const [verification] = await sequelize.query(`
      SELECT id, file_path, status, 
             LENGTH(baseline_code) as baseline_length,
             LENGTH(current_code) as current_length,
             (current_code LIKE '%Dynamic Welcome Banner%') as contains_banner,
             (current_code LIKE '%My Dynamic Cart%') as contains_dynamic_title
      FROM hybrid_customizations 
      WHERE id = :id
    `, { replacements: { id: customizationId }});
    
    if (verification.length > 0) {
      const patch = verification[0];
      console.log('\n🔍 Verification:');
      console.log(`  - Patch status: ${patch.status}`);
      console.log(`  - Baseline length: ${patch.baseline_length} chars`);
      console.log(`  - Current length: ${patch.current_length} chars`);
      console.log(`  - Contains banner: ${patch.contains_banner}`);
      console.log(`  - Contains dynamic title: ${patch.contains_dynamic_title}`);
      
      if (patch.contains_banner && patch.contains_dynamic_title) {
        console.log('\n🎉 SUCCESS! Dynamic patch created successfully!');
        console.log('   Now reload the Simple Preview to see the enhanced cart page!');
      } else {
        console.log('\n⚠️ Warning: Some dynamic elements may not have been added correctly');
      }
    }
    
    return {
      success: true,
      customizationId,
      action,
      message: 'Dynamic database patch created successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error creating dynamic database patch:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  createDynamicDbPatch()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 All done! The dynamic change has been applied to the database.');
        console.log('   Reload the Simple Preview component to see the colorful enhanced cart page!');
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

module.exports = { createDynamicDbPatch };