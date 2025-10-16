require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { AttributeValue } = require('./src/models');

async function fixAttributeValueTranslations() {
  console.log('🔧 Fixing AttributeValue translations (removing -nl/-en suffixes)...\n');

  try {
    // Find all attribute values
    const values = await AttributeValue.findAll();
    console.log(`📊 Found ${values.length} attribute values\n`);

    let fixedCount = 0;

    for (const val of values) {
      if (!val.translations) continue;

      let needsUpdate = false;
      const newTranslations = { ...val.translations };

      // Check each language
      ['nl', 'en', 'de', 'fr', 'es'].forEach(lang => {
        if (newTranslations[lang] && newTranslations[lang].label) {
          const label = newTranslations[lang].label;

          // Check if label ends with -nl, -en, etc.
          const suffixRegex = /-(nl|en|de|fr|es)$/i;
          if (suffixRegex.test(label)) {
            const cleanLabel = label.replace(suffixRegex, '');
            newTranslations[lang].label = cleanLabel;
            needsUpdate = true;

            console.log(`  Fixing ${val.code} (${lang}): "${label}" → "${cleanLabel}"`);
          }
        }
      });

      if (needsUpdate) {
        await val.update({ translations: newTranslations });
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} attribute values`);

    // Show some examples after fix
    console.log('\n📋 Sample attribute values after fix:');
    const samples = await AttributeValue.findAll({
      limit: 5,
      order: [['code', 'ASC']]
    });

    samples.forEach(val => {
      console.log(`  ${val.code}:`);
      console.log(`    nl: ${val.translations?.nl?.label || 'N/A'}`);
      console.log(`    en: ${val.translations?.en?.label || 'N/A'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixAttributeValueTranslations();
