/**
 * Bulk Translation Script
 *
 * Usage:
 *   node scripts/bulk-translate.js --type=product --from=en --to=nl
 *   node scripts/bulk-translate.js --type=ui-labels --from=en --to=fr
 *   node scripts/bulk-translate.js --type=all --from=en --to=es --store=1
 */

require('dotenv').config();
const { Product, Category, CmsPage, CmsBlock, Attribute, AttributeValue, ProductTab, ProductLabel, CookieConsentSettings } = require('../backend/src/models');
const translationService = require('../backend/src/services/translation-service');
const { Op } = require('sequelize');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

const { type = 'all', from = 'en', to, store } = args;

if (!to) {
  console.error('❌ Error: --to language is required');
  console.log('Usage: node scripts/bulk-translate.js --type=product --from=en --to=nl --store=1');
  process.exit(1);
}

if (from === to) {
  console.error('❌ Error: Source and target languages must be different');
  process.exit(1);
}

// Entity type configurations
const entityTypes = {
  product: { model: Product, name: 'Products', icon: '📦' },
  category: { model: Category, name: 'Categories', icon: '📁' },
  cms_page: { model: CmsPage, name: 'CMS Pages', icon: '📄' },
  cms_block: { model: CmsBlock, name: 'CMS Blocks', icon: '📝' },
  attribute: { model: Attribute, name: 'Attributes', icon: '🏷' },
  attribute_value: { model: AttributeValue, name: 'Attribute Values', icon: '🔖', special: true },
  product_tab: { model: ProductTab, name: 'Product Tabs', icon: '📑' },
  product_label: { model: ProductLabel, name: 'Product Labels', icon: '🏷️' },
  cookie_consent: { model: CookieConsentSettings, name: 'Cookie Consent', icon: '🍪' }
};

/**
 * Translate UI Labels
 */
async function translateUILabels() {
  console.log(`\n🔤 Translating UI Labels from ${from} to ${to}...\n`);

  try {
    // Get all source language labels
    const sourceLabels = await translationService.getUILabels(from);

    if (!sourceLabels || !sourceLabels.labels) {
      console.log('⚠️  No UI labels found in source language');
      return { total: 0, translated: 0, skipped: 0, failed: 0 };
    }

    // Get existing target language labels to avoid re-translating
    const targetLabels = await translationService.getUILabels(to);
    const existingKeys = new Set(Object.keys(targetLabels.labels || {}));

    // Flatten nested labels to dot notation
    const flattenLabels = (obj, prefix = '') => {
      const result = {};
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(result, flattenLabels(value, fullKey));
        } else {
          result[fullKey] = value;
        }
      });
      return result;
    };

    const flatSourceLabels = flattenLabels(sourceLabels.labels);
    const keysToTranslate = Object.keys(flatSourceLabels).filter(key => !existingKeys.has(key));

    console.log(`📊 Total labels: ${Object.keys(flatSourceLabels).length}`);
    console.log(`📊 Already translated: ${existingKeys.size}`);
    console.log(`📊 To translate: ${keysToTranslate.length}\n`);

    if (keysToTranslate.length === 0) {
      console.log('✅ All UI labels already translated!');
      return {
        total: Object.keys(flatSourceLabels).length,
        translated: 0,
        skipped: Object.keys(flatSourceLabels).length,
        failed: 0
      };
    }

    const results = {
      total: Object.keys(flatSourceLabels).length,
      translated: 0,
      skipped: Object.keys(flatSourceLabels).length - keysToTranslate.length,
      failed: 0,
      errors: []
    };

    // Translate each missing label
    for (const key of keysToTranslate) {
      try {
        const sourceValue = flatSourceLabels[key];
        if (!sourceValue || typeof sourceValue !== 'string') {
          results.skipped++;
          continue;
        }

        console.log(`🔄 Translating: ${key}`);
        console.log(`   Source (${from}): "${sourceValue}"`);

        // Translate using AI with RAG context
        const translatedValue = await translationService.aiTranslate(sourceValue, from, to);
        console.log(`   Target (${to}): "${translatedValue}"`);

        // Determine category from key
        const category = key.split('.')[0] || 'common';

        // Save translation
        await translationService.saveUILabel(key, to, translatedValue, category, 'system');

        results.translated++;
        console.log(`   ✅ Saved\n`);

        // Rate limiting to avoid API throttling
        await sleep(500); // 500ms delay between translations

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        results.failed++;
        results.errors.push({ key, error: error.message });
      }
    }

    return results;

  } catch (error) {
    console.error('❌ Error translating UI labels:', error);
    throw error;
  }
}

