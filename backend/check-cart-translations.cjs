#!/usr/bin/env node
/**
 * Check cart translation keys in database
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkCartKeys() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const keys = [
      'my_cart', 'your_cart_is_empty', 'cart_empty_message', 'continue_shopping',
      'remove', 'apply_coupon', 'coupon_applied_successfully', 'enter_coupon_code',
      'apply', 'order_summary', 'subtotal', 'additional_products', 'discount',
      'tax', 'total', 'proceed_now'
    ];

    console.log('🔍 Checking cart translation keys:\n');

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

checkCartKeys();
