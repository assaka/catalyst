/**
 * Sync translations from database to store settings
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/sync-translations-to-store.js
 */

const { Store, Translation } = require('./src/models');

async function syncTranslations() {
  console.log('🔄 Syncing translations from database to store settings...\n');

  try {
    // Get all translations from database
    const translations = await Translation.findAll({
      order: [['language_code', 'ASC'], ['key', 'ASC']]
    });

    console.log(`📊 Found ${translations.length} translations in database\n`);

    // Group translations by language
    const translationsByLang = {};
    translations.forEach(t => {
      if (!translationsByLang[t.language_code]) {
        translationsByLang[t.language_code] = {};
      }
      translationsByLang[t.language_code][t.key] = t.value;
    });

    console.log('📝 Languages found:', Object.keys(translationsByLang).join(', '));
    Object.keys(translationsByLang).forEach(lang => {
      console.log(`   ${lang}: ${Object.keys(translationsByLang[lang]).length} keys`);
    });

    // Get all stores
    const stores = await Store.findAll();
    console.log(`\n🏪 Found ${stores.length} store(s)\n`);

    // Update each store
    for (const store of stores) {
      console.log(`Updating store: ${store.store_name} (ID: ${store.id})`);

      const currentSettings = store.settings || {};
      const updatedSettings = {
        ...currentSettings,
        ui_translations: translationsByLang
      };

      await store.update({ settings: updatedSettings });
      console.log('  ✅ Store settings updated with translations\n');
    }

    console.log('✨ Done! Translations synced to all stores.');
    console.log('\n📊 Summary:');
    console.log(`  - Languages: ${Object.keys(translationsByLang).length}`);
    console.log(`  - Total translation keys: ${translations.length / Object.keys(translationsByLang).length}`);
    console.log(`  - Stores updated: ${stores.length}`);

  } catch (error) {
    console.error('❌ Error syncing translations:', error);
    throw error;
  }
}

// Run the script
syncTranslations()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
