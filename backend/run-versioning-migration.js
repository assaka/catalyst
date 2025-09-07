#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const migration = require('./src/migrations/20250107_add_versioning_to_slot_configurations');

async function runVersioningMigration() {
  try {
    console.log('🚀 Starting slot configurations versioning migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    // Get the Sequelize DataTypes and QueryInterface
    const queryInterface = sequelize.getQueryInterface();
    const Sequelize = require('sequelize');
    
    // Run the up migration
    console.log('🔄 Running versioning migration...');
    await migration.up(queryInterface, Sequelize);
    
    console.log('✅ Versioning migration completed successfully!');
    
    // Verify the new columns were added
    console.log('🧪 Verifying migration...');
    const tableDescription = await queryInterface.describeTable('slot_configurations');
    
    const expectedColumns = ['status', 'version_number', 'page_type', 'published_at', 'published_by', 'parent_version_id'];
    let allColumnsPresent = true;
    
    for (const column of expectedColumns) {
      if (tableDescription[column]) {
        console.log(`✅ Column '${column}' added successfully`);
      } else {
        console.error(`❌ Column '${column}' not found`);
        allColumnsPresent = false;
      }
    }
    
    if (allColumnsPresent) {
      console.log('🎉 All versioning columns added successfully!');
    } else {
      console.error('❌ Some columns were not added properly');
    }
    
    // Check if existing records were updated
    const updatedRecords = await sequelize.query(
      "SELECT COUNT(*) as count FROM slot_configurations WHERE status = 'published'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`📊 Existing records updated to 'published' status: ${updatedRecords[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Versioning migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runVersioningMigration();
}

module.exports = runVersioningMigration;