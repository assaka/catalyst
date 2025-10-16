require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute } = require('./src/models');

async function restorePriceFilterable() {
  console.log('🔧 Restoring is_filterable=true for price attribute...\n');

  try {
    // Find all price attributes
    const priceAttributes = await Attribute.findAll({
      where: {
        code: 'price'
      }
    });

    console.log(`📊 Found ${priceAttributes.length} price attributes\n`);

    let updatedCount = 0;

    for (const attr of priceAttributes) {
      if (!attr.is_filterable) {
        await attr.update({ is_filterable: true });
        updatedCount++;
        console.log(`  ✓ Set is_filterable=true for: ${attr.code} (store: ${attr.store_id})`);
      } else {
        console.log(`  ℹ Already filterable: ${attr.code} (store: ${attr.store_id})`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} price attributes`);

    // Show final state
    const allPriceAttrs = await Attribute.findAll({
      where: { code: 'price' },
      order: [['store_id', 'ASC']]
    });

    console.log(`\n📋 All price attributes (${allPriceAttrs.length}):`);
    allPriceAttrs.forEach(attr => {
      console.log(`   - Store ${attr.store_id}: is_filterable=${attr.is_filterable}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

restorePriceFilterable();
