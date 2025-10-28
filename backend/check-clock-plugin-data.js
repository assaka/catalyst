/**
 * Check what data exists for Clock plugin in database
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

async function checkClockPlugin() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking Clock plugin data...\n');

    // 1. Check plugin_registry
    console.log('📋 Checking plugin_registry table:');
    const plugins = await client.query(`
      SELECT id, name, type, status, category
      FROM plugin_registry
      WHERE name ILIKE '%clock%'
    `);
    console.log('  Found plugins:', plugins.rows);

    if (plugins.rows.length === 0) {
      console.log('\n❌ No Clock plugin found in plugin_registry!');
      return;
    }

    const pluginId = plugins.rows[0].id;
    console.log(`\n✅ Using plugin ID: ${pluginId}`);

    // 2. Check plugin_scripts
    console.log('\n📜 Checking plugin_scripts table:');
    const scripts = await client.query(`
      SELECT id, file_name, script_type, scope, is_enabled,
             LEFT(file_content, 50) as content_preview
      FROM plugin_scripts
      WHERE plugin_id = $1
      ORDER BY file_name
    `, [pluginId]);
    console.log(`  Found ${scripts.rows.length} scripts:`);
    scripts.rows.forEach(s => {
      console.log(`    - ${s.file_name} (${s.script_type}, ${s.scope}, enabled: ${s.is_enabled})`);
      console.log(`      Preview: ${s.content_preview}...`);
    });

    // 3. Check plugin_events
    console.log('\n📡 Checking plugin_events table:');
    const events = await client.query(`
      SELECT id, event_name, priority, is_enabled,
             LEFT(listener_function, 50) as function_preview
      FROM plugin_events
      WHERE plugin_id = $1
      ORDER BY event_name
    `, [pluginId]);
    console.log(`  Found ${events.rows.length} events:`);
    events.rows.forEach(e => {
      console.log(`    - ${e.event_name} (priority: ${e.priority}, enabled: ${e.is_enabled})`);
      console.log(`      Preview: ${e.function_preview}...`);
    });

    // 4. Check plugin_hooks
    console.log('\n🪝 Checking plugin_hooks table:');
    const hooks = await client.query(`
      SELECT id, hook_name, hook_type, priority, is_enabled,
             LEFT(handler_function, 50) as function_preview
      FROM plugin_hooks
      WHERE plugin_id = $1
      ORDER BY hook_name
    `, [pluginId]);
    console.log(`  Found ${hooks.rows.length} hooks:`);
    hooks.rows.forEach(h => {
      console.log(`    - ${h.hook_name} (${h.hook_type}, priority: ${h.priority}, enabled: ${h.is_enabled})`);
      console.log(`      Preview: ${h.function_preview}...`);
    });

    // 5. Check plugin_admin_pages
    console.log('\n📄 Checking plugin_admin_pages table:');
    const adminPages = await client.query(`
      SELECT page_key, page_name, route, is_enabled
      FROM plugin_admin_pages
      WHERE plugin_id = $1
    `, [pluginId]);
    console.log(`  Found ${adminPages.rows.length} admin pages:`);
    adminPages.rows.forEach(p => {
      console.log(`    - ${p.page_key}: ${p.page_name} (${p.route}, enabled: ${p.is_enabled})`);
    });

    // 6. Check source_code JSON field
    console.log('\n📦 Checking source_code JSON field:');
    const sourceCode = await client.query(`
      SELECT source_code
      FROM plugin_registry
      WHERE id = $1
    `, [pluginId]);

    if (sourceCode.rows[0].source_code) {
      const files = typeof sourceCode.rows[0].source_code === 'string'
        ? JSON.parse(sourceCode.rows[0].source_code)
        : sourceCode.rows[0].source_code;
      console.log(`  Found ${files?.length || 0} files in source_code JSON`);
      if (files && files.length > 0) {
        files.forEach(f => console.log(`    - ${f.name}`));
      }
    } else {
      console.log('  No source_code field');
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkClockPlugin();
