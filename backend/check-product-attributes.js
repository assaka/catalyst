require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Product, ProductAttributeValue, Attribute, AttributeValue } = require('./src/models');

async function checkProductAttributes() {
  console.log('🔍 Checking product attributes...\n');

  try {
    // Get all products with their attributes
    const products = await Product.findAll({
      limit: 5,
      include: [{
        model: ProductAttributeValue,
        as: 'attributeValues',
        include: [
          {
            model: Attribute,
            attributes: ['id', 'code', 'name', 'is_filterable']
          },
          {
            model: AttributeValue,
            as: 'value',
            attributes: ['id', 'code', 'translations']
          }
        ]
      }]
    });

    console.log(`📊 Checking ${products.length} products:\n`);

    products.forEach((product, idx) => {
      console.log(`Product ${idx + 1}: ${product.name}`);
      console.log(`  - SKU: ${product.sku}`);
      console.log(`  - Attributes (${product.attributeValues?.length || 0}):`);

      if (product.attributeValues && product.attributeValues.length > 0) {
        product.attributeValues.forEach(pav => {
          const attr = pav.Attribute;
          if (attr) {
            const value = pav.value_id && pav.value
              ? pav.value.code
              : pav.text_value || pav.number_value || pav.date_value || pav.boolean_value;

            console.log(`    • ${attr.code} (filterable: ${attr.is_filterable}): ${value}`);
          }
        });
      } else {
        console.log(`    (no attributes)`);
      }
      console.log('');
    });

    // Check specifically for color and manufacturer
    console.log('\n🎨 Checking for color attribute usage:');
    const colorAttr = await Attribute.findOne({ where: { code: 'color' } });
    if (colorAttr) {
      console.log(`  Color attribute found: ${colorAttr.name} (is_filterable: ${colorAttr.is_filterable})`);

      const colorUsage = await ProductAttributeValue.count({
        where: { attribute_id: colorAttr.id }
      });
      console.log(`  Products using color attribute: ${colorUsage}`);
    } else {
      console.log(`  ❌ Color attribute not found`);
    }

    console.log('\n🏭 Checking for manufacturer attribute usage:');
    const mfgAttr = await Attribute.findOne({ where: { code: 'manufacturer' } });
    if (mfgAttr) {
      console.log(`  Manufacturer attribute found: ${mfgAttr.name} (is_filterable: ${mfgAttr.is_filterable})`);

      const mfgUsage = await ProductAttributeValue.count({
        where: { attribute_id: mfgAttr.id }
      });
      console.log(`  Products using manufacturer attribute: ${mfgUsage}`);
    } else {
      console.log(`  ❌ Manufacturer attribute not found`);
    }

    // Show all filterable attributes and their usage
    console.log('\n📋 All filterable attributes and their usage:\n');
    const filterableAttrs = await Attribute.findAll({
      where: { is_filterable: true },
      order: [['code', 'ASC']]
    });

    for (const attr of filterableAttrs) {
      const usageCount = await ProductAttributeValue.count({
        where: { attribute_id: attr.id }
      });
      console.log(`  ${attr.code}: ${usageCount} products`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkProductAttributes();
