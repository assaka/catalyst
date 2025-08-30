/**
 * Find real patches and stores for testing
 */

const { sequelize } = require('./backend/src/database/connection');

async function findRealPatchesAndStores() {
  try {
    console.log('🔍 Finding Real Patches and Stores');
    console.log('=================================');
    
    // First, find existing stores
    console.log('\n1. 🏪 Looking for stores...');
    try {
      const stores = await sequelize.query(`
        SELECT id, name, slug, status, created_at
        FROM stores
        ORDER BY created_at DESC
        LIMIT 5
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      
      if (stores.length > 0) {
        console.log(`✅ Found ${stores.length} stores:`);
        stores.forEach((store, index) => {
          console.log(`  ${index + 1}. ${store.id} - ${store.name || 'No name'} (${store.slug || 'no-slug'})`);
        });
        
        const testStore = stores[0];
        console.log(`\n🎯 Using store for patch search: ${testStore.id}`);
        
        // Now find patches for this store
        console.log('\n2. 🔧 Looking for patches...');
        const patches = await sequelize.query(`
          SELECT id, store_id, file_path, patch_name, status, is_active, created_at
          FROM patch_diffs 
          WHERE store_id = :storeId 
          ORDER BY created_at DESC
          LIMIT 10
        `, {
          replacements: { storeId: testStore.id },
          type: sequelize.QueryTypes.SELECT
        });
        
        if (patches.length > 0) {
          console.log(`✅ Found ${patches.length} patches for store ${testStore.id}:`);
          patches.forEach((patch, index) => {
            console.log(`  ${index + 1}. ${patch.id.substring(0, 8)}... - ${patch.file_path} - ${patch.patch_name || 'No name'} - ${patch.status}`);
          });
          
          // Find Cart.jsx patch specifically
          const cartPatch = patches.find(p => p.file_path === 'src/pages/Cart.jsx');
          if (cartPatch) {
            console.log('\n🎯 Found Cart.jsx patch:');
            console.log(`   Patch ID: ${cartPatch.id}`);
            console.log(`   Store ID: ${cartPatch.store_id}`);
            console.log(`   File: ${cartPatch.file_path}`);
            console.log(`   Name: ${cartPatch.patch_name}`);
            console.log(`   Status: ${cartPatch.status}`);
            console.log(`   Active: ${cartPatch.is_active}`);
            
            console.log('\n✅ Perfect! Use these values in PreviewTab:');
            console.log(`   Store ID: '${cartPatch.store_id}'`);
            console.log(`   Patch ID: '${cartPatch.id}'`);
            
            await sequelize.close();
            return { store: testStore, patch: cartPatch };
          } else {
            console.log('\n❌ No Cart.jsx patch found');
            
            // Show first available patch as alternative
            const firstPatch = patches[0];
            console.log(`\n💡 Alternative - use any existing patch:`);
            console.log(`   Store ID: '${firstPatch.store_id}'`);
            console.log(`   Patch ID: '${firstPatch.id}'`);
            console.log(`   File: '${firstPatch.file_path}'`);
            
            await sequelize.close();
            return { store: testStore, patch: firstPatch };
          }
        } else {
          console.log(`❌ No patches found for store ${testStore.id}`);
          
          // Check all patches regardless of store
          console.log('\n3. 🔧 Looking for ANY patches...');
          const allPatches = await sequelize.query(`
            SELECT id, store_id, file_path, patch_name, status, is_active
            FROM patch_diffs 
            ORDER BY created_at DESC
            LIMIT 5
          `, {
            type: sequelize.QueryTypes.SELECT
          });
          
          if (allPatches.length > 0) {
            console.log(`✅ Found ${allPatches.length} patches (any store):`);
            allPatches.forEach((patch, index) => {
              console.log(`  ${index + 1}. ${patch.id.substring(0, 8)}... - Store: ${patch.store_id} - ${patch.file_path} - ${patch.patch_name || 'No name'}`);
            });
            
            const anyPatch = allPatches[0];
            console.log('\n💡 Use this patch for testing:');
            console.log(`   Store ID: '${anyPatch.store_id}'`);
            console.log(`   Patch ID: '${anyPatch.id}'`);
            console.log(`   File: '${anyPatch.file_path}'`);
            
            await sequelize.close();
            return { store: { id: anyPatch.store_id }, patch: anyPatch };
          } else {
            console.log('❌ No patches found at all');
            await sequelize.close();
            return null;
          }
        }
      } else {
        console.log('❌ No stores found');
        await sequelize.close();
        return null;
      }
    } catch (error) {
      console.log('❌ Database error:', error.message);
      await sequelize.close();
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

findRealPatchesAndStores().then(result => {
  if (result) {
    console.log('\n🎯 Update your PreviewTab.jsx SPECIFIC_CONFIGS with:');
    console.log(`   storeId: '${result.store.id}'`);
    console.log(`   patchId: '${result.patch.id}'`);
    console.log(`   fileName: '${result.patch.file_path}'`);
  } else {
    console.log('\n❌ No valid patches found. You may need to create some patches first.');
  }
});