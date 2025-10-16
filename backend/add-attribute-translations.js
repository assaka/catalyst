require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, AttributeValue } = require('./src/models');

async function addTranslations() {
  console.log('🌍 Adding translations for attributes and values...\n');

  try {
    let attributeCount = 0;
    let valueCount = 0;

    // 1. Fix Attributes - copy name to translations
    console.log('📋 Processing Attributes...');
    const attributes = await Attribute.findAll();

    for (const attr of attributes) {
      if (attr.name && (!attr.translations || Object.keys(attr.translations).length === 0)) {
        // The name field contains Dutch text, so add it to nl
        await attr.update({
          translations: {
            nl: {
              label: attr.name,
              description: attr.description || ''
            },
            en: {
              label: attr.name, // Keep same for now, can be translated later
              description: attr.description || ''
            }
          }
        });
        attributeCount++;
        console.log(`  ✓ ${attr.code}: "${attr.name}"`);
      }
    }

    // 2. Fix AttributeValues - move from "en" to "nl" since they're Dutch
    console.log('\n📊 Processing Attribute Values...');
    const values = await AttributeValue.findAll({
      include: [{ model: Attribute, attributes: ['code'] }]
    });

    for (const val of values) {
      if (val.translations && val.translations.en && val.translations.en.label) {
        const dutchLabel = val.translations.en.label;

        // Move to nl and keep same text in en for now
        await val.update({
          translations: {
            nl: {
              label: dutchLabel
            },
            en: {
              label: dutchLabel // Keep same for now
            }
          }
        });
        valueCount++;

        if (valueCount <= 10) {
          console.log(`  ✓ ${val.Attribute?.code} - ${val.code}: "${dutchLabel}"`);
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   - Attributes updated: ${attributeCount}`);
    console.log(`   - Attribute values updated: ${valueCount}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

addTranslations();
