#!/usr/bin/env node

require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const migration = require('./src/migrations/20250115_create_normalized_attributes');

async function runMigration() {
  try {
    console.log('🚀 Starting normalized attributes migration...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified\n');

    // Get the query interface
    const queryInterface = sequelize.getQueryInterface();

    // Run the migration
    await migration.up(queryInterface, sequelize.Sequelize);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
