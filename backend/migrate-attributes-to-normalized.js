require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, AttributeValue, Product, ProductAttributeValue } = require('./src/models');

async function migrateAttributes() {
  console.log('🚀 Starting attribute migration to normalized structure...\n');

  try {
    // First, get all products that have the old 'attributes' JSON field
    console.log('📦 Fetching products from database...');
    const products = await sequelize.query(
      'SELECT id, attributes, store_id FROM products WHERE attributes IS NOT NULL AND attributes::text != \'{}\'',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`📦 Found ${products.length} products with attributes\n`);

    if (products.length === 0) {
      console.log('✅ No products with old attributes found. Migration not needed.');
      return;
    }

    // Get all attributes to build a map
    const attributes = await Attribute.findAll();
    const attributeMap = {};
    attributes.forEach(attr => {
      attributeMap[attr.code] = attr;
    });

    console.log(`📋 Loaded ${attributes.length} attributes from database\n`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      console.log(`\n📝 Processing product ID: ${product.id}`);

      if (!product.attributes || typeof product.attributes !== 'object') {
        console.log('  ⚠️  Skipping - invalid attributes format');
        continue;
      }

      const attributeEntries = Object.entries(product.attributes);
      console.log(`  📊 Found ${attributeEntries.length} attributes`);

      for (const [attrKey, attrValue] of attributeEntries) {
        const attribute = attributeMap[attrKey];

        if (!attribute) {
          console.warn(`  ⚠️  Attribute "${attrKey}" not found in attributes table, skipping`);
          errorCount++;
          continue;
        }

        console.log(`  ✓ Processing ${attrKey} = ${attrValue} (type: ${attribute.type})`);

        try {
          if (attribute.type === 'select' || attribute.type === 'multiselect') {
            // Find or create attribute value
            const code = String(attrValue)
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');

            let [attributeValue, created] = await AttributeValue.findOrCreate({
              where: {
                attribute_id: attribute.id,
                code
              },
              defaults: {
                translations: {
                  en: { label: String(attrValue) }
                },
                sort_order: 0,
                metadata: {}
              }
            });

            if (created) {
              console.log(`    ➕ Created new attribute value: ${code}`);
            }

            // Create product attribute value
            await ProductAttributeValue.create({
              product_id: product.id,
              attribute_id: attribute.id,
              value_id: attributeValue.id
            });

            console.log(`    → Linked to value_id: ${attributeValue.id}`);
          } else {
            // For text/number/date/boolean attributes
            const valueData = {
              product_id: product.id,
              attribute_id: attribute.id
            };

            switch (attribute.type) {
              case 'number':
                valueData.number_value = parseFloat(attrValue);
                break;
              case 'boolean':
                valueData.boolean_value = Boolean(attrValue);
                break;
              case 'date':
                valueData.date_value = new Date(attrValue);
                break;
              default:
                valueData.text_value = String(attrValue);
            }

            await ProductAttributeValue.create(valueData);
            console.log(`    → Created with ${Object.keys(valueData).find(k => k.endsWith('_value'))}: ${Object.values(valueData).find(v => v !== product.id && v !== attribute.id)}`);
          }

          migratedCount++;
        } catch (error) {
          console.error(`    ❌ Error processing attribute ${attrKey}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Products processed: ${products.length}`);
    console.log(`   - Attributes migrated: ${migratedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateAttributes()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Migration script failed:', err);
    process.exit(1);
  });
