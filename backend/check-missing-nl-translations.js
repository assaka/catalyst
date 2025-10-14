/**
 * Check for missing Dutch (nl) translations
 * This script finds all English translation keys that don't have Dutch equivalents
 *
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/check-missing-nl-translations.js
 */

const { Translation } = require('./src/models');

async function checkMissingTranslations() {
  console.log('🔍 Checking for missing Dutch translations...\n');

  try {
    // Get all English translations
    const englishTranslations = await Translation.findAll({
      where: { language_code: 'en' },
      attributes: ['key', 'value', 'category']
    });

    console.log(`📦 Found ${englishTranslations.length} English translation keys\n`);

    // Get all Dutch translations
    const dutchTranslations = await Translation.findAll({
      where: { language_code: 'nl' },
      attributes: ['key', 'value']
    });

    // Create a set of Dutch keys for quick lookup
    const dutchKeys = new Set(dutchTranslations.map(t => t.key));

    console.log(`📦 Found ${dutchTranslations.length} Dutch translation keys\n`);

    // Find missing Dutch translations
    const missingTranslations = [];

    for (const enTranslation of englishTranslations) {
      if (!dutchKeys.has(enTranslation.key)) {
        missingTranslations.push(enTranslation);
      }
    }

    if (missingTranslations.length === 0) {
      console.log('✅ All English translations have Dutch equivalents!');
      return { missing: [], total: englishTranslations.length };
    }

    console.log(`⚠️  Found ${missingTranslations.length} missing Dutch translations:\n`);
    console.log('=' .repeat(80));

    // Group by category
    const byCategory = {};
    for (const translation of missingTranslations) {
      const cat = translation.category || 'uncategorized';
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      byCategory[cat].push(translation);
    }

    // Display missing translations grouped by category
    for (const [category, translations] of Object.entries(byCategory)) {
      console.log(`\n📁 Category: ${category.toUpperCase()}`);
      console.log('-'.repeat(80));

      for (const translation of translations) {
        console.log(`  ❌ ${translation.key}`);
        console.log(`     EN: "${translation.value}"`);
        console.log(`     NL: [MISSING]`);
        console.log('');
      }
    }

    console.log('=' .repeat(80));
    console.log(`\n📊 Summary: ${missingTranslations.length} missing out of ${englishTranslations.length} total keys`);
    console.log(`   Coverage: ${((dutchTranslations.length / englishTranslations.length) * 100).toFixed(1)}%`);

    return { missing: missingTranslations, total: englishTranslations.length };
  } catch (error) {
    console.error('❌ Error checking translations:', error);
    throw error;
  }
}

async function addMissingDutchTranslations() {
  console.log('\n🔄 Would you like to add placeholder Dutch translations?');
  console.log('   (They will use English values as placeholders for manual translation)\n');

  const { missing } = await checkMissingTranslations();

  if (missing.length === 0) {
    return;
  }

  console.log('\n🔄 Adding placeholder Dutch translations...\n');

  let addedCount = 0;

  for (const enTranslation of missing) {
    try {
      await Translation.create({
        key: enTranslation.key,
        language_code: 'nl',
        value: enTranslation.value, // Use English as placeholder
        category: enTranslation.category || 'common'
      });

      console.log(`  ✅ Added placeholder for: ${enTranslation.key}`);
      addedCount++;
    } catch (error) {
      console.error(`  ❌ Error adding ${enTranslation.key}:`, error.message);
    }
  }

  console.log(`\n📊 Added ${addedCount} placeholder translations`);
  console.log('   ⚠️  Remember to update these with proper Dutch translations!');
}

// Run the script
checkMissingTranslations()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
