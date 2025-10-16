require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Product, ProductAttributeValue, Attribute, AttributeValue } = require('./src/models');

async function checkAttributeValuesDetail() {
  console.log('🔍 Checking unique attribute values for color and manufacturer...\n');

  try {
    // Check color values
    const colorAttr = await Attribute.findOne({ where: { code: 'color' } });
    if (colorAttr) {
      console.log('🎨 COLOR attribute:');
      console.log(`  - Attribute ID: ${colorAttr.id}`);
      console.log(`  - Attribute Code: ${colorAttr.code}`);
      console.log(`  - Attribute Name: ${colorAttr.name}`);

      // Get all color values
      const colorPAVs = await ProductAttributeValue.findAll({
        where: { attribute_id: colorAttr.id },
        include: [
          {
            model: AttributeValue,
            as: 'value',
            attributes: ['id', 'code', 'translations']
          },
          {
            model: Product,
            attributes: ['id', 'sku', 'name']
          }
        ],
        limit: 10
      });

      console.log(`  - Total products with color: ${colorPAVs.length}`);
      console.log(`  - Sample values:`);

      const uniqueValues = new Set();
      colorPAVs.forEach(pav => {
        const value = pav.value?.code || pav.text_value || 'N/A';
        uniqueValues.add(value);
        if (uniqueValues.size <= 5) {
          console.log(`    • ${pav.Product?.sku}: ${value}`);
        }
      });

      console.log(`  - Unique color values: ${Array.from(uniqueValues).join(', ')}\n`);
    }

    // Check manufacturer values
    const mfgAttr = await Attribute.findOne({ where: { code: 'manufacturer' } });
    if (mfgAttr) {
      console.log('🏭 MANUFACTURER attribute:');
      console.log(`  - Attribute ID: ${mfgAttr.id}`);
      console.log(`  - Attribute Code: ${mfgAttr.code}`);
      console.log(`  - Attribute Name: ${mfgAttr.name}`);

      // Get all manufacturer values
      const mfgPAVs = await ProductAttributeValue.findAll({
        where: { attribute_id: mfgAttr.id },
        include: [
          {
            model: AttributeValue,
            as: 'value',
            attributes: ['id', 'code', 'translations']
          },
          {
            model: Product,
            attributes: ['id', 'sku', 'name']
          }
        ],
        limit: 10
      });

      console.log(`  - Total products with manufacturer: ${mfgPAVs.length}`);
      console.log(`  - Sample values:`);

      const uniqueValues = new Set();
      mfgPAVs.forEach(pav => {
        const value = pav.value?.code || pav.text_value || 'N/A';
        uniqueValues.add(value);
        if (uniqueValues.size <= 10) {
          console.log(`    • ${pav.Product?.sku}: ${value}`);
        }
      });

      console.log(`  - Unique manufacturer values: ${Array.from(uniqueValues).join(', ')}\n`);
    }

    // Test: fetch one product like the API does
    console.log('📦 Testing product API format:');
    const testProduct = await Product.findOne({
      include: [{
        model: ProductAttributeValue,
        as: 'attributeValues',
        include: [
          {
            model: Attribute,
            attributes: ['id', 'code', 'type', 'translations', 'is_filterable']
          },
          {
            model: AttributeValue,
            as: 'value',
            attributes: ['id', 'code', 'translations', 'metadata']
          }
        ]
      }]
    });

    if (testProduct && testProduct.attributeValues) {
      console.log(`\nProduct: ${testProduct.sku}`);
      console.log(`Attributes in attributeValues (${testProduct.attributeValues.length}):`);

      // Transform like the API does
      const lang = 'nl';
      const formattedAttributes = testProduct.attributeValues.map(pav => {
        const attr = pav.Attribute;
        if (!attr) return null;

        const attrLabel = attr.translations?.[lang]?.label ||
                         attr.translations?.en?.label ||
                         attr.code;

        let value, valueLabel;

        if (pav.value_id && pav.value) {
          // Select/multiselect attribute
          value = pav.value.code;
          valueLabel = pav.value.translations?.[lang]?.label ||
                      pav.value.translations?.en?.label ||
                      pav.value.code;
        } else {
          // Text/number/date/boolean attribute
          value = pav.text_value || pav.number_value || pav.date_value || pav.boolean_value;
          valueLabel = String(value);
        }

        return {
          code: attr.code,
          label: attrLabel,
          value: valueLabel,
          type: attr.type,
          is_filterable: attr.is_filterable
        };
      }).filter(Boolean);

      // Show only filterable attributes
      const filterableOnly = formattedAttributes.filter(a => a.is_filterable);
      console.log(`\nFilterable attributes (${filterableOnly.length}):`);
      filterableOnly.slice(0, 10).forEach(attr => {
        console.log(`  • ${attr.code}: "${attr.value}"`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkAttributeValuesDetail();
