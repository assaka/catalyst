#!/usr/bin/env node
/**
 * Migration Script: Fix Translation Keys to Use Dot Notation
 *
 * This script renames all single-level translation keys to follow
 * the dot notation convention (category.key_name).
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function fixTranslationKeys() {
  try {
    console.log('🔧 Starting translation key migration...\n');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find all single-level keys
    const [results] = await sequelize.query(`
      SELECT DISTINCT key, category
      FROM translations
      WHERE key NOT LIKE '%.%'
      ORDER BY category, key
    `);

    console.log(`Found ${results.length} keys to migrate\n`);

    let migrated = 0;
    let skipped = 0;

    for (const row of results) {
      const oldKey = row.key;
      const category = row.category;

      // Generate new key with dot notation
      const newKey = `${category}.${oldKey}`;

      // Check if new key already exists
      const [existing] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM translations
        WHERE key = :newKey
      `, {
        replacements: { newKey }
      });

      if (existing[0].count > 0) {
        console.log(`⚠️  Skipping "${oldKey}" -> "${newKey}" (already exists)`);
        skipped++;
        continue;
      }

      // Rename the key for all languages
      await sequelize.query(`
        UPDATE translations
        SET key = :newKey
        WHERE key = :oldKey
      `, {
        replacements: { oldKey, newKey }
      });

      migrated++;
      console.log(`✓ Renamed: "${oldKey}" -> "${newKey}"`);
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated} keys`);
    console.log(`   Skipped:  ${skipped} keys (already exist)`);

    // Verify no single-level keys remain
    const [remaining] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM translations
      WHERE key NOT LIKE '%.%'
    `);

    console.log(`\n📊 Remaining single-level keys: ${remaining[0].count}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

fixTranslationKeys();
