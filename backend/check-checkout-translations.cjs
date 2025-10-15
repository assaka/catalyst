#!/usr/bin/env node
/**
 * Check checkout translation keys in database
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkCheckoutKeys() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const keys = ['checkout', 'processing_order'];

    console.log('🔍 Checking checkout translation keys:\n');

    for (const key of keys) {
      const [results] = await sequelize.query(`
        SELECT key, language_code, value
        FROM translations
        WHERE key LIKE '%' || :key || '%'
        ORDER BY key, language_code
      `, { replacements: { key } });

      if (results.length === 0) {
        console.log(`  ❌ ${key} - NOT FOUND`);
      } else {
        const enResult = results.find(r => r.language_code === 'en');
        if (enResult) {
          console.log(`  ✅ ${enResult.key} = "${enResult.value}"`);
        } else {
          console.log(`  ⚠️  ${results[0].key} (no English translation)`);
        }
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

checkCheckoutKeys();
