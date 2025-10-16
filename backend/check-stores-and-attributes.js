require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, Store } = require('./src/models');

async function checkStoresAndAttributes() {
  console.log('🏪 Checking all stores and their filterable attributes...\n');

  try {
    // Get all stores
    const stores = await Store.findAll();
    console.log(`Found ${stores.length} stores:\n`);

    for (const store of stores) {
      console.log(`📍 Store: ${store.name}`);
      console.log(`   ID: ${store.id}`);
      console.log(`   Slug: ${store.slug}\n`);

      // Count filterable attributes for this store
      const filterableCount = await Attribute.count({
        where: {
          store_id: store.id,
          is_filterable: true
        }
      });

      console.log(`   Filterable attributes: ${filterableCount}`);

      if (filterableCount > 0) {
        const attrs = await Attribute.findAll({
          where: {
            store_id: store.id,
            is_filterable: true
          },
          attributes: ['code', 'name'],
          limit: 10
        });

        console.log(`   Samples: ${attrs.map(a => a.code).join(', ')}`);
      }

      console.log('\n---\n');
    }

    // Check if there are filterable attributes without proper store_id
    const allFilterable = await Attribute.findAll({
      where: { is_filterable: true },
      include: [{ model: Store, attributes: ['id', 'name', 'slug'] }]
    });

    console.log(`\n📊 Total filterable attributes across all stores: ${allFilterable.length}`);

    if (allFilterable.length > 0) {
      console.log('\nGrouped by store:');
      const grouped = {};
      allFilterable.forEach(attr => {
        const storeName = attr.Store?.name || 'Unknown';
        if (!grouped[storeName]) grouped[storeName] = 0;
        grouped[storeName]++;
      });

      Object.entries(grouped).forEach(([store, count]) => {
        console.log(`  ${store}: ${count} attributes`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkStoresAndAttributes();
