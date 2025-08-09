const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔧 Running AkeneoMapping metadata migration...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'src/database/migrations/add-metadata-to-akeneo-mappings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await sequelize.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the columns were added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'akeneo_mappings' 
      AND column_name IN ('metadata', 'sort_order')
      ORDER BY column_name;
    `);
    
    console.log('📋 Added columns:');
    results.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
runMigration();