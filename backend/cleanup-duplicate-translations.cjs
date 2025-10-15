#!/usr/bin/env node
/**
 * Cleanup duplicate translation values
 * Priority: common.* > other categories
 * If a value exists in common.*, delete it from other categories
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function cleanupDuplicates() {
  try {
    console.log('🔧 Cleaning up duplicate translation values...\n');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find all duplicate values where common.* key exists
    const [duplicates] = await sequelize.query(`
      SELECT
        value,
        language_code,
        array_agg(key ORDER BY key) as keys,
        array_agg(category ORDER BY key) as categories
      FROM translations
      GROUP BY value, language_code
      HAVING COUNT(*) > 1
      ORDER BY value, language_code
    `);

    console.log(`Found ${duplicates.length} duplicate value groups\n`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const dup of duplicates) {
      const keys = dup.keys;
      const categories = dup.categories;
      const value = dup.value;
      const lang = dup.language_code;

      // Check if there's a common.* key
      const commonKeyIndex = keys.findIndex(k => k.startsWith('common.'));

      if (commonKeyIndex !== -1) {
        const commonKey = keys[commonKeyIndex];
        const keysToDelete = keys.filter((k, idx) => idx !== commonKeyIndex);

        if (keysToDelete.length > 0) {
          console.log(`\n📦 Value: "${value}" (${lang})`);
          console.log(`   ✅ Keeping: ${commonKey}`);
          console.log(`   ❌ Deleting: ${keysToDelete.join(', ')}`);

          // Delete the duplicate keys
          for (const keyToDelete of keysToDelete) {
            await sequelize.query(`
              DELETE FROM translations
              WHERE key = :key AND language_code = :lang
            `, { replacements: { key: keyToDelete, lang } });
            deletedCount++;
          }
          keptCount++;
        }
      } else {
        // No common.* key exists, keep the first one alphabetically
        const keyToKeep = keys[0];
        const keysToDelete = keys.slice(1);

        console.log(`\n📦 Value: "${value}" (${lang}) - No common key`);
        console.log(`   ✅ Keeping: ${keyToKeep}`);
        console.log(`   ❌ Deleting: ${keysToDelete.join(', ')}`);

        for (const keyToDelete of keysToDelete) {
          await sequelize.query(`
            DELETE FROM translations
            WHERE key = :key AND language_code = :lang
          `, { replacements: { key: keyToDelete, lang } });
          deletedCount++;
        }
        keptCount++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`  ✅ Kept: ${keptCount} unique values`);
    console.log(`  ❌ Deleted: ${deletedCount} duplicate translations`);

    // Verify no duplicates remain
    const [remaining] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT value, language_code
        FROM translations
        GROUP BY value, language_code
        HAVING COUNT(*) > 1
      ) as dups
    `);

    console.log(`  📊 Remaining duplicates: ${remaining[0].count}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

cleanupDuplicates();
