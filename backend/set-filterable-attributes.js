require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute } = require('./src/models');

async function setFilterableAttributes() {
  console.log('🔧 Setting is_filterable=true for common product attributes...\n');

  try {
    // Common filterable attribute codes
    const filterableAttributeCodes = [
      'color',
      'brand',
      'size',
      'material',
      'type',
      'style',
      'category',
      'collection',
      'finish',
      'pattern',
      'capacity',
      'weight',
      'length',
      'width',
      'height',
      'condition',
      'manufacturer',
      'model'
    ];

    // Find all attributes
    const allAttributes = await Attribute.findAll();
    console.log(`📊 Total attributes found: ${allAttributes.length}\n`);

    let updatedCount = 0;
    let alreadyFilterableCount = 0;

    for (const attr of allAttributes) {
      const codeMatches = filterableAttributeCodes.some(filterableCode =>
        attr.code.toLowerCase().includes(filterableCode.toLowerCase())
      );

      if (codeMatches && !attr.is_filterable) {
        await attr.update({ is_filterable: true });
        updatedCount++;
        console.log(`  ✓ Set is_filterable=true for: ${attr.code} (${attr.name})`);
      } else if (codeMatches && attr.is_filterable) {
        alreadyFilterableCount++;
        console.log(`  ⏭️  Already filterable: ${attr.code} (${attr.name})`);
      }
    }

    // Show summary
    console.log(`\n✅ Update complete!`);
    console.log(`   - Attributes updated: ${updatedCount}`);
    console.log(`   - Already filterable: ${alreadyFilterableCount}`);
    console.log(`   - Total filterable: ${updatedCount + alreadyFilterableCount}\n`);

    // Show all filterable attributes
    const filterableAttributes = await Attribute.findAll({
      where: { is_filterable: true },
      order: [['code', 'ASC']]
    });

    console.log(`📋 All filterable attributes (${filterableAttributes.length}):`);
    filterableAttributes.forEach(attr => {
      console.log(`   - ${attr.code}: ${attr.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

setFilterableAttributes();
