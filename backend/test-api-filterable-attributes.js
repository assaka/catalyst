require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, Store } = require('./src/models');

async function testFilterableAttributesAPI() {
  console.log('🧪 Testing filterable attributes API response...\n');

  try {
    // Find a store
    const store = await Store.findOne();
    if (!store) {
      console.log('❌ No store found');
      process.exit(1);
    }

    console.log(`📍 Using store: ${store.name} (${store.id})\n`);

    // Simulate what the API does
    const where = {
      store_id: store.id,
      is_filterable: true
    };

    const attributes = await Attribute.findAll({
      where,
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    console.log(`✅ Found ${attributes.length} filterable attributes:\n`);

    attributes.forEach((attr, idx) => {
      console.log(`${idx + 1}. ${attr.code}`);
      console.log(`   - Name: ${attr.name}`);
      console.log(`   - is_filterable: ${attr.is_filterable}`);
      console.log(`   - Type: ${attr.type}`);
      console.log(`   - Translations:`, JSON.stringify(attr.translations));
      console.log('');
    });

    // Show what the public API would return
    console.log('\n📦 Public API Response Preview (first 5):');
    const apiResponse = attributes.slice(0, 5).map(attr => ({
      id: attr.id,
      code: attr.code,
      name: attr.name,
      type: attr.type,
      is_filterable: attr.is_filterable,
      translations: attr.translations,
      sort_order: attr.sort_order
    }));

    console.log(JSON.stringify(apiResponse, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testFilterableAttributesAPI();
