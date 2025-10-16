require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { Attribute, AttributeValue } = require('./src/models');

async function checkAttributeOptions() {
  console.log('🔍 Checking current state of attributes.options field...\n');

  try {
    // Find all select/multiselect attributes
    const attributes = await Attribute.findAll({
      where: {
        type: ['select', 'multiselect']
      },
      include: [{
        model: AttributeValue,
        as: 'values',
        attributes: ['id', 'code', 'translations', 'sort_order']
      }]
    });

    console.log(`📊 Found ${attributes.length} select/multiselect attributes\n`);

    attributes.forEach(attr => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 Attribute: ${attr.code} (${attr.name})`);
      console.log(`   Type: ${attr.type}`);
      console.log(`   ID: ${attr.id}`);

      if (attr.options) {
        console.log(`   ✅ Has options field: ${typeof attr.options}`);
        if (Array.isArray(attr.options)) {
          console.log(`   📦 Options (${attr.options.length} items):`);
          if (attr.options.length > 0) {
            const firstItem = attr.options[0];
            if (typeof firstItem === 'string') {
              console.log(`      Format: Array of strings (NEW FORMAT ✅)`);
              console.log(`      Values: ${JSON.stringify(attr.options.slice(0, 5))}${attr.options.length > 5 ? '...' : ''}`);
            } else if (typeof firstItem === 'object') {
              console.log(`      Format: Array of objects (OLD FORMAT ⚠️)`);
              console.log(`      Sample: ${JSON.stringify(attr.options[0], null, 2)}`);
            }
          } else {
            console.log(`      Empty array`);
          }
        } else {
          console.log(`      Not an array: ${JSON.stringify(attr.options)}`);
        }
      } else {
        console.log(`   ⊘  No options field`);
      }

      if (attr.values && attr.values.length > 0) {
        console.log(`   📊 attribute_values table: ${attr.values.length} records`);
        attr.values.slice(0, 3).forEach(val => {
          const label = val.translations?.en?.label || val.translations?.nl?.label || 'N/A';
          console.log(`      - ${val.code}: "${label}" (sort_order: ${val.sort_order})`);
        });
        if (attr.values.length > 3) {
          console.log(`      ... and ${attr.values.length - 3} more`);
        }
      } else {
        console.log(`   ⚠️  No records in attribute_values table`);
      }
    });

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');

    const withOptions = attributes.filter(a => a.options && a.options.length > 0);
    const withValues = attributes.filter(a => a.values && a.values.length > 0);
    const oldFormat = attributes.filter(a => {
      if (!a.options || !Array.isArray(a.options) || a.options.length === 0) return false;
      const first = a.options[0];
      return typeof first === 'object' && first !== null;
    });
    const newFormat = attributes.filter(a => {
      if (!a.options || !Array.isArray(a.options) || a.options.length === 0) return false;
      return typeof a.options[0] === 'string';
    });

    console.log(`   Total attributes: ${attributes.length}`);
    console.log(`   With options field: ${withOptions.length}`);
    console.log(`   With attribute_values: ${withValues.length}`);
    console.log(`   Old format (objects): ${oldFormat.length}`);
    console.log(`   New format (strings): ${newFormat.length}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkAttributeOptions();
