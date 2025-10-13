#!/usr/bin/env node

/**
 * Run Translations Seeding Migration
 *
 * This script runs the translation seeding migration to populate
 * the translations table with default English UI labels.
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function runTranslationsSeed() {
  try {
    console.log('🌐 Starting translations seed...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified\n');

    // Import and run the migration
    console.log('📝 Loading migration: 20250116000000-seed-default-translations.js');
    const migration = require('./migrations/20250116000000-seed-default-translations');

    console.log('🔄 Running migration up()...\n');
    await migration.up(sequelize.getQueryInterface(), require('sequelize'));

    console.log('\n✅ Translations seeded successfully!\n');

    // Verify the translations were inserted
    const [results] = await sequelize.query(
      "SELECT COUNT(*) as count FROM translations WHERE language_code = 'en'"
    );
    const count = results[0].count;

    console.log(`📊 Total English translations in database: ${count}\n`);

    // Show sample translations
    const [samples] = await sequelize.query(
      "SELECT key, value, category FROM translations WHERE language_code = 'en' LIMIT 10"
    );

    console.log('📋 Sample translations:');
    samples.forEach(t => {
      console.log(`   ${t.category}.${t.key.split('.').pop()}: "${t.value}"`);
    });

    console.log('\n🎉 Done! You can now:');
    console.log('   1. Visit /admin/translations to manage translations');
    console.log('   2. Use "AI Translate All" to translate to other languages');
    console.log('   3. Add more custom translations as needed\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error('\nFull error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTranslationsSeed();
}

module.exports = runTranslationsSeed;
