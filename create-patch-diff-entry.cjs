/**
 * Create a proper patch_diff entry for dynamic Cart.jsx changes
 * This is the correct approach - modify patches in the database without touching core code
 */

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const FILE_PATH = 'src/pages/Cart.jsx';

async function createPatchDiffEntry() {
  try {
    console.log('🎯 Creating patch_diff entry for dynamic Cart.jsx changes...');
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   File Path: ${FILE_PATH}`);
    
    // First, let's check what's in the patch_diff table
    console.log('\n🔍 Checking existing patch_diff entries...');
    
    const queryResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          SELECT id, file_path, store_id, patch_content, status, created_at
          FROM patch_diffs 
          WHERE store_id = $1 AND file_path = $2
          ORDER BY created_at DESC
          LIMIT 5
        `,
        params: [STORE_ID, FILE_PATH]
      })
    });
    
    if (queryResponse.ok) {
      const queryResult = await queryResponse.json();
      if (queryResult.success && queryResult.data) {
        console.log(`✅ Found ${queryResult.data.length} existing patch_diff entries:`);
        queryResult.data.forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}`);
          console.log(`      Status: ${entry.status}`);
          console.log(`      Created: ${entry.created_at}`);
          console.log(`      Patch length: ${entry.patch_content?.length || 0} chars`);
        });
      }
    }
    
    // Create the dynamic change patch content (unified diff format)
    const patchContent = `--- a/src/pages/Cart.jsx
+++ b/src/pages/Cart.jsx
@@ -600,6 +600,21 @@
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                 <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
-                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
+                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">🎉 My Dynamic Cart</h1>
+                {/* Dynamic Welcome Banner - Added via patch_diff */}
+                <div className="mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-6 rounded-xl shadow-2xl">
+                    <div className="flex items-center justify-between">
+                        <div>
+                            <h2 className="text-2xl font-bold mb-2 flex items-center">
+                                🛒 Welcome to Your Enhanced Cart! 
+                                <span className="ml-2 text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full animate-pulse">DYNAMIC</span>
+                            </h2>
+                            <p className="text-sm opacity-90 mb-2">
+                                This colorful banner was added dynamically via patch_diff!
+                            </p>
+                        </div>
+                        <div className="text-4xl animate-bounce">✨</div>
+                    </div>
+                </div>
                 <CmsBlockRenderer position="cart_above_items" />
                 {cartItems.length === 0 ? (`;
    
    console.log('\n📝 Creating patch_diff entry...');
    
    // Create the patch_diff entry
    const insertResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          INSERT INTO patch_diffs (
            id, store_id, file_path, patch_content, status, 
            change_summary, change_description, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, 'active',
            $4, $5, NOW(), NOW()
          )
          RETURNING id
        `,
        params: [
          STORE_ID,
          FILE_PATH,
          patchContent,
          'Dynamic welcome banner enhancement',
          'Added colorful gradient welcome banner with animations to enhance cart page appearance via patch_diff system'
        ]
      })
    });
    
    if (insertResponse.ok) {
      const insertResult = await insertResponse.json();
      if (insertResult.success) {
        console.log('✅ patch_diff entry created successfully!');
        if (insertResult.data && insertResult.data.length > 0) {
          console.log(`   Patch ID: ${insertResult.data[0].id}`);
        }
        
        console.log('\n🎯 Dynamic changes are now available via patch system!');
        console.log('   The Simple Preview should now show:');
        console.log('   - 🎉 My Dynamic Cart (gradient title)');
        console.log('   - Colorful gradient welcome banner');
        console.log('   - Animated sparkle effect');
        console.log('   - "DYNAMIC" pulse indicator');
        
        // Verify the patch was created
        console.log('\n🔍 Verifying patch creation...');
        const verifyResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              SELECT COUNT(*) as count, MAX(created_at) as latest
              FROM patch_diffs 
              WHERE store_id = $1 AND file_path = $2 AND status = 'active'
            `,
            params: [STORE_ID, FILE_PATH]
          })
        });
        
        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json();
          if (verifyResult.success && verifyResult.data) {
            const { count, latest } = verifyResult.data[0];
            console.log(`✅ Verification: ${count} active patches found, latest: ${latest}`);
          }
        }
        
        return {
          success: true,
          message: 'Dynamic patch_diff entry created successfully!'
        };
      }
    }
    
    throw new Error('Failed to create patch_diff entry');
    
  } catch (error) {
    console.error('❌ Error creating patch_diff entry:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  createPatchDiffEntry()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Success! The patch_diff entry has been created.');
        console.log('   Reload the Simple Preview to see the dynamic changes applied via the patch system!');
      } else {
        console.error('\n💥 Failed to create patch_diff entry:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createPatchDiffEntry };