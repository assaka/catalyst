// Make creator_id nullable in plugin_registry table
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function makeCreatorIdNullable() {
  try {
    console.log('Making creator_id nullable in plugin_registry...');

    // Check current constraint
    const [constraints] = await sequelize.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'plugin_registry'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%creator%'
    `);

    console.log('Existing constraints:', constraints);

    // Alter column to allow NULL
    await sequelize.query(`
      ALTER TABLE plugin_registry
      ALTER COLUMN creator_id DROP NOT NULL
    `);

    console.log('✅ creator_id is now nullable');

    // Test by checking column definition
    const [columns] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'plugin_registry'
      AND column_name = 'creator_id'
    `);

    console.log('Column info:', columns);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

makeCreatorIdNullable();
