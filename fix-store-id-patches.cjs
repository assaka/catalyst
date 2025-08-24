const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Checking store_id in existing patches...');
    
    const [results] = await sequelize.query(`
      SELECT id, user_id, store_id, file_path, status 
      FROM hybrid_customizations 
      WHERE file_path LIKE '%Cart.jsx' 
      ORDER BY created_at DESC
    `);
    
    console.log('📋 Current patches:');
    results.forEach(row => {
      console.log(`  - ID: ${row.id}`);
      console.log(`    User ID: ${row.user_id}`);  
      console.log(`    Store ID: ${row.store_id || 'NULL'}`);
      console.log(`    File: ${row.file_path}`);
      console.log(`    Status: ${row.status}`);
      console.log('');
    });
    
    // Check if we need to update store_id
    const needsUpdate = results.some(row => row.store_id === null);
    if (needsUpdate) {
      console.log('⚠️  Some patches have NULL store_id - need to update them');
      console.log('   Running update query...');
      
      const [updateResult] = await sequelize.query(`
        UPDATE hybrid_customizations 
        SET store_id = '157d4590-49bf-4b0b-bd77-abe131909528'
        WHERE store_id IS NULL
      `);
      
      console.log(`✅ Updated patches with store_id`);
    } else {
      console.log('✅ All patches already have store_id populated');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();