#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { sequelize, supabase } = require('../connection');

async function runSeoSettingsMigration() {
  try {
    console.log('🚀 Starting SEO settings schema migration...');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'update-seo-settings-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    // Run the migration using raw query
    console.log('🔄 Running SEO settings migration...');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}`);
          await sequelize.query(statement + ';');
          console.log(`✅ Statement ${i + 1} completed`);
        } catch (error) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
        }
      }
    }

    console.log('✅ SEO settings migration completed successfully!');

    // Verify the new column was added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'seo_settings'
      AND column_name IN ('enable_hreflang', 'hreflang_settings')
      ORDER BY column_name;
    `);

    console.log('📊 Verified columns:');
    results.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSeoSettingsMigration();
}

module.exports = runSeoSettingsMigration;
