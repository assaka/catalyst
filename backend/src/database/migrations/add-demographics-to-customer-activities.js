/**
 * Database Migration: Add Demographics to Customer Activities
 * Adds country, language, city, region for geographic analytics
 * Run with: node src/database/migrations/add-demographics-to-customer-activities.js
 */

const sequelize = require('../../config/database');

async function runMigration() {
  try {
    console.log('Adding demographics columns to customer_activities table...');

    // Add country column
    await sequelize.query(`
      ALTER TABLE customer_activities
      ADD COLUMN IF NOT EXISTS country VARCHAR(2);
    `).catch(err => console.log('country column may already exist:', err.message));

    console.log('✓ Added country column');

    // Add country_name column (full name)
    await sequelize.query(`
      ALTER TABLE customer_activities
      ADD COLUMN IF NOT EXISTS country_name VARCHAR(100);
    `).catch(err => console.log('country_name column may already exist:', err.message));

    console.log('✓ Added country_name column');

    // Add city column
    await sequelize.query(`
      ALTER TABLE customer_activities
      ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    `).catch(err => console.log('city column may already exist:', err.message));

    console.log('✓ Added city column');

    // Add region column
    await sequelize.query(`
      ALTER TABLE customer_activities
      ADD COLUMN IF NOT EXISTS region VARCHAR(100);
    `).catch(err => console.log('region column may already exist:', err.message));

    console.log('✓ Added region column');

    // Add language column
    await sequelize.query(`
      ALTER TABLE customer_activities
      ADD COLUMN IF NOT EXISTS language VARCHAR(10);
    `).catch(err => console.log('language column may already exist:', err.message));

    console.log('✓ Added language column');

    // Add timezone column
    await sequelize.query(`
      ALTER TABLE customer_activities
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
    `).catch(err => console.log('timezone column may already exist:', err.message));

    console.log('✓ Added timezone column');

    // Create indexes for geographic queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_activities_country ON customer_activities(country);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_activities_city ON customer_activities(city);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_activities_language ON customer_activities(language);
    `);

    console.log('✓ Created geographic indexes');

    console.log('\n✅ Demographics columns added successfully!');
    console.log('New columns: country, country_name, city, region, language, timezone');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = runMigration;
