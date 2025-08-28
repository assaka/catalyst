const { sequelize } = require('./backend/src/database/connection.js');

async function debugPatches() {
  try {
    console.log('🔍 Debugging patch detection issue...');
    
    // Check if patch_diffs table exists
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name IN ('patch_diffs', 'code_patches') AND table_schema = 'public'");
    
    console.log('📊 Patch tables found:', tables.length);
    
    if (tables.length === 0) {
      console.log('❌ No patch tables exist');
      
      // Show all tables to understand what's available
      const [allTables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
      console.log('\n📋 All available tables:');
      allTables.forEach(table => console.log('  - ' + table));
      return;
    }
    
    // Check for patches in each table (tables is a flat array of table names)
    for (const tableName of tables) {
      console.log(`\n📋 Checking ${tableName} table:`);
      
      const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  Total records: ${count[0].count}`);
      
      if (count[0].count > 0) {
        // Check for our specific store
        const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
        
        try {
          const [storeCount] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName} WHERE store_id = ?`, [storeId]);
          console.log(`  Store-specific records: ${storeCount[0].count}`);
          
          if (storeCount[0].count > 0) {
            // Get sample records for our store
            const [records] = await sequelize.query(`SELECT * FROM ${tableName} WHERE store_id = ? LIMIT 3`, [storeId]);
            
            console.log('  Sample records:');
            records.forEach((record, idx) => {
              console.log(`    ${idx + 1}. Keys: ${Object.keys(record).join(', ')}`);
              if (record.file_path) {
                console.log(`       file_path: "${record.file_path}"`);
              }
              if (record.change_summary) {
                console.log(`       change_summary: "${record.change_summary}"`);
              }
              if (record.status !== undefined) {
                console.log(`       status: "${record.status}"`);
              }
              if (record.is_active !== undefined) {
                console.log(`       is_active: ${record.is_active}`);
              }
            });
          }
        } catch (e) {
          console.log(`  No store_id column in ${tableName}`);
        }
      }
    }
    
    console.log('\n🎯 What GlobalPatchProvider is looking for:');
    console.log('  Route: /cart');  
    console.log('  Mapped filename: "src/pages/Cart.jsx"');
    console.log('  Query: WHERE cp.file_path = "src/pages/Cart.jsx" AND cp.store_id = "157d4590-49bf-4b0b-bd77-abe131909528"');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugPatches();