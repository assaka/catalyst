require('dotenv').config();
const AdminNavigationService = require('./src/services/AdminNavigationService');
const { Sequelize } = require('sequelize');

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

async function fullTest() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Check what's in the plugins table
    console.log('=== 1. PLUGINS TABLE (file-based) ===');
    const [plugins] = await sequelize.query(`
      SELECT id, name, status, is_enabled,
             manifest->>'adminNavigation' as admin_nav
      FROM plugins
      ORDER BY name
    `);

    console.log(`Total plugins: ${plugins.length}`);
    plugins.forEach(p => {
      console.log(`  ${p.status === 'installed' && p.is_enabled ? '✅' : '❌'} ${p.name}`);
      if (p.admin_nav) {
        const nav = JSON.parse(p.admin_nav);
        console.log(`     Nav: ${nav.label} (enabled: ${nav.enabled}, parentKey: ${nav.parentKey})`);
      } else {
        console.log(`     Nav: NONE`);
      }
    });

    // 2. Check what's in plugin_registry
    console.log('\n=== 2. PLUGIN_REGISTRY TABLE (database-driven) ===');
    const [registry] = await sequelize.query(`
      SELECT id, name, status,
             manifest->>'adminNavigation' as admin_nav
      FROM plugin_registry
      ORDER BY name
    `);

    console.log(`Total plugins: ${registry.length}`);
    registry.forEach(p => {
      console.log(`  ${p.status === 'active' ? '✅' : '❌'} ${p.name}`);
      if (p.admin_nav) {
        const nav = JSON.parse(p.admin_nav);
        console.log(`     Nav: ${nav.label} (enabled: ${nav.enabled}, parentKey: ${nav.parentKey})`);
      } else {
        console.log(`     Nav: NONE`);
      }
    });

    // 3. Check what admin_navigation_registry has for plugins
    console.log('\n=== 3. ADMIN_NAVIGATION_REGISTRY (plugin entries) ===');
    const [navRegistry] = await sequelize.query(`
      SELECT key, label, plugin_id, is_visible
      FROM admin_navigation_registry
      WHERE is_core = false
      ORDER BY key
    `);

    console.log(`Plugin entries in registry: ${navRegistry.length}`);
    navRegistry.forEach(item => {
      console.log(`  ${item.is_visible ? '👁️' : '🚫'} ${item.label} (key: ${item.key}, plugin_id: ${item.plugin_id})`);
    });

    // 4. Call the service
    console.log('\n=== 4. CALLING AdminNavigationService ===');
    const navigation = await AdminNavigationService.getNavigationForTenant('default-tenant');

    // 5. Extract ALL plugin items from the tree
    console.log('\n=== 5. PLUGIN ITEMS IN FINAL TREE ===');
    const pluginItems = [];

    function extractPlugins(items, parentPath = '') {
      items.forEach(item => {
        if (item.key && item.key.startsWith('plugin-')) {
          pluginItems.push({
            label: item.label,
            key: item.key,
            path: parentPath ? `${parentPath} > ${item.label}` : item.label
          });
        }
        if (item.children && item.children.length > 0) {
          extractPlugins(item.children, parentPath ? `${parentPath} > ${item.label}` : item.label);
        }
      });
    }

    extractPlugins(navigation);

    console.log(`Found ${pluginItems.length} plugin items in tree:`);
    if (pluginItems.length === 0) {
      console.log('  ❌ NO PLUGIN ITEMS FOUND IN TREE!');
    } else {
      pluginItems.forEach(item => {
        console.log(`  ✅ ${item.path}`);
        console.log(`     (key: ${item.key})`);
      });
    }

    // 6. Show tree structure
    console.log('\n=== 6. FULL TREE STRUCTURE ===');
    function printTree(items, depth = 0) {
      items.forEach(item => {
        const indent = '  '.repeat(depth);
        const isPlugin = item.key && item.key.startsWith('plugin-');
        const marker = isPlugin ? '🔌' : '📁';
        console.log(`${indent}${marker} ${item.label} (${item.key})`);
        if (item.children && item.children.length > 0) {
          printTree(item.children, depth + 1);
        }
      });
    }
    printTree(navigation);

    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

fullTest();
