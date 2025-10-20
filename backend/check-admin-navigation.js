// Check admin navigation database status
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./src/database/connection');

async function checkNavigationStatus() {
  try {
    console.log('🔍 Checking admin navigation database status...\n');

    // Check if tables exist
    const tablesCheck = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('admin_navigation_registry', 'admin_navigation_config', 'plugins')
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📋 Tables found:');
    tablesCheck.forEach(t => console.log(`  ✓ ${t.table_name}`));
    console.log();

    // Check admin_navigation_registry
    const registryCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM admin_navigation_registry
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 admin_navigation_registry: ${registryCount[0].count} items`);

    if (parseInt(registryCount[0].count) > 0) {
      const registryItems = await sequelize.query(`
        SELECT key, label, icon, route, parent_key, is_core, is_visible, plugin_id
        FROM admin_navigation_registry
        ORDER BY order_position ASC
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });

      console.log('   Sample items:');
      registryItems.forEach(item => {
        console.log(`     - ${item.key}: "${item.label}" (route: ${item.route}, parent: ${item.parent_key || 'none'}, core: ${item.is_core}, visible: ${item.is_visible})`);
      });
    }
    console.log();

    // Check admin_navigation_config
    const configCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM admin_navigation_config
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 admin_navigation_config: ${configCount[0].count} items`);
    console.log();

    // Check plugins
    const pluginsCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM plugins WHERE status = 'active'
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 Active plugins: ${pluginsCount[0].count} items`);

    if (parseInt(pluginsCount[0].count) > 0) {
      const activePlugins = await sequelize.query(`
        SELECT marketplace_plugin_id, status
        FROM plugins
        WHERE status = 'active'
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });

      console.log('   Active plugins:');
      activePlugins.forEach(p => {
        console.log(`     - ${p.marketplace_plugin_id} (${p.status})`);
      });
    }
    console.log();

    // Test the navigation service
    const AdminNavigationService = require('./src/services/AdminNavigationService');
    console.log('🧪 Testing AdminNavigationService.getNavigationForTenant()...');

    const navigation = await AdminNavigationService.getNavigationForTenant('default-tenant');

    console.log(`✅ Navigation loaded successfully: ${navigation.length} top-level items\n`);
    console.log('Navigation tree:');
    navigation.forEach(item => {
      console.log(`  - ${item.key}: "${item.label}" (route: ${item.route})`);
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          console.log(`    └─ ${child.key}: "${child.label}" (route: ${child.route})`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkNavigationStatus();
