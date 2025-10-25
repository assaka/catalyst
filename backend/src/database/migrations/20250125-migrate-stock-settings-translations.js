/**
 * Migrate Stock Settings Translations
 *
 * Moves stock label translations from stores.settings.stock_settings.translations
 * to the global translations table for better management and consistency.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface;

    console.log('🔄 Migrating stock settings translations...');

    try {
      // Get all stores with stock settings translations
      const [stores] = await sequelize.query(`
        SELECT id, settings
        FROM stores
        WHERE settings->'stock_settings'->'translations' IS NOT NULL
      `);

      if (stores.length === 0) {
        console.log('ℹ️  No stock settings translations found to migrate');
        return;
      }

      console.log(`📊 Found ${stores.length} store(s) with stock settings translations`);

      // We'll use the first store's translations as the global defaults
      // since translations table is global (no store_id)
      const firstStore = stores[0];
      const stockSettings = firstStore.settings?.stock_settings;
      const translations = stockSettings?.translations || {};

      const stockLabelKeys = [
        'in_stock_label',
        'out_of_stock_label',
        'low_stock_label'
      ];

      let migratedCount = 0;

      // Migrate translations for each language
      for (const [languageCode, labels] of Object.entries(translations)) {
        console.log(`  📝 Migrating ${languageCode} translations...`);

        for (const labelKey of stockLabelKeys) {
          const value = labels[labelKey];

          if (!value) {
            console.log(`    ⚠️  Skipping empty ${labelKey} for ${languageCode}`);
            continue;
          }

          const translationKey = `stock.${labelKey}`;

          try {
            // Check if translation already exists
            const [existing] = await sequelize.query(`
              SELECT id FROM translations
              WHERE key = :key AND language_code = :languageCode
            `, {
              replacements: { key: translationKey, languageCode }
            });

            if (existing.length > 0) {
              // Update existing translation
              await sequelize.query(`
                UPDATE translations
                SET value = :value, updated_at = NOW()
                WHERE key = :key AND language_code = :languageCode
              `, {
                replacements: { key: translationKey, languageCode, value }
              });
              console.log(`    ✅ Updated ${translationKey} (${languageCode})`);
            } else {
              // Insert new translation
              await sequelize.query(`
                INSERT INTO translations (id, key, language_code, value, category, type, created_at, updated_at)
                VALUES (gen_random_uuid(), :key, :languageCode, :value, 'stock', 'system', NOW(), NOW())
              `, {
                replacements: { key: translationKey, languageCode, value }
              });
              console.log(`    ✅ Inserted ${translationKey} (${languageCode})`);
            }

            migratedCount++;
          } catch (error) {
            console.error(`    ❌ Error migrating ${translationKey} (${languageCode}):`, error.message);
          }
        }
      }

      console.log(`✅ Successfully migrated ${migratedCount} stock label translations`);

      // Clean up old translations from stores.settings.stock_settings
      console.log('\n🧹 Cleaning up old translations from stores.settings...');

      for (const store of stores) {
        try {
          const settings = store.settings || {};
          if (settings.stock_settings && settings.stock_settings.translations) {
            // Remove the translations field
            delete settings.stock_settings.translations;

            await sequelize.query(`
              UPDATE stores
              SET settings = :settings
              WHERE id = :id
            `, {
              replacements: { settings: JSON.stringify(settings), id: store.id }
            });

            console.log(`  ✅ Cleaned up store: ${store.id}`);
          }
        } catch (error) {
          console.error(`  ❌ Error cleaning store ${store.id}:`, error.message);
        }
      }

      console.log('✅ Cleanup completed');

    } catch (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const { sequelize } = queryInterface;

    console.log('🔄 Rolling back stock settings translations migration...');

    // Get translations to restore
    const [translations] = await sequelize.query(`
      SELECT key, language_code, value
      FROM translations
      WHERE category = 'stock'
    `);

    // Restore translations to stores.settings if any exist
    if (translations.length > 0) {
      console.log(`📦 Restoring ${translations.length} translations to stores.settings...`);

      const [stores] = await sequelize.query(`SELECT id, settings FROM stores`);

      for (const store of stores) {
        const settings = store.settings || {};
        settings.stock_settings = settings.stock_settings || {};
        settings.stock_settings.translations = {};

        // Rebuild translations object
        translations.forEach(t => {
          const fieldKey = t.key.replace('stock.', '');
          if (!settings.stock_settings.translations[t.language_code]) {
            settings.stock_settings.translations[t.language_code] = {};
          }
          settings.stock_settings.translations[t.language_code][fieldKey] = t.value;
        });

        await sequelize.query(`
          UPDATE stores
          SET settings = :settings
          WHERE id = :id
        `, {
          replacements: { settings: JSON.stringify(settings), id: store.id }
        });
      }

      console.log('✅ Translations restored to stores.settings');
    }

    // Remove stock translations from translations table
    await sequelize.query(`
      DELETE FROM translations
      WHERE key LIKE 'stock.%' AND category = 'stock'
    `);

    console.log('✅ Stock settings translations removed from translations table');
  }
};
