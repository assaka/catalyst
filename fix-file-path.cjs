const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔧 Updating customization_snapshots with file_path from overlays...');
    
    // Update all snapshots that have NULL file_path
    const result = await sequelize.query(`
      UPDATE customization_snapshots 
      SET file_path = co.file_path
      FROM customization_overlays co
      WHERE customization_snapshots.customization_id = co.id
      AND customization_snapshots.file_path IS NULL;
    `);
    
    console.log('✅ Update query executed');
    
    // Verify the updates
    const [snapshots] = await sequelize.query(`
      SELECT 
        cs.id,
        cs.file_path,
        cs.change_summary,
        co.file_path as overlay_file_path
      FROM customization_snapshots cs
      LEFT JOIN customization_overlays co ON cs.customization_id = co.id
      ORDER BY cs.created_at DESC;
    `);
    
    console.log('\n📊 Snapshots after update:');
    let fixedCount = 0;
    snapshots.forEach((snap, index) => {
      const isFixed = snap.file_path !== null;
      if (isFixed) fixedCount++;
      
      console.log(`  ${index + 1}. ${snap.file_path || 'NULL ❌'}`);
      console.log(`     - Change: ${snap.change_summary}`);
      console.log(`     - Status: ${isFixed ? '✅ FIXED' : '❌ STILL NULL'}`);
      console.log('');
    });
    
    console.log(`\n📋 Summary: ${fixedCount}/${snapshots.length} snapshots now have file_path`);
    
    await sequelize.close();
    console.log('\n🎉 File path fix completed!');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    await sequelize.close();
  }
})();