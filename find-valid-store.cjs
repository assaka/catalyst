/**
 * Find valid store IDs in the database
 */

const { sequelize } = require('./backend/src/database/connection');

async function findValidStore() {
  try {
    console.log('🔍 Finding Valid Store IDs');
    console.log('========================');
    
    // Try different possible table names for stores
    const possibleTables = ['stores', 'Stores', 'store'];
    
    for (const tableName of possibleTables) {
      try {
        console.log(`\n📋 Checking table: ${tableName}`);
        
        const stores = await sequelize.query(`
          SELECT id, name, slug, status, created_at
          FROM ${tableName}
          ORDER BY created_at DESC
          LIMIT 10
        `, {
          type: sequelize.QueryTypes.SELECT
        });
        
        if (stores.length > 0) {
          console.log(`✅ Found ${stores.length} stores in '${tableName}' table:`);
          stores.forEach((store, index) => {
            console.log(`  ${index + 1}. ID: ${store.id}`);
            console.log(`     Name: ${store.name || 'No name'}`);
            console.log(`     Slug: ${store.slug || 'No slug'}`);
            console.log(`     Status: ${store.status || 'No status'}`);
            console.log(`     Created: ${store.created_at || 'No date'}`);
            console.log('');
          });
          
          // Use the first store for our test
          const firstStore = stores[0];
          console.log('🎯 Recommended store for testing:');
          console.log(`   Store ID: ${firstStore.id}`);
          console.log(`   Store Name: ${firstStore.name || 'Unknown'}`);
          console.log(`   Store Slug: ${firstStore.slug || 'store'}`);
          
          await sequelize.close();
          return firstStore;
        } else {
          console.log(`❌ No stores found in '${tableName}' table`);
        }
        
      } catch (error) {
        console.log(`❌ Table '${tableName}' doesn't exist or error: ${error.message}`);
      }
    }
    
    console.log('\n❌ No stores found in any table');
    console.log('💡 You might need to:');
    console.log('   1. Create a store in your application first');
    console.log('   2. Check if you\'re connected to the right database');
    console.log('   3. Verify the table structure');
    
    await sequelize.close();
    return null;
    
  } catch (error) {
    console.error('❌ Error finding stores:', error);
    await sequelize.close();
    process.exit(1);
  }
}

findValidStore().then(store => {
  if (store) {
    console.log('\n✅ Success! Use this store ID in your PreviewTab configuration:');
    console.log(`   ${store.id}`);
  }
});