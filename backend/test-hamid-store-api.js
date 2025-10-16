require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, Store, Product, ProductAttributeValue, AttributeValue } = require('./src/models');

async function testHamidStoreAPI() {
  console.log('🧪 Testing Hamid store API responses...\n');

  try {
    // Find Hamid store
    const store = await Store.findOne({ where: { slug: 'hamid2' } });
    if (!store) {
      console.log('❌ Hamid store not found');
      process.exit(1);
    }

    console.log(`📍 Store: ${store.name} (${store.id})\n`);

    // 1. Test filterable attributes API
    console.log('1️⃣ Testing /api/public/attributes?store_id=X&is_filterable=true\n');

    const filterableAttrs = await Attribute.findAll({
      where: {
        store_id: store.id,
        is_filterable: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'code', 'name', 'type', 'is_filterable', 'translations']
    });

    console.log(`   ✅ Found ${filterableAttrs.length} filterable attributes`);
    console.log(`   Codes: ${filterableAttrs.map(a => a.code).join(', ')}\n`);

    // 2. Test products API with attributes
    console.log('2️⃣ Testing /api/public/products?store_id=X\n');

    const products = await Product.findAll({
      where: { store_id: store.id },
      limit: 2,
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

    console.log(`   ✅ Found ${products.length} products\n`);

    if (products.length > 0) {
      const product = products[0];
      console.log(`   Sample Product: ${product.sku}`);
      console.log(`   Total attributes: ${product.attributeValues?.length || 0}`);

      // Transform like the API does
      const lang = 'nl';
      const formattedAttrs = product.attributeValues
        .filter(pav => pav.Attribute?.is_filterable)
        .slice(0, 5)
        .map(pav => {
          const attr = pav.Attribute;
          const attrLabel = attr.translations?.[lang]?.label || attr.translations?.en?.label || attr.code;

          let valueLabel;
          if (pav.value_id && pav.value) {
            valueLabel = pav.value.translations?.[lang]?.label ||
                        pav.value.translations?.en?.label ||
                        pav.value.code;
          } else {
            valueLabel = String(pav.text_value || pav.number_value || pav.date_value || pav.boolean_value || '');
          }

          return {
            code: attr.code,
            label: attrLabel,
            value: valueLabel
          };
        });

      console.log('\n   Filterable attributes on product:');
      formattedAttrs.forEach(attr => {
        console.log(`     • ${attr.code}: "${attr.value}"`);
      });
    }

    // 3. Check color attribute specifically
    console.log('\n\n3️⃣ Checking COLOR attribute values:\n');

    const colorAttr = await Attribute.findOne({
      where: { code: 'color', store_id: store.id }
    });

    if (colorAttr) {
      console.log(`   Color attribute: ${colorAttr.name} (is_filterable: ${colorAttr.is_filterable})`);
      console.log(`   Translations:`, JSON.stringify(colorAttr.translations));

      const colorValues = await AttributeValue.findAll({
        where: { attribute_id: colorAttr.id },
        limit: 10
      });

      console.log(`\n   AttributeValue records: ${colorValues.length}`);
      colorValues.forEach(val => {
        console.log(`     • code: "${val.code}"`);
        console.log(`       translations:`, JSON.stringify(val.translations));
      });
    } else {
      console.log('   ❌ Color attribute not found for this store');
    }

    // 4. Check manufacturer attribute
    console.log('\n\n4️⃣ Checking MANUFACTURER attribute values:\n');

    const mfgAttr = await Attribute.findOne({
      where: { code: 'manufacturer', store_id: store.id }
    });

    if (mfgAttr) {
      console.log(`   Manufacturer attribute: ${mfgAttr.name} (is_filterable: ${mfgAttr.is_filterable})`);
      console.log(`   Translations:`, JSON.stringify(mfgAttr.translations));

      const mfgValues = await AttributeValue.findAll({
        where: { attribute_id: mfgAttr.id },
        limit: 10
      });

      console.log(`\n   AttributeValue records: ${mfgValues.length}`);
      mfgValues.forEach(val => {
        console.log(`     • code: "${val.code}"`);
        console.log(`       translations:`, JSON.stringify(val.translations));
      });
    } else {
      console.log('   ❌ Manufacturer attribute not found for this store');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testHamidStoreAPI();
