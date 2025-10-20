/**
 * Verify Chat Support navigation is in database and check current state
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

async function verifyNavigation() {
  const client = await pool.connect();

  try {
    console.log('📋 Checking Chat Support navigation setup...\n');

    // 1. Check admin_navigation_registry
    console.log('1️⃣ Checking admin_navigation_registry:');
    const registryResult = await client.query(`
      SELECT key, label, icon, route, order_position, is_visible, is_core, plugin_id
      FROM admin_navigation_registry
      WHERE key = 'chat-support'
    `);

    if (registryResult.rows.length > 0) {
      console.log('✅ Found in admin_navigation_registry:');
      console.table(registryResult.rows);
    } else {
      console.log('❌ NOT found in admin_navigation_registry');
    }

    // 2. Check plugin_admin_pages
    console.log('\n2️⃣ Checking plugin_admin_pages:');
    const pagesResult = await client.query(`
      SELECT plugin_id, page_key, page_name, route, is_enabled
      FROM plugin_admin_pages
      WHERE page_key = 'chat-support'
    `);

    if (pagesResult.rows.length > 0) {
      console.log('✅ Found in plugin_admin_pages:');
      console.table(pagesResult.rows);
    } else {
      console.log('❌ NOT found in plugin_admin_pages');
    }

    // 3. Check all navigation items (to see order)
    console.log('\n3️⃣ All navigation items (ordered):');
    const allNavResult = await client.query(`
      SELECT key, label, order_position, is_visible, is_core
      FROM admin_navigation_registry
      ORDER BY order_position ASC
    `);
    console.table(allNavResult.rows);

    // 4. Test the navigation service
    console.log('\n4️⃣ Testing navigation API endpoint:');
    console.log('   Navigate to: http://localhost:3001/api/admin/navigation');
    console.log('   Or check in browser console after hard refresh');

    console.log('\n💡 Next steps:');
    console.log('   1. Hard refresh your browser (Ctrl+Shift+R)');
    console.log('   2. Check browser console for navigation data');
    console.log('   3. Look for "Chat Support" in admin sidebar');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyNavigation()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
