/**
 * Create Test Admin Page in Database
 * 100% Database-Driven Navigation
 *
 * This creates a test admin page entry in the admin_navigation_registry
 * to verify that the navigation system is working correctly.
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

async function createTestPage() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating Test Admin Page...\n');

    // Insert navigation entry into admin_navigation_registry
    console.log('📝 Adding navigation entry to admin_navigation_registry...');
    await client.query(`
      INSERT INTO admin_navigation_registry (
        key, label, icon, route, parent_key, order_position,
        is_visible, is_core, plugin_id, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (key) DO UPDATE SET
        label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        route = EXCLUDED.route,
        order_position = EXCLUDED.order_position,
        is_visible = EXCLUDED.is_visible,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'test-dummy-page',           // key
      'Test Page',                  // label
      'TestTube',                   // icon (from lucide-react)
      '/admin/dummy-test',          // route
      null,                         // parent_key (null = standalone item)
      999,                          // order_position (put it at the end)
      true,                         // is_visible
      false,                        // is_core
      null,                         // plugin_id (null = core feature)
      'Test page for navigation system debugging' // description
    ]);

    console.log('✅ Navigation entry created successfully!');
    console.log('\n📊 Entry Details:');
    console.log('  - Key: test-dummy-page');
    console.log('  - Label: Test Page');
    console.log('  - Route: /admin/dummy-test');
    console.log('  - Icon: TestTube');
    console.log('  - Position: 999 (end of list)');

    // Verify the entry was created
    console.log('\n🔍 Verifying entry in database...');
    const verifyResult = await client.query(`
      SELECT key, label, icon, route, order_position, is_visible
      FROM admin_navigation_registry
      WHERE key = 'test-dummy-page'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Entry verified:');
      console.table(verifyResult.rows);
    } else {
      console.log('❌ Entry not found!');
    }

    console.log('\n='.repeat(60));
    console.log('✅ Test Admin Page Created Successfully!');
    console.log('='.repeat(60));

    console.log('\n📝 Next Steps:');
    console.log('  1. Hard refresh your browser (Ctrl+Shift+R)');
    console.log('  2. Look for "Test Page" in the admin sidebar');
    console.log('  3. Check if clicking it triggers the route /admin/dummy-test');
    console.log('\n💡 Note: The page will use the Layout.jsx fix to handle items without paths.');
    console.log('     Since this item HAS a route, it should appear in the sidebar.');

  } catch (error) {
    console.error('❌ Error creating test page:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTestPage()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
