// Check admin_navigation_registry schema
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./src/database/connection');

async function checkRegistrySchema() {
  try {
    console.log('🔍 Checking admin_navigation_registry schema...\n');

    // Get column information
    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'admin_navigation_registry'
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📋 Columns in admin_navigation_registry:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    console.log();

    // Check if there are any plugin items
    const pluginItems = await sequelize.query(`
      SELECT key, label, plugin_id, is_core
      FROM admin_navigation_registry
      WHERE plugin_id IS NOT NULL
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📊 Plugin navigation items:');
    console.log(JSON.stringify(pluginItems, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkRegistrySchema();
