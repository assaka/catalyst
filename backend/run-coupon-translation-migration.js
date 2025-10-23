#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const migration = require('./migrations/20251023000000-add-translations-to-coupons');

async function runMigration() {
  try {
    console.log('🚀 Starting coupon translation migration...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    // Run the migration
    console.log('🔄 Adding translations column to coupons table...');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('✅ Migration completed successfully!');

    // Verify the migration
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'coupons' AND column_name = 'translations';
    `);

    if (results.length > 0) {
      console.log('✅ Verified: translations column exists in coupons table');
    } else {
      console.warn('⚠️  Warning: translations column not found in coupons table');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
