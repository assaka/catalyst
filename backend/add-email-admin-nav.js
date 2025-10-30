/**
 * Add Email Capture admin navigation to plugin manifest
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function addEmailAdminNav() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('📋 Adding Email Capture to admin navigation...\n');

    // Get current manifest
    const plugin = await client.query(`
      SELECT manifest FROM plugin_registry WHERE id = $1
    `, [pluginId]);

    if (plugin.rows.length === 0) {
      console.log('❌ Plugin not found');
      return;
    }

    const manifest = plugin.rows[0].manifest || {};

    console.log('Current manifest:', JSON.stringify(manifest, null, 2));

    // Add adminNavigation to manifest
    manifest.adminNavigation = {
      enabled: true,
      label: 'Email Capture',
      icon: 'Mail',
      route: '/admin/plugins/my-cart-alert/emails',
      order: 100,
      category: 'marketing',
      description: 'View and manage captured email addresses from cart'
    };

    // Update manifest
    await client.query(`
      UPDATE plugin_registry
      SET manifest = $1, updated_at = NOW()
      WHERE id = $2
    `, [manifest, pluginId]);

    console.log('✅ Admin navigation added to manifest!');
    console.log('\nUpdated manifest.adminNavigation:');
    console.log(JSON.stringify(manifest.adminNavigation, null, 2));

    console.log('\n🔄 How admin navigation works:');
    console.log('   1. AdminNavigationService reads plugin_registry.manifest');
    console.log('   2. Extracts manifest->>"adminNavigation" JSON field');
    console.log('   3. Creates navigation item with route and icon');
    console.log('   4. Adds to admin sidebar');

    console.log('\n📍 The page will appear at:');
    console.log('   URL: /admin/plugins/my-cart-alert/emails');
    console.log('   Sidebar: Under "Plugins" or "Marketing" section');
    console.log('   Icon: Mail (envelope icon)');

    console.log('\n✅ Refresh your admin dashboard to see the new menu item!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addEmailAdminNav();
