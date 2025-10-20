const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function testNavigation() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Check admin_navigation_registry table
    console.log('=== ADMIN_NAVIGATION_REGISTRY TABLE ===');
    const [navRegistry] = await sequelize.query(`
      SELECT key, label, icon, route, order_position, is_core, plugin_id, is_visible
      FROM admin_navigation_registry
      ORDER BY order_position
    `);
    console.log(`Found ${navRegistry.length} items:`);
    navRegistry.forEach(item => {
      console.log(`  - ${item.label} (${item.key}) - order: ${item.order_position}, core: ${item.is_core}, visible: ${item.is_visible}`);
    });

    // 2. Check plugins table
    console.log('\n=== PLUGINS TABLE (File-based) ===');
    const [plugins] = await sequelize.query(`
      SELECT id, name, status, is_enabled, manifest->>'adminNavigation' as admin_nav
      FROM plugins
      WHERE status = 'installed' AND is_enabled = true
    `);
    console.log(`Found ${plugins.length} active plugins:`);
    plugins.forEach(p => {
      console.log(`  - ${p.name} (${p.id}) - has adminNav: ${!!p.admin_nav}`);
      if (p.admin_nav) {
        console.log(`    ${p.admin_nav}`);
      }
    });

    // 3. Check plugin_registry table
    console.log('\n=== PLUGIN_REGISTRY TABLE (Database-driven) ===');
    const [registryPlugins] = await sequelize.query(`
      SELECT id, name, status, manifest->>'adminNavigation' as admin_nav
      FROM plugin_registry
      WHERE status = 'active'
    `);
    console.log(`Found ${registryPlugins.length} active plugins:`);
    registryPlugins.forEach(p => {
      console.log(`  - ${p.name} (${p.id}) - has adminNav: ${!!p.admin_nav}`);
      if (p.admin_nav) {
        console.log(`    ${p.admin_nav}`);
      }
    });

    // 4. Test the actual service
    console.log('\n=== TESTING AdminNavigationService ===');
    const AdminNavigationService = require('./src/services/AdminNavigationService');
    const navigation = await AdminNavigationService.getNavigationForTenant('default-tenant');

    console.log(`\nNavigation tree has ${navigation.length} top-level items:`);
    navigation.forEach(item => {
      console.log(`  - ${item.label} (${item.key})`);
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          console.log(`    - ${child.label} (${child.key})`);
        });
      }
    });

    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testNavigation();
