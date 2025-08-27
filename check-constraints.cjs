const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Checking change_type constraints...');
    
    // Check constraints on customization_overlays
    const [overlayConstraints] = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conrelid = 'customization_overlays'::regclass 
      AND conname LIKE '%change_type%';
    `);
    
    console.log('📋 customization_overlays change_type constraints:');
    overlayConstraints.forEach(c => {
      console.log('   - ' + c.conname + ': ' + c.definition);
    });
    
    // Check constraints on customization_snapshots  
    const [snapshotConstraints] = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conrelid = 'customization_snapshots'::regclass 
      AND conname LIKE '%change_type%';
    `);
    
    console.log('📋 customization_snapshots change_type constraints:');
    snapshotConstraints.forEach(c => {
      console.log('   - ' + c.conname + ': ' + c.definition);
    });
    
    // Also check what values currently exist in the database
    const [existingOverlayTypes] = await sequelize.query(`
      SELECT DISTINCT change_type, COUNT(*) as count
      FROM customization_overlays
      GROUP BY change_type
      ORDER BY count DESC;
    `);
    
    console.log('\n📊 Existing change_type values in customization_overlays:');
    existingOverlayTypes.forEach(row => {
      console.log('   - "' + row.change_type + '": ' + row.count + ' records');
    });
    
    const [existingSnapshotTypes] = await sequelize.query(`
      SELECT DISTINCT change_type, COUNT(*) as count
      FROM customization_snapshots
      GROUP BY change_type
      ORDER BY count DESC;
    `);
    
    console.log('\n📊 Existing change_type values in customization_snapshots:');
    existingSnapshotTypes.forEach(row => {
      console.log('   - "' + row.change_type + '": ' + row.count + ' records');
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();