/**
 * Translate Entities
 */
async function translateEntities(entityType, storeId) {
  const config = entityTypes[entityType];
  if (!config) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  console.log(`\n${config.icon} Translating ${config.name} from ${from} to ${to}...\n`);

  try {
    let entities;
    const whereClause = storeId ? { store_id: storeId } : {};

    // Handle AttributeValue specially (no direct store_id)
    if (config.special && entityType === 'attribute_value') {
      if (!storeId) {
        throw new Error('--store parameter is required for attribute_value translation');
      }
      const attributes = await Attribute.findAll({
        where: { store_id: storeId },
        attributes: ['id']
      });
      const attributeIds = attributes.map(attr => attr.id);
      entities = await AttributeValue.findAll({
        where: { attribute_id: { [Op.in]: attributeIds } }
      });
    } else {
      entities = await config.model.findAll({ where: whereClause });
    }

    const results = {
      total: entities.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    console.log(`📊 Found ${entities.length} ${config.name.toLowerCase()}\n`);

    // Translate each entity
    for (const entity of entities) {
      try {
        // Check if source translation exists
        if (!entity.translations || !entity.translations[from]) {
          console.log(`⚠️  Skipping ${entityType} #${entity.id}: No ${from} translation`);
          results.skipped++;
          continue;
        }

        // Check if target translation already exists
        if (entity.translations[to]) {
          console.log(`⏭️  Skipping ${entityType} #${entity.id}: Already has ${to} translation`);
          results.skipped++;
          continue;
        }

        console.log(`\n🔄 Translating ${entityType} #${entity.id}...`);

        // Get source fields
        const sourceTranslation = entity.translations[from];
        console.log(`   Source fields:`, Object.keys(sourceTranslation));

        // Translate using AI
        await translationService.aiTranslateEntity(entityType, entity.id, from, to);

        results.translated++;
        console.log(`   ✅ Successfully translated`);

        // Rate limiting
        await sleep(1000); // 1 second delay for entity translations (larger content)

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          id: entity.id,
          error: error.message
        });
      }
    }

    return results;

  } catch (error) {
    console.error(`❌ Error translating ${config.name}:`, error);
    throw error;
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print summary
 */
function printSummary(type, results) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Translation Summary: ${type}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total items:      ${results.total}`);
  console.log(`✅ Translated:    ${results.translated}`);
  console.log(`⏭️  Skipped:       ${results.skipped}`);
  console.log(`❌ Failed:        ${results.failed}`);

  if (results.errors && results.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    results.errors.slice(0, 10).forEach(err => {
      console.log(`   - ${err.key || err.id}: ${err.error}`);
    });
    if (results.errors.length > 10) {
      console.log(`   ... and ${results.errors.length - 10} more errors`);
    }
  }

  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌍 DainoStore Bulk Translation Tool`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Type:         ${type}`);
  console.log(`From:         ${from}`);
  console.log(`To:           ${to}`);
  console.log(`Store ID:     ${store || 'all'}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const allResults = {};

    if (type === 'ui-labels') {
      // Translate only UI labels
      const results = await translateUILabels();
      printSummary('UI Labels', results);
      allResults['ui-labels'] = results;

    } else if (type === 'all') {
      // Translate UI labels + all entity types
      const uiResults = await translateUILabels();
      allResults['ui-labels'] = uiResults;
      printSummary('UI Labels', uiResults);

      for (const [entityType, config] of Object.entries(entityTypes)) {
        const results = await translateEntities(entityType, store);
        allResults[entityType] = results;
        printSummary(config.name, results);
      }

    } else {
      // Translate specific entity type
      const results = await translateEntities(type, store);
      allResults[type] = results;
      printSummary(entityTypes[type]?.name || type, results);
    }

    // Grand total summary
    if (type === 'all') {
      const grandTotal = {
        total: 0,
        translated: 0,
        skipped: 0,
        failed: 0
      };

      Object.values(allResults).forEach(r => {
        grandTotal.total += r.total;
        grandTotal.translated += r.translated;
        grandTotal.skipped += r.skipped;
        grandTotal.failed += r.failed;
      });

      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎉 GRAND TOTAL`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Total items:      ${grandTotal.total}`);
      console.log(`✅ Translated:    ${grandTotal.translated}`);
      console.log(`⏭️  Skipped:       ${grandTotal.skipped}`);
      console.log(`❌ Failed:        ${grandTotal.failed}`);
      console.log(`${'='.repeat(60)}\n`);
    }

    console.log('✅ Bulk translation complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
