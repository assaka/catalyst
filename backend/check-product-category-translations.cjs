#!/usr/bin/env node
/**
 * Check product and category translation keys in database
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkKeys() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Keys from product-config.js
    const productKeys = [
      'sku',
      'checkout.qty',
      'common.add_to_cart',
      'recommended_products'
    ];

    // Keys from category-config.js
    const categoryKeys = [
      'category_description',
      'filters',
      'price',
      'show_more',
      'apply_filters',
      'of',
      'products',
      'sort_by',
      'sort_position',
      'sort_name_asc',
      'sort_name_desc',
      'sort_price_low',
      'sort_price_high',
      'sort_newest',
      'active_filters',
      'clear_all',
      'add_to_cart',
      'out_of_stock',
      'previous',
      'next',
      'filter_by'
    ];

    console.log('🔍 Checking PRODUCT-CONFIG translation keys:\n');

    for (const key of productKeys) {
      const [results] = await sequelize.query(`
        SELECT key, language_code, value
        FROM translations
        WHERE key = :key OR key LIKE '%' || :key || '%'
        ORDER BY key, language_code
      `, { replacements: { key } });

      const enResult = results.find(r => r.language_code === 'en');
      if (enResult) {
        console.log(`  ✅ ${enResult.key} = "${enResult.value}"`);
      } else if (results.length > 0) {
        console.log(`  ⚠️  ${results[0].key} (no English translation)`);
      } else {
        console.log(`  ❌ "${key}" - NOT FOUND`);
      }
    }

    console.log('\n🔍 Checking CATEGORY-CONFIG translation keys:\n');

    for (const key of categoryKeys) {
      const [results] = await sequelize.query(`
        SELECT key, language_code, value
        FROM translations
        WHERE key = :key OR key LIKE '%' || :key || '%'
        ORDER BY key, language_code
      `, { replacements: { key } });

      const enResult = results.find(r => r.language_code === 'en');
      if (enResult) {
        console.log(`  ✅ ${enResult.key} = "${enResult.value}"`);
      } else if (results.length > 0) {
        console.log(`  ⚠️  ${results[0].key} (no English translation)`);
      } else {
        console.log(`  ❌ "${key}" - NOT FOUND`);
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

checkKeys();
