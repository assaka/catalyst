#!/usr/bin/env node
/**
 * Check if login page translation keys exist
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkTranslations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const keys = ['welcome_back', 'already_registered_login', 'create_account', 'terms_agreement'];

    for (const key of keys) {
      const [results] = await sequelize.query(`
        SELECT key, language_code, value, category
        FROM translations
        WHERE key LIKE '%' || :key || '%'
        ORDER BY key, language_code
      `, { replacements: { key } });

      console.log(`🔍 Searching for: ${key}`);
      if (results.length === 0) {
        console.log('   ❌ NOT FOUND\n');
      } else {
        results.forEach(r => {
          console.log(`   ✅ ${r.key} (${r.language_code}): "${r.value}"`);
        });
        console.log('');
      }
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkTranslations();
