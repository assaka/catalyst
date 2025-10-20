const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function checkStatus() {
  console.log('🔍 Checking customer-service-chat plugin status...\n');

  try {
    // Check plugin registry
    const pluginResult = await pool.query(
      'SELECT id, name, status FROM plugin_registry WHERE id = $1',
      ['customer-service-chat']
    );

    if (pluginResult.rows.length === 0) {
      console.log('❌ Plugin not found in database!');
      return;
    }

    const plugin = pluginResult.rows[0];
    console.log('📦 Plugin Status:');
    console.log(`  - ID: ${plugin.id}`);
    console.log(`  - Name: ${plugin.name}`);
    console.log(`  - Status: ${plugin.status}`);

    // Check scripts
    const scriptsResult = await pool.query(
      'SELECT file_name, scope, script_type, is_enabled, LENGTH(file_content) as size FROM plugin_scripts WHERE plugin_id = $1 ORDER BY load_priority',
      ['customer-service-chat']
    );

    console.log(`\n📄 Scripts (${scriptsResult.rows.length} total):`);
    scriptsResult.rows.forEach(s => {
      console.log(`  - ${s.file_name}`);
      console.log(`    Scope: ${s.scope}, Type: ${s.script_type}, Enabled: ${s.is_enabled}, Size: ${s.size} chars`);
    });

    // Check hooks
    const hooksResult = await pool.query(
      'SELECT hook_name, priority, is_enabled FROM plugin_hooks WHERE plugin_id = $1',
      ['customer-service-chat']
    );

    console.log(`\n🪝 Hooks (${hooksResult.rows.length} total):`);
    hooksResult.rows.forEach(h => {
      console.log(`  - ${h.hook_name} (priority: ${h.priority}, enabled: ${h.is_enabled})`);
    });

    // Check events
    const eventsResult = await pool.query(
      'SELECT event_name, priority, is_enabled FROM plugin_events WHERE plugin_id = $1',
      ['customer-service-chat']
    );

    console.log(`\n📡 Events (${eventsResult.rows.length} total):`);
    eventsResult.rows.forEach(e => {
      console.log(`  - ${e.event_name} (priority: ${e.priority}, enabled: ${e.is_enabled})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkStatus();
