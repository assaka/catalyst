/**
 * Update core navigation items to hierarchical order positions
 * Top-level: Dashboard (1), Catalog (10), Sales (20), Content (30), Marketing (40), SEO (50), Import/Export (60), Layout (70), Store (80), Advanced (90)
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

async function updateNavigationOrder() {
  const client = await pool.connect();

  try {
    console.log('✅ Database connected\n');
    console.log('📋 Updating core navigation order positions...\n');

    // Define the hierarchical order mapping
    // Top-level items use increments of 10: 1, 10, 20, 30, 40, 50...
    const orderMapping = [
      { key: 'dashboard', position: 1 },
      { key: 'catalog', position: 10 },
      { key: 'products', position: 10 },  // Alias for catalog
      { key: 'sales', position: 20 },
      { key: 'orders', position: 20 },    // Alias for sales
      { key: 'content', position: 30 },
      { key: 'marketing', position: 40 },
      { key: 'seo', position: 50 },
      { key: 'import-export', position: 60 },
      { key: 'layout', position: 70 },
      { key: 'store', position: 80 },
      { key: 'stores', position: 80 },    // Alias for store
      { key: 'advanced', position: 90 },
      { key: 'settings', position: 90 },  // Alias for advanced
      { key: 'plugins', position: 100 }
    ];

    for (const { key, position } of orderMapping) {
      const result = await client.query(`
        UPDATE admin_navigation_registry
        SET order_position = $1, updated_at = NOW()
        WHERE key = $2 AND is_core = true
        RETURNING key, label, order_position
      `, [position, key]);

      if (result.rows.length > 0) {
        console.log(`✅ ${result.rows[0].label.padEnd(20)} → position ${position}`);
      } else {
        console.log(`⚠️  No core item found with key: ${key}`);
      }
    }

    // Show final state
    console.log('\n📊 Updated navigation order:');
    const finalResult = await client.query(`
      SELECT key, label, order_position, parent_key, is_core
      FROM admin_navigation_registry
      WHERE is_core = true
      ORDER BY order_position ASC
    `);

    finalResult.rows.forEach(item => {
      const indent = item.parent_key ? '  └─ ' : '';
      console.log(`${indent}${item.key.padEnd(20)} (${item.label.padEnd(20)}): ${item.order_position}`);
    });

    console.log('\n✅ Navigation order updated successfully!');
    console.log('💡 Reload the admin panel to see the changes');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateNavigationOrder()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
