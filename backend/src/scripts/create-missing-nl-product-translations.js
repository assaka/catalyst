/**
 * Script: Create Missing NL Translations for Products
 *
 * This script finds all products that have EN translations but are missing NL translations
 * and uses the AI translation service to create them.
 *
 * Usage:
 *   node backend/src/scripts/create-missing-nl-product-translations.js [store_id]
 *
 * If store_id is not provided, it will process all stores.
 */

const { sequelize } = require('../database/connection');
const translationService = require('../services/translation-service');

async function createMissingNLTranslations(storeId = null) {
  console.log('🔄 Starting NL translations creation process...\n');

  try {
    // Find products that have EN translations but missing NL translations
    let whereClause = '';
    if (storeId) {
      whereClause = `WHERE p.store_id = '${storeId}'`;
    }

    const query = `
      SELECT
        p.id,
        p.sku,
        p.store_id,
        en.name as en_name,
        en.description as en_description,
        en.short_description as en_short_description,
        nl.name as nl_name
      FROM products p
      INNER JOIN product_translations en
        ON p.id = en.product_id AND en.language_code = 'en'
      LEFT JOIN product_translations nl
        ON p.id = nl.product_id AND nl.language_code = 'nl'
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    console.log('📋 Executing query to find products...');
    const products = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📦 Found ${products.length} total products\n`);

    // Filter products missing NL translations
    const productsNeedingNL = products.filter(p => !p.nl_name);
    console.log(`🔍 Products missing NL translations: ${productsNeedingNL.length}\n`);

    if (productsNeedingNL.length === 0) {
      console.log('✅ All products already have NL translations!');
      return {
        total: products.length,
        translated: 0,
        skipped: products.length,
        failed: 0
      };
    }

    // Confirm with user
    console.log('Products to translate:');
    productsNeedingNL.slice(0, 5).forEach(p => {
      console.log(`  - ${p.sku}: "${p.en_name}"`);
    });
    if (productsNeedingNL.length > 5) {
      console.log(`  ... and ${productsNeedingNL.length - 5} more`);
    }
    console.log();

    // Translate each product
    const results = {
      total: productsNeedingNL.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const product of productsNeedingNL) {
      try {
        console.log(`🔄 Translating: ${product.sku} - "${product.en_name}"`);

        // Translate each field using Claude AI
        const translatedName = await translationService._translateWithClaude(
          product.en_name,
          'en',
          'nl',
          { type: 'heading', location: 'product' }
        );

        const translatedDescription = product.en_description
          ? await translationService._translateWithClaude(
              product.en_description,
              'en',
              'nl',
              { type: 'description', location: 'product' }
            )
          : null;

        const translatedShortDescription = product.en_short_description
          ? await translationService._translateWithClaude(
              product.en_short_description,
              'en',
              'nl',
              { type: 'paragraph', location: 'product' }
            )
          : null;

        // Insert NL translation into product_translations table
        await sequelize.query(`
          INSERT INTO product_translations (product_id, language_code, name, description, short_description, created_at, updated_at)
          VALUES (:productId, 'nl', :name, :description, :shortDescription, NOW(), NOW())
          ON CONFLICT (product_id, language_code)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            short_description = EXCLUDED.short_description,
            updated_at = NOW()
        `, {
          replacements: {
            productId: product.id,
            name: translatedName,
            description: translatedDescription,
            shortDescription: translatedShortDescription
          }
        });

        results.translated++;
        console.log(`   ✅ Translated successfully: "${translatedName}"`);
      } catch (error) {
        console.error(`   ❌ Error translating ${product.sku}:`, error.message);
        results.failed++;
        results.errors.push({
          productId: product.id,
          sku: product.sku,
          name: product.en_name,
          error: error.message
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Translation Results:');
    console.log('='.repeat(60));
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products needing NL: ${productsNeedingNL.length}`);
    console.log(`Successfully translated: ${results.translated}`);
    console.log(`Failed: ${results.failed}`);
    console.log('='.repeat(60) + '\n');

    if (results.errors.length > 0) {
      console.log('❌ Failed translations:');
      results.errors.forEach(err => {
        console.log(`  - ${err.sku}: ${err.error}`);
      });
      console.log();
    }

    return results;
  } catch (error) {
    console.error('🚨 Fatal error:', error);
    throw error;
  }
}

// Run the script
const storeId = process.argv[2]; // Optional: get store_id from command line

createMissingNLTranslations(storeId)
  .then((results) => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
