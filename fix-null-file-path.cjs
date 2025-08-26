const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔧 Fixing NULL file_path values in snapshots...');
    
    // First check how many need fixing
    const [beforeCount] = await sequelize.query('SELECT COUNT(*) as count FROM customization_snapshots WHERE file_path IS NULL;');
    console.log('📊 Snapshots with NULL file_path before fix:', beforeCount[0].count);
    
    if (beforeCount[0].count > 0) {
      // Run the update query
      const updateQuery = `
        UPDATE customization_snapshots 
        SET file_path = co.file_path
        FROM customization_overlays co
        WHERE customization_snapshots.customization_id = co.id
        AND customization_snapshots.file_path IS NULL
      `;
      
      await sequelize.query(updateQuery);
      console.log('✅ Update query executed successfully');
      
      // Verify the fix
      const [afterCount] = await sequelize.query('SELECT COUNT(*) as count FROM customization_snapshots WHERE file_path IS NULL;');
      console.log('📊 Snapshots with NULL file_path after fix:', afterCount[0].count);
      
      // Show updated snapshots
      const [updated] = await sequelize.query('SELECT id, file_path, change_summary FROM customization_snapshots ORDER BY created_at DESC LIMIT 3;');
      console.log('📋 Recent snapshots after fix:');
      updated.forEach((snap, idx) => {
        console.log(`  ${idx + 1}. ${snap.change_summary} - file_path: ${snap.file_path || 'NULL'}`);
      });
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();