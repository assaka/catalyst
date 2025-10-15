/**
 * Add missing translation keys to database
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-missing-translations.js
 */

const { Translation } = require('./src/models');

// New translation keys needed
const newTranslations = {
  // English translations
  en: {
    show_more: 'Show More',
    show_less: 'Show Less',
    more: 'more',
    add_to_cart: 'Add to Cart',
    of: 'of',
    products: 'products',
    added_to_cart_success: ' added to cart successfully!',
    added_to_cart_error: 'Failed to add to cart. Please try again.',
    out_of_stock: 'Out of Stock',
    filters: 'Filters',
    filter_by: 'Filter By',
    price: 'Price',
    apply_filters: 'Apply Filters',
    active_filters: 'Active Filters',
    clear_all: 'Clear All',
    sort_by: 'Sort By',
    sort_position: 'Position',
    sort_name_asc: 'Name (A-Z)',
    sort_name_desc: 'Name (Z-A)',
    sort_price_low: 'Price: Low to High',
    sort_price_high: 'Price: High to Low',
    sort_newest: 'Newest First',
    previous: 'Previous',
    next: 'Next'
  },

  // Dutch translations
  nl: {
    show_more: 'Toon meer',
    show_less: 'Toon minder',
    more: 'meer',
    add_to_cart: 'Toevoegen aan winkelwagen',
    of: 'van',
    products: 'producten',
    added_to_cart_success: ' succesvol toegevoegd aan winkelwagen!',
    added_to_cart_error: 'Toevoegen aan winkelwagen mislukt. Probeer het opnieuw.',
    out_of_stock: 'Niet op voorraad',
    filters: 'Filters',
    filter_by: 'Filteren op',
    price: 'Prijs',
    apply_filters: 'Filters toepassen',
    active_filters: 'Actieve filters',
    clear_all: 'Alles wissen',
    sort_by: 'Sorteren op',
    sort_position: 'Positie',
    sort_name_asc: 'Naam (A-Z)',
    sort_name_desc: 'Naam (Z-A)',
    sort_price_low: 'Prijs: Laag naar hoog',
    sort_price_high: 'Prijs: Hoog naar laag',
    sort_newest: 'Nieuwste eerst',
    previous: 'Vorige',
    next: 'Volgende'
  }
};

async function addMissingTranslations() {
  console.log('🔄 Adding missing translation keys...\n');

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const [langCode, translations] of Object.entries(newTranslations)) {
    console.log(`📝 Processing ${langCode.toUpperCase()} translations...`);

    for (const [key, value] of Object.entries(translations)) {
      try {
        const [translation, created] = await Translation.findOrCreate({
          where: {
            key: key,
            language_code: langCode
          },
          defaults: {
            key: key,
            language_code: langCode,
            value: value,
            category: 'common'
          }
        });

        if (created) {
          console.log(`  ✅ Added: ${key} = "${value}"`);
          addedCount++;
        } else if (translation.value !== value) {
          translation.value = value;
          await translation.save();
          console.log(`  🔄 Updated: ${key} = "${value}"`);
          updatedCount++;
        } else {
          console.log(`  ⏭️  Skipped: ${key} (already exists)`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error adding ${key}:`, error.message);
      }
    }

    console.log('');
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  🔄 Updated: ${updatedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  📦 Total: ${addedCount + updatedCount + skippedCount}`);
  console.log('\n✨ Translation keys are now available!');
}

// Run the script
addMissingTranslations()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
