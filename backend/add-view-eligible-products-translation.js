/**
 * Add 'View eligible products' translation
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-view-eligible-products-translation.js
 */

const { Translation } = require('./src/models');

const translations = {
  'discount.view_eligible_products': { en: 'View eligible products', nl: 'Bekijk in aanmerking komende producten' }
};

async function addTranslations() {
  console.log('🔄 Adding "View eligible products" translation...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const [key, translationValues] of Object.entries(translations)) {
    try {
      const category = 'discount';

      // Add English translation
      const [enTranslation, enCreated] = await Translation.findOrCreate({
        where: {
          key: key,
          language_code: 'en'
        },
        defaults: {
          key: key,
          language_code: 'en',
          value: translationValues.en,
          category: category
        }
      });

      if (enCreated) {
        console.log(`  ✅ Added EN: ${key} = "${translationValues.en}"`);
        addedCount++;
      } else {
        console.log(`  ⏭️  Skipped EN: ${key} (already exists)`);
        skippedCount++;
      }

      // Add Dutch translation
      const [nlTranslation, nlCreated] = await Translation.findOrCreate({
        where: {
          key: key,
          language_code: 'nl'
        },
        defaults: {
          key: key,
          language_code: 'nl',
          value: translationValues.nl,
          category: category
        }
      });

      if (nlCreated) {
        console.log(`  ✅ Added NL: ${key} = "${translationValues.nl}"`);
        addedCount++;
      } else {
        console.log(`  ⏭️  Skipped NL: ${key} (already exists)`);
        skippedCount++;
      }

    } catch (error) {
      console.error(`  ❌ Error adding ${key}:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log('\n✨ Done!');
}

// Run the script
addTranslations()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
