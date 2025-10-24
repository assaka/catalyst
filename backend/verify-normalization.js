#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function verifyNormalization() {
  try {
    console.log('🔍 Verifying normalized translation data...\n');

    // Verify product translations
    const productTranslations = await sequelize.query(`
      SELECT COUNT(*) as count, language_code
      FROM product_translations
      GROUP BY language_code
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📦 Product Translations:');
    productTranslations.forEach(row => {
      console.log(`   ${row.language_code}: ${row.count} products`);
    });

    // Verify category translations
    const categoryTranslations = await sequelize.query(`
      SELECT COUNT(*) as count, language_code
      FROM category_translations
      GROUP BY language_code
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📁 Category Translations:');
    categoryTranslations.forEach(row => {
      console.log(`   ${row.language_code}: ${row.count} categories`);
    });

    // Sample product with translations
    const sampleProduct = await sequelize.query(`
      SELECT
        p.id, p.sku,
        json_object_agg(
          t.language_code,
          json_build_object('name', t.name, 'description', SUBSTRING(t.description, 1, 50))
        ) as translations
      FROM products p
      LEFT JOIN product_translations t ON p.id = t.product_id
      GROUP BY p.id, p.sku
      LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📝 Sample Product with Translations:');
    if (sampleProduct.length > 0) {
      console.log(JSON.stringify(sampleProduct[0], null, 2));
    }

    // Verify SEO data
    const productSeo = await sequelize.query(`
      SELECT COUNT(*) as count FROM product_seo
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n🔍 SEO Data:');
    console.log(`   Product SEO records: ${productSeo[0].count}`);

    console.log('\n✅ Verification complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyNormalization();
