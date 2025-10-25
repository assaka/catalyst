/**
 * Script: Copy EN translations to NL for Products
 *
 * This script copies all EN product translations to NL as a temporary solution.
 * Use this when you want NL translations but don't need AI translation.
 *
 * Usage:
 *   node backend/src/scripts/copy-en-to-nl-products.js [store_id]
 */

const { sequelize } = require('../database/connection');

async function copyEnToNl(storeId = null) {
  console.log('🔄 Starting EN to NL copy process...\n');

  try {
    // Build store filter
    let storeFilter = '';
    if (storeId) {
      storeFilter = `AND p.store_id = '${storeId}'`;
    }

    // Copy EN translations to NL for products that don't have NL yet
    const query = `
      INSERT INTO product_translations (product_id, language_code, name, description, short_description, created_at, updated_at)
      SELECT
        pt_en.product_id,
        'nl' as language_code,
        pt_en.name,
        pt_en.description,
        pt_en.short_description,
        NOW() as created_at,
        NOW() as updated_at
      FROM product_translations pt_en
      INNER JOIN products p ON pt_en.product_id = p.id
      LEFT JOIN product_translations pt_nl
        ON pt_en.product_id = pt_nl.product_id
        AND pt_nl.language_code = 'nl'
      WHERE pt_en.language_code = 'en'
        AND pt_nl.product_id IS NULL
        ${storeFilter}
      ON CONFLICT (product_id, language_code) DO NOTHING
    `;

    console.log('📋 Executing copy query...');

    const result = await sequelize.query(query);

    // Count how many were copied
    const countQuery = `
      SELECT COUNT(*) as count
      FROM product_translations
      WHERE language_code = 'nl'
      ${storeFilter.replace('p.store_id', 'product_id IN (SELECT id FROM products WHERE store_id')}
    `;

    const countResult = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT
    });

    const nlCount = countResult[0]?.count || 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Copy Results:');
    console.log('='.repeat(60));
    console.log(`Total NL translations now: ${nlCount}`);
    console.log('='.repeat(60) + '\n');
    console.log('✅ Copy completed successfully!');

    return {
      success: true,
      nlCount
    };
  } catch (error) {
    console.error('🚨 Fatal error:', error);
    throw error;
  }
}

// Run the script
const storeId = process.argv[2]; // Optional: get store_id from command line

copyEnToNl(storeId)
  .then((results) => {
    console.log(`\n✅ Script completed! ${results.nlCount} NL translations available.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
