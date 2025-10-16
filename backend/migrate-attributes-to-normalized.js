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

        console.log(`  ✓ Processing ${attrKey} = ${JSON.stringify(attrValue)} (type: ${attribute.type})`);

        try {
          if (attribute.type === 'select' || attribute.type === 'multiselect') {
            // Handle both old format { label, value } and simple strings
            let labelValue, actualValue;

            if (typeof attrValue === 'object' && attrValue !== null) {
              // Old format: { "label": "Overig", "value": "Overig" }
              labelValue = attrValue.label || attrValue.value || JSON.stringify(attrValue);
              actualValue = attrValue.value || attrValue.label || JSON.stringify(attrValue);
            } else {
              // Simple string value
              labelValue = String(attrValue);
              actualValue = String(attrValue);
            }

            // Create a clean code from the actual value
            const code = String(actualValue)
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
              .substring(0, 100); // Limit length

            if (!code) {
              console.warn(`    ⚠️  Could not generate valid code from value, skipping`);
              errorCount++;
              continue;
            }

            let [attributeValue, created] = await AttributeValue.findOrCreate({
              where: {
                attribute_id: attribute.id,
                code
              },
              defaults: {
                translations: {
                  en: { label: labelValue }
                },
                sort_order: 0,
                metadata: {}
              }
            });

            if (created) {
              console.log(`    ➕ Created new attribute value: ${code} (label: ${labelValue})`);
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

            // Extract actual value from objects if needed
            let rawValue = attrValue;
            if (typeof attrValue === 'object' && attrValue !== null) {
              rawValue = attrValue.value || attrValue.label || JSON.stringify(attrValue);
            }

            switch (attribute.type) {
              case 'number':
                valueData.number_value = parseFloat(rawValue);
                break;
              case 'boolean':
                valueData.boolean_value = Boolean(rawValue);
                break;
              case 'date':
                valueData.date_value = new Date(rawValue);
                break;
              default:
                valueData.text_value = String(rawValue);
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
