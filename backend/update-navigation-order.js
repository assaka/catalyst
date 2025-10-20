/**
 * Update navigation item order position
 * Usage: node update-navigation-order.js <key> <new-position>
 * Example: node update-navigation-order.js chat-support 3
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
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node update-navigation-order.js <key> <new-position>');
    console.log('Example: node update-navigation-order.js chat-support 3');
    console.log('\nCurrent navigation items:');

    const client = await pool.connect();
    const result = await client.query(`
      SELECT key, label, order_position
      FROM admin_navigation_registry
      WHERE is_visible = true
      ORDER BY order_position ASC
    `);
    console.table(result.rows);
    client.release();
    await pool.end();
    return;
  }

  const [key, newPosition] = args;
  const client = await pool.connect();

  try {
    console.log(`\n📋 Updating "${key}" to position ${newPosition}...\n`);

    // Update the position
    const result = await client.query(`
      UPDATE admin_navigation_registry
      SET order_position = $1, updated_at = NOW()
      WHERE key = $2
      RETURNING key, label, order_position
    `, [parseInt(newPosition), key]);

    if (result.rows.length === 0) {
      console.log(`❌ Navigation item "${key}" not found`);
      return;
    }

    console.log('✅ Updated:');
    console.table(result.rows);

    // Show updated order
    console.log('\n📊 Updated navigation order:');
    const allResult = await client.query(`
      SELECT key, label, order_position
      FROM admin_navigation_registry
      WHERE is_visible = true
      ORDER BY order_position ASC
      LIMIT 20
    `);
    console.table(allResult.rows);

    console.log('\n💡 Hard refresh your browser to see changes');

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
