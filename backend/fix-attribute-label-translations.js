require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute } = require('./src/models');

async function fixAttributeLabelTranslations() {
  console.log('🔧 Fixing Attribute label translations (removing -nl/-en suffixes)...\n');

  const transaction = await sequelize.transaction();

  try {
    // Find all attributes
    const attributes = await Attribute.findAll({ transaction });
    console.log(`📊 Found ${attributes.length} attributes\n`);

    let fixedCount = 0;

    for (const attr of attributes) {
      if (!attr.translations) continue;

      let needsUpdate = false;
      const newTranslations = JSON.parse(JSON.stringify(attr.translations)); // Deep copy

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

            console.log(`  Fixing ${attr.code} (${lang}): "${label}" → "${cleanLabel}"`);
          }
        }
      });

      if (needsUpdate) {
        await attr.update({ translations: newTranslations }, { transaction });
        fixedCount++;
      }
    }

    await transaction.commit();
    console.log(`\n✅ Transaction committed`);

    console.log(`\n✅ Fixed ${fixedCount} attributes`);

    // Show some examples after fix
    console.log('\n📋 Sample attributes after fix:');
    const samples = await Attribute.findAll({
      limit: 10,
      order: [['code', 'ASC']]
    });

    samples.forEach(attr => {
      console.log(`  ${attr.code}:`);
      console.log(`    nl: ${attr.translations?.nl?.label || 'N/A'}`);
      console.log(`    en: ${attr.translations?.en?.label || 'N/A'}`);
    });

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error:', error);
    console.error('\n❌ Transaction rolled back');
    process.exit(1);
  }
}

fixAttributeLabelTranslations();
