require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, AttributeValue } = require('./src/models');

/**
 * Migration script to update attributes.options from old format to new simplified format
 *
 * OLD FORMAT:
 * options: [
 *   { code: "1", label: "1", value: "1", sort_order: 0 },
 *   { code: "2", label: "2", value: "2", sort_order: 1 }
 * ]
 *
 * NEW FORMAT:
 * options: ["1", "2", "3", "4", "5", "6"]
 *
 * The full value data is now stored in the attribute_values table
 */
async function migrateAttributeOptions() {
  console.log('🔄 Starting migration: Simplifying attributes.options field...\n');

  const transaction = await sequelize.transaction();

  try {
    // Find all attributes with select/multiselect type that have options
    const attributes = await Attribute.findAll({
      where: {
        type: ['select', 'multiselect']
      },
      transaction
    });

    console.log(`📊 Found ${attributes.length} select/multiselect attributes\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let ensuredInDbCount = 0;

    for (const attr of attributes) {
      // Check if options field exists and is in old format (array of objects)
      if (attr.options && Array.isArray(attr.options) && attr.options.length > 0) {
        const firstOption = attr.options[0];

        // Check if it's old format (has label, value, sort_order properties)
        if (typeof firstOption === 'object' && firstOption !== null &&
            ('label' in firstOption || 'value' in firstOption || 'sort_order' in firstOption)) {

          console.log(`\n🔧 Migrating attribute: ${attr.code} (${attr.name})`);
          console.log(`   Old format: ${attr.options.length} option objects`);

          // Ensure all values exist in attribute_values table
          for (const option of attr.options) {
            const valueCode = option.code || option.value || option.label;

            if (!valueCode) {
              console.log(`   ⚠️  Skipping option without code/value/label`);
              continue;
            }

            // Check if value already exists in attribute_values
            let existingValue = await AttributeValue.findOne({
              where: {
                attribute_id: attr.id,
                code: valueCode
              },
              transaction
            });

            if (!existingValue) {
              // Create the value in attribute_values table
              const label = option.label || option.value || valueCode;
              await AttributeValue.create({
                attribute_id: attr.id,
                code: valueCode,
                translations: {
                  en: { label: label }
                },
                sort_order: option.sort_order || 0,
                metadata: option.metadata || {}
              }, { transaction });

              console.log(`   ✅ Created AttributeValue: ${valueCode} (${label})`);
              ensuredInDbCount++;
            }
          }

          // Update options to just store value codes
          const valueCodes = attr.options
            .map(opt => opt.code || opt.value || opt.label)
            .filter(Boolean);

          await attr.update({
            options: valueCodes
          }, { transaction });

          console.log(`   ✅ Updated to: ${JSON.stringify(valueCodes)}`);
          migratedCount++;
        } else if (typeof firstOption === 'string') {
          // Already in new format
          console.log(`✓ ${attr.code}: Already in new format (array of strings)`);
          skippedCount++;
        }
      } else if (!attr.options || attr.options.length === 0) {
        console.log(`ℹ️  ${attr.code}: No options to migrate`);
        skippedCount++;
      }
    }

    await transaction.commit();
    console.log('\n✅ Transaction committed\n');

    console.log('📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount} attributes`);
    console.log(`   ✅ Created/Ensured in DB: ${ensuredInDbCount} attribute values`);
    console.log(`   ⊘  Skipped: ${skippedCount} attributes (already migrated or no options)`);
    console.log(`   📝 Total processed: ${attributes.length} attributes\n`);

    // Show sample of migrated attributes
    if (migratedCount > 0) {
      console.log('📋 Sample migrated attributes:');
      const samples = await Attribute.findAll({
        where: {
          type: ['select', 'multiselect']
        },
        limit: 5,
        order: [['code', 'ASC']],
        include: [{
          model: AttributeValue,
          as: 'values',
          attributes: ['code', 'translations', 'sort_order']
        }]
      });

      samples.forEach(attr => {
        console.log(`\n  ${attr.code}:`);
        console.log(`    options field: ${JSON.stringify(attr.options)}`);
        if (attr.values && attr.values.length > 0) {
          console.log(`    attribute_values table: ${attr.values.length} records`);
          attr.values.slice(0, 3).forEach(val => {
            console.log(`      - ${val.code}: ${val.translations?.en?.label || 'N/A'}`);
          });
        }
      });
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error during migration:', error);
    console.error('\n❌ Transaction rolled back');
    process.exit(1);
  }
}

migrateAttributeOptions();
