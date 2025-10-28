/**
 * Disable old broken plugins with mismatched IDs
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

async function disableBrokenPlugins() {
  const client = await pool.connect();

  try {
    console.log('🔧 Disabling broken plugins...\n');

    // Find plugins with no files in normalized tables
    console.log('📋 Finding plugins with no scripts/events...');

    const allPlugins = await client.query(`
      SELECT id, name FROM plugin_registry
      WHERE status = 'active'
    `);

    for (const plugin of allPlugins.rows) {
      // Check if plugin has any scripts
      const scripts = await client.query(`
        SELECT COUNT(*) as count FROM plugin_scripts WHERE plugin_id = $1
      `, [plugin.id]);

      const events = await client.query(`
        SELECT COUNT(*) as count FROM plugin_events WHERE plugin_id = $1
      `, [plugin.id]);

      const hooks = await client.query(`
        SELECT COUNT(*) as count FROM plugin_hooks WHERE plugin_id = $1
      `, [plugin.id]);

      const totalFiles = parseInt(scripts.rows[0].count) + parseInt(events.rows[0].count) + parseInt(hooks.rows[0].count);

      if (totalFiles === 0) {
        console.log(`  ⚠️  ${plugin.name} (${plugin.id}): 0 files - DISABLING`);

        await client.query(`
          UPDATE plugin_registry
          SET status = 'inactive', is_enabled = false
          WHERE id = $1
        `, [plugin.id]);

        console.log(`     ✅ Disabled`);
      } else {
        console.log(`  ✅ ${plugin.name}: ${totalFiles} files - OK`);
      }
    }

    console.log('\n✅ Cleanup complete!');
    console.log('\n📋 Broken plugins are now disabled and won\'t cause script errors');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

disableBrokenPlugins();
