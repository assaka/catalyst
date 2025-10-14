/**
 * Add product detail page translations
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-product-detail-translations.js
 */

const { Translation } = require('./src/models');

const productDetailTranslations = {
  'total_price': { en: 'Total Price', nl: 'Totaalprijs' },
  'price_breakdown': { en: 'Price Breakdown', nl: 'Prijsopbouw' },
  'selected_options': { en: 'Selected Options', nl: 'Geselecteerde opties' }
};

async function addTranslations() {
  console.log('🔄 Adding product detail translations...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const [key, translations] of Object.entries(productDetailTranslations)) {
    try {
      // Add English translation
      const [enTranslation, enCreated] = await Translation.findOrCreate({
        where: {
          key: key,
          language_code: 'en'
        },
        defaults: {
          key: key,
          language_code: 'en',
          value: translations.en,
          category: 'product'
        }
      });

      if (enCreated) {
        console.log(`  ✅ Added EN: ${key} = "${translations.en}"`);
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
          value: translations.nl,
          category: 'product'
        }
      });

      if (nlCreated) {
        console.log(`  ✅ Added NL: ${key} = "${translations.nl}"`);
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
