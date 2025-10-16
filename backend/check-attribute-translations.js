require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, AttributeValue } = require('./src/models');

async function checkAttributeTranslations() {
  console.log('🌍 Checking attribute and attribute value translations...\n');

  try {
    // Get filterable attributes
    const attributes = await Attribute.findAll({
      where: { is_filterable: true },
      limit: 5
    });

    console.log('📋 Sample Filterable Attributes:\n');
    attributes.forEach(attr => {
      console.log(`Attribute: ${attr.code}`);
      console.log(`  name: ${attr.name}`);
      console.log(`  translations:`, JSON.stringify(attr.translations, null, 2));
      console.log('');
    });

    // Get some attribute values with translations
    const values = await AttributeValue.findAll({
      limit: 10,
      include: [{ model: Attribute, attributes: ['code', 'name'] }]
    });

    console.log('\n📊 Sample Attribute Values:\n');
    values.forEach(val => {
      console.log(`${val.Attribute?.code} - ${val.code}:`);
      console.log(`  translations:`, JSON.stringify(val.translations, null, 2));
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkAttributeTranslations();
