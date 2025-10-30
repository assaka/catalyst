/**
 * Translate a single field for multiple entities
 *
 * Usage:
 *   node scripts/translate-single-field.js --entity=product --field=name --from=en --to=nl
 *   node scripts/translate-single-field.js --entity=category --field=description --from=en --to=fr --store=1
 */

require('dotenv').config();
const { Product, Category, CmsPage, CmsBlock } = require('../backend/src/models');
const translationService = require('../backend/src/services/translation-service');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

const { entity, field, from = 'en', to, store } = args;

if (!entity || !field || !to) {
  console.error('❌ Error: --entity, --field, and --to are required');
  console.log('Usage: node scripts/translate-single-field.js --entity=product --field=name --from=en --to=nl');
  process.exit(1);
}

const entityModels = {
  product: Product,
  category: Category,
  cms_page: CmsPage,
  cms_block: CmsBlock
};

async function translateSingleField() {
  console.log(`\n🔄 Translating ${entity}.${field} from ${from} to ${to}...\n`);

  const Model = entityModels[entity];
  if (!Model) {
    throw new Error(`Unknown entity: ${entity}. Available: ${Object.keys(entityModels).join(', ')}`);
  }

  const whereClause = store ? { store_id: store } : {};
  const entities = await Model.findAll({ where: whereClause });

  console.log(`📊 Found ${entities.length} ${entity} records\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (const item of entities) {
    try {
      // Check if source field exists
      if (!item.translations || !item.translations[from] || !item.translations[from][field]) {
        console.log(`⏭️  Skipping ${entity} #${item.id}: No ${from} ${field}`);
        skipped++;
        continue;
      }

      // Check if target field already exists
      if (item.translations[to] && item.translations[to][field]) {
        console.log(`⏭️  Skipping ${entity} #${item.id}: Already has ${to} ${field}`);
        skipped++;
        continue;
      }

      const sourceValue = item.translations[from][field];
      console.log(`\n🔄 ${entity} #${item.id}`);
      console.log(`   ${field} (${from}): "${sourceValue.substring(0, 50)}${sourceValue.length > 50 ? '...' : ''}"`);

      // Determine translation context based on field type
      const context = {
        type: field === 'name' || field === 'title' ? 'heading' : 'description',
        location: entity
      };

      // Translate
      const translatedValue = await translationService.aiTranslate(
        sourceValue,
        from,
        to,
        context
      );

      console.log(`   ${field} (${to}): "${translatedValue.substring(0, 50)}${translatedValue.length > 50 ? '...' : ''}"`);

      // Save
      const translations = item.translations || {};
      if (!translations[to]) {
        translations[to] = {};
      }
      translations[to][field] = translatedValue;

      item.translations = translations;
      item.changed('translations', true);
      await item.save();

      translated++;
      console.log(`   ✅ Saved`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failed++;
      errors.push({
        id: item.id,
        error: error.message
      });
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Translation Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Entity:       ${entity}`);
  console.log(`Field:        ${field}`);
  console.log(`From:         ${from}`);
  console.log(`To:           ${to}`);
  console.log(`Store:        ${store || 'all'}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total:        ${entities.length}`);
  console.log(`✅ Translated: ${translated}`);
  console.log(`⏭️  Skipped:    ${skipped}`);
  console.log(`❌ Failed:     ${failed}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.slice(0, 10).forEach(err => {
      console.log(`   - ${entity} #${err.id}: ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }

  console.log(`${'='.repeat(60)}\n`);

  process.exit(0);
}

translateSingleField().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
