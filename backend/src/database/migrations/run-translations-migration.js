#!/usr/bin/env node

const { sequelize } = require('../connection');

async function runTranslationsMigration() {
  try {
    console.log('🚀 Starting translations migration...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    // Add translations column to product_tabs
    console.log('📝 Adding translations column to product_tabs...');
    await sequelize.query(`
      ALTER TABLE product_tabs
      ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Added translations to product_tabs');

    // Add translations column to product_labels
    console.log('📝 Adding translations column to product_labels...');
    await sequelize.query(`
      ALTER TABLE product_labels
      ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Added translations to product_labels');

    console.log('✅ Translations migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTranslationsMigration();
}

module.exports = runTranslationsMigration;
