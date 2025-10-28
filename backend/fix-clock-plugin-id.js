/**
 * Fix Clock plugin ID mismatch
 * Update plugin_registry.id to match plugin_scripts/plugin_events
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

async function fixClockPluginId() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing Clock plugin ID mismatch...\n');

    const oldId = '0f7f2b65-89b9-412b-a045-52fed2edf800';
    const correctId = '1760827872546-clock';

    // 1. Check current state
    console.log('📋 Current state:');
    const currentPlugin = await client.query(`
      SELECT id, name, status FROM plugin_registry WHERE id = $1
    `, [oldId]);

    if (currentPlugin.rows.length === 0) {
      console.log('  ❌ Plugin with old ID not found!');
      return;
    }

    console.log(`  Plugin: ${currentPlugin.rows[0].name}`);
    console.log(`  Old ID: ${oldId}`);
    console.log(`  New ID: ${correctId}`);

    // 2. Check if new ID already exists
    const existingPlugin = await client.query(`
      SELECT id FROM plugin_registry WHERE id = $1
    `, [correctId]);

    if (existingPlugin.rows.length > 0) {
      console.log('\n  ⚠️  Plugin with new ID already exists!');
      console.log('     Deleting old UUID entry instead...');

      await client.query(`DELETE FROM plugin_registry WHERE id = $1`, [oldId]);
      console.log('  ✅ Deleted old UUID entry');
    } else {
      // 3. Update the ID
      console.log('\n🔄 Updating plugin_registry ID...');

      await client.query(`
        UPDATE plugin_registry
        SET id = $1
        WHERE id = $2
      `, [correctId, oldId]);

      console.log('  ✅ Updated plugin_registry.id');
    }

    // 4. Verify the fix
    console.log('\n🔍 Verifying fix...');

    const scripts = await client.query(`
      SELECT COUNT(*) as count FROM plugin_scripts WHERE plugin_id = $1
    `, [correctId]);
    console.log(`  ✅ plugin_scripts: ${scripts.rows[0].count} files found`);

    const events = await client.query(`
      SELECT COUNT(*) as count FROM plugin_events WHERE plugin_id = $1
    `, [correctId]);
    console.log(`  ✅ plugin_events: ${events.rows[0].count} events found`);

    const plugin = await client.query(`
      SELECT id, name FROM plugin_registry WHERE id = $1
    `, [correctId]);

    if (plugin.rows.length > 0) {
      console.log(`  ✅ plugin_registry: Clock plugin found with ID ${correctId}`);
    }

    console.log('\n✅ Fix complete! All tables now use the same ID.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixClockPluginId();
