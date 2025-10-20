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

async function debugNavigation() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check what's in plugin_registry with parentKey
    console.log('=== PLUGIN_REGISTRY ITEMS WITH PARENT KEY ===');
    const [registryWithParent] = await sequelize.query(`
      SELECT
        id,
        name,
        manifest->>'adminNavigation' as admin_nav
      FROM plugin_registry
      WHERE status = 'active'
        AND manifest->>'adminNavigation' IS NOT NULL
        AND manifest->'adminNavigation'->>'parentKey' IS NOT NULL
    `);

    console.log(`Found ${registryWithParent.length} plugins with parentKey:`);
    registryWithParent.forEach(p => {
      const nav = JSON.parse(p.admin_nav);
      console.log(`  - ${p.name}: parentKey="${nav.parentKey}", enabled=${nav.enabled}`);
    });

    // Check what's in plugins table with parentKey
    console.log('\n=== PLUGINS TABLE ITEMS WITH PARENT KEY ===');
    const [pluginsWithParent] = await sequelize.query(`
      SELECT
        id,
        name,
        manifest->>'adminNavigation' as admin_nav
      FROM plugins
      WHERE status = 'installed'
        AND is_enabled = true
        AND manifest->>'adminNavigation' IS NOT NULL
        AND manifest->'adminNavigation'->>'parentKey' IS NOT NULL
    `);

    console.log(`Found ${pluginsWithParent.length} plugins with parentKey:`);
    pluginsWithParent.forEach(p => {
      const nav = JSON.parse(p.admin_nav);
      console.log(`  - ${p.name}: parentKey="${nav.parentKey}", enabled=${nav.enabled}, key=plugin-${p.id}`);
    });

    // Now simulate what the service does
    console.log('\n=== SIMULATING SERVICE LOGIC ===');

    // File-based plugins
    const fileBasedPlugins = await sequelize.query(`
      SELECT
        id,
        name,
        manifest->>'adminNavigation' as admin_nav
      FROM plugins
      WHERE status = 'installed'
        AND is_enabled = true
        AND manifest->>'adminNavigation' IS NOT NULL
    `, { type: sequelize.QueryTypes.SELECT });

    const fileBasedNavItems = fileBasedPlugins
      .filter(p => p.admin_nav)
      .map(p => {
        try {
          const nav = JSON.parse(p.admin_nav);
          if (nav && nav.enabled) {
            return {
              key: `plugin-${p.id}`,
              label: nav.label,
              icon: nav.icon || 'Package',
              route: nav.route,
              parent_key: nav.parentKey || null,
              order_position: nav.order || 100,
              is_core: false,
              plugin_id: p.id,
              is_visible: true,
              category: 'plugins',
              description: nav.description
            };
          }
        } catch (e) {
          console.error(`Failed to parse adminNavigation for file-based plugin ${p.id}:`, e);
        }
        return null;
      })
      .filter(Boolean);

    console.log(`\nFile-based nav items created: ${fileBasedNavItems.length}`);
    fileBasedNavItems.forEach(item => {
      console.log(`  - ${item.label} (${item.key}): parentKey="${item.parent_key}", order=${item.order_position}`);
    });

    // Registry plugins
    const registryPlugins = await sequelize.query(`
      SELECT
        id,
        name,
        manifest->>'adminNavigation' as admin_nav
      FROM plugin_registry
      WHERE status = 'active'
        AND manifest->>'adminNavigation' IS NOT NULL
    `, { type: sequelize.QueryTypes.SELECT });

    const registryNavItems = registryPlugins
      .filter(p => p.admin_nav)
      .map(p => {
        try {
          const nav = JSON.parse(p.admin_nav);
          if (nav && nav.enabled) {
            return {
              key: `plugin-${p.id}`,
              label: nav.label,
              icon: nav.icon || 'Package',
              route: nav.route,
              parent_key: nav.parentKey || null,
              order_position: nav.order || 100,
              is_core: false,
              plugin_id: p.id,
              is_visible: true,
              category: 'plugins',
              description: nav.description
            };
          }
        } catch (e) {
          console.error(`Failed to parse adminNavigation for plugin ${p.id}:`, e);
        }
        return null;
      })
      .filter(Boolean);

    console.log(`\nRegistry nav items created: ${registryNavItems.length}`);
    registryNavItems.forEach(item => {
      console.log(`  - ${item.label} (${item.key}): parentKey="${item.parent_key}", order=${item.order_position}`);
    });

    console.log('\n✅ Debug complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugNavigation();
