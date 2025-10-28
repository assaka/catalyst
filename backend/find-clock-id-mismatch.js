/**
 * Find ID mismatch for Clock plugin
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

async function findClockMismatch() {
  const client = await pool.connect();

  try {
    console.log('🔍 Finding Clock plugin ID mismatch...\n');

    // 1. Find all Clock entries in plugin_registry
    console.log('📋 All Clock entries in plugin_registry:');
    const registryPlugins = await client.query(`
      SELECT id, name, type, status
      FROM plugin_registry
      WHERE name ILIKE '%clock%'
      ORDER BY created_at DESC
    `);
    console.log(`  Found ${registryPlugins.rows.length} entries:`);
    registryPlugins.rows.forEach(p => {
      console.log(`    - ID: ${p.id}, Name: ${p.name}, Type: ${p.type}, Status: ${p.status}`);
    });

    // 2. Find all plugin_scripts with 'clock' in plugin_id
    console.log('\n📜 All Clock entries in plugin_scripts:');
    const scripts = await client.query(`
      SELECT plugin_id, COUNT(*) as count
      FROM plugin_scripts
      WHERE plugin_id ILIKE '%clock%'
      GROUP BY plugin_id
    `);
    console.log(`  Found ${scripts.rows.length} plugin_id groups:`);
    scripts.rows.forEach(s => {
      console.log(`    - plugin_id: ${s.plugin_id}, files: ${s.count}`);
    });

    // 3. Find all plugin_events with 'clock' in plugin_id
    console.log('\n📡 All Clock entries in plugin_events:');
    const events = await client.query(`
      SELECT plugin_id, COUNT(*) as count
      FROM plugin_events
      WHERE plugin_id ILIKE '%clock%'
      GROUP BY plugin_id
    `);
    console.log(`  Found ${events.rows.length} plugin_id groups:`);
    events.rows.forEach(e => {
      console.log(`    - plugin_id: ${e.plugin_id}, events: ${e.count}`);
    });

    // 4. Find all plugin_hooks with 'clock' in plugin_id
    console.log('\n🪝 All Clock entries in plugin_hooks:');
    const hooks = await client.query(`
      SELECT plugin_id, COUNT(*) as count
      FROM plugin_hooks
      WHERE plugin_id ILIKE '%clock%'
      GROUP BY plugin_id
    `);
    console.log(`  Found ${hooks.rows.length} plugin_id groups:`);
    hooks.rows.forEach(h => {
      console.log(`    - plugin_id: ${h.plugin_id}, hooks: ${h.count}`);
    });

    // 5. Show the specific event data
    console.log('\n📋 Detailed plugin_events data:');
    const eventDetails = await client.query(`
      SELECT plugin_id, event_name, is_enabled, created_at
      FROM plugin_events
      WHERE plugin_id ILIKE '%clock%'
    `);
    eventDetails.rows.forEach(e => {
      console.log(`    - plugin_id: ${e.plugin_id}`);
      console.log(`      event: ${e.event_name}`);
      console.log(`      enabled: ${e.is_enabled}`);
      console.log(`      created: ${e.created_at}`);
    });

    // 6. Recommendation
    console.log('\n💡 Recommendation:');
    const registryId = registryPlugins.rows[0]?.id;
    const eventsId = events.rows[0]?.plugin_id;

    if (registryId && eventsId && registryId !== eventsId) {
      console.log(`  ❌ ID MISMATCH DETECTED!`);
      console.log(`     plugin_registry uses: ${registryId}`);
      console.log(`     plugin_events uses:   ${eventsId}`);
      console.log(`\n  Fix options:`);
      console.log(`     A) Update plugin_registry.id to "${eventsId}"`);
      console.log(`     B) Update plugin_events.plugin_id to "${registryId}"`);
      console.log(`     C) Use the older ID if it's the original`);
    } else {
      console.log(`  ✅ IDs match or one is missing`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

findClockMismatch();
