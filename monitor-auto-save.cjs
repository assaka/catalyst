console.log('🔍 Monitoring auto-save file path storage...');

const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('📋 Checking current state after table clearing...');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Check if tables are empty
    const [customizations] = await sequelize.query(`
      SELECT COUNT(*) as count FROM hybrid_customizations WHERE store_id = :storeId;
    `, { replacements: { storeId }});
    
    const [snapshots] = await sequelize.query(`
      SELECT COUNT(*) as count FROM customization_snapshots;
    `);
    
    console.log(`📊 Database state after clearing:`);
    console.log(`   Customizations: ${customizations[0].count}`);
    console.log(`   Snapshots: ${snapshots[0].count}`);
    
    if (customizations[0].count > 0) {
      console.log('\n📋 Current file paths stored:');
      const [paths] = await sequelize.query(`
        SELECT file_path, name, created_at 
        FROM hybrid_customizations 
        WHERE store_id = :storeId
        ORDER BY created_at DESC;
      `, { replacements: { storeId }});
      
      paths.forEach((path, i) => {
        console.log(`  ${i + 1}. "${path.file_path}" - ${path.name}`);
        console.log(`     Created: ${new Date(path.created_at).toLocaleTimeString()}`);
      });
    } else {
      console.log('\n✅ Tables are clean - ready for fresh auto-save testing');
      console.log('\n📝 Next steps:');
      console.log('   1. Make changes to Cart.jsx in the editor');
      console.log('   2. Wait for auto-save to trigger');
      console.log('   3. Run this script again to see what path gets stored');
      console.log('   4. Check if Diff tab can fetch the patches');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();