// Check plugins table schema
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./src/database/connection');

async function checkPluginsSchema() {
  try {
    console.log('🔍 Checking plugins table schema...\n');

    // Get column information
    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'plugins'
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📋 Columns in plugins table:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    console.log();

    // Get sample data
    const sampleData = await sequelize.query(`
      SELECT * FROM plugins LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📊 Sample data:');
    console.log(JSON.stringify(sampleData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkPluginsSchema();
