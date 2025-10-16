require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, AttributeValue } = require('./src/models');

async function checkTranslations() {
  console.log('🔍 Checking attribute translations...\n');

  try {
    // Check attributes
    const attributes = await Attribute.findAll({
      limit: 5
    });

    console.log('📋 Sample Attributes:');
    attributes.forEach(attr => {
      console.log(`\n  ${attr.code}:`);
      console.log(`    name: ${attr.name}`);
      console.log(`    translations: ${JSON.stringify(attr.translations)}`);
    });

    // Check attribute values
    const attributeValues = await AttributeValue.findAll({
      limit: 10,
      include: [{ model: Attribute, attributes: ['code', 'name'] }]
    });

    console.log('\n\n📊 Sample Attribute Values:');
    attributeValues.forEach(val => {
      console.log(`\n  ${val.Attribute?.code} - ${val.code}:`);
      console.log(`    translations: ${JSON.stringify(val.translations)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkTranslations();
