const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addNavigationItem() {
  const client = await pool.connect();

  try {
    // Check if it already exists
    const existing = await client.query(
      'SELECT * FROM admin_navigation_registry WHERE key = $1',
      ['navigation-manager']
    );

    if (existing.rows.length > 0) {
      console.log('✅ Navigation Manager already exists in sidebar');
      return;
    }

    // Get the highest order_position to add at the end
    const maxOrder = await client.query(
      'SELECT MAX(order_position) as max_order FROM admin_navigation_registry'
    );

    const nextOrder = (maxOrder.rows[0].max_order || 0) + 1;

    // Insert the new navigation item
    await client.query(`
      INSERT INTO admin_navigation_registry
        (key, label, route, icon, category, order_position, is_core, is_visible, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      'navigation-manager',
      'Navigation Manager',
      '/admin/navigation-manager',
      'LayoutList',
      'settings',
      nextOrder,
      true,
      true
    ]);

    console.log('✅ Navigation Manager added to sidebar at position', nextOrder);
    console.log('🔄 Refresh your browser to see it in the sidebar');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.release();
    await pool.end();
  }
}

addNavigationItem().catch(console.error);
