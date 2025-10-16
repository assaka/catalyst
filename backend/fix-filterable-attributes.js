require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute } = require('./src/models');

async function fixFilterableAttributes() {
  console.log('🔧 Fixing is_filterable for attributes that should not be filters...\n');

  try {
    // Attributes that should NOT be filterable
    const nonFilterableAttributes = [
      'name',
      'sku',
      'description',
      'image',
      'image_0',
      'image_1',
      'image_2',
      'image_3',
      'image_4',
      'url_key',
      'meta_title',
      'meta_description',
      'sku_new',
      'dealer_price',
      'compare_price'
    ];

    let updatedCount = 0;

    for (const attrCode of nonFilterableAttributes) {
      const attributes = await Attribute.findAll({
        where: {
          code: attrCode,
          is_filterable: true
        }
      });

      for (const attr of attributes) {
        await attr.update({ is_filterable: false });
        updatedCount++;
        console.log(`  ✓ Set is_filterable=false for: ${attr.code}`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} attributes`);

    // Show remaining filterable attributes
    const stillFilterable = await Attribute.findAll({
      where: { is_filterable: true },
      order: [['code', 'ASC']]
    });

    console.log(`\n📋 Remaining filterable attributes (${stillFilterable.length}):`);
    stillFilterable.forEach(attr => {
      console.log(`   - ${attr.code}: ${attr.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixFilterableAttributes();
