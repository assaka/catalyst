require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function clearNormalizedAttributes() {
  console.log('🗑️  Clearing normalized attribute data...\n');

  try {
    // Clear product_attribute_values
    console.log('📝 Deleting all product_attribute_values...');
    await sequelize.query('DELETE FROM product_attribute_values', {
      type: sequelize.QueryTypes.DELETE
    });
    console.log('✅ Cleared product_attribute_values\n');

    // Clear attribute_values
    console.log('📝 Deleting all attribute_values...');
    await sequelize.query('DELETE FROM attribute_values', {
      type: sequelize.QueryTypes.DELETE
    });
    console.log('✅ Cleared attribute_values\n');

    console.log('✅ All normalized attribute data cleared successfully!');
  } catch (error) {
    console.error('\n❌ Clear failed:', error);
    throw error;
  }
}

// Run
clearNormalizedAttributes()
  .then(() => {
    console.log('\n✅ Clear completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Clear failed:', err);
    process.exit(1);
  });
