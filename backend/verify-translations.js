#!/usr/bin/env node

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function verifyTranslations() {
  try {
    console.log('🔍 Verifying cookie and checkout translations in Supabase...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    // Query translations
    const [results] = await sequelize.query(`
      SELECT key, language_code, value, category
      FROM translations
      WHERE key IN ('cookie.preferences', 'cookie.manage_preferences', 'checkout.login_prompt')
      ORDER BY category, key, language_code
    `);

    if (results.length === 0) {
      console.log('❌ No translations found. Please run the migration first.');
    } else {
      console.log(`\n✅ Found ${results.length} translations:\n`);
      results.forEach(row => {
        console.log(`  [${row.category}] ${row.key} (${row.language_code}): ${row.value}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyTranslations();
