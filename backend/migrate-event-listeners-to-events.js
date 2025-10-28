/**
 * Migrate plugin_event_listeners → plugin_events
 * Then drop the old table
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

async function migrateEventListeners() {
  const client = await pool.connect();

  try {
    console.log('🔄 Migrating plugin_event_listeners → plugin_events\n');

    // 1. Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'plugin_event_listeners'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('✅ plugin_event_listeners table does not exist - nothing to migrate');
      return;
    }

    // 2. Get all data
    console.log('📋 Loading data from plugin_event_listeners...');
    const data = await client.query(`
      SELECT plugin_id, file_name, event_name, listener_function, priority, is_enabled, description
      FROM plugin_event_listeners
      ORDER BY plugin_id, file_name
    `);

    console.log(`  Found ${data.rows.length} event listeners`);

    if (data.rows.length === 0) {
      console.log('  Table is empty - safe to drop');
    } else {
      console.log('\n🔄 Migrating to plugin_events...');

      let migrated = 0;
      let skipped = 0;

      for (const row of data.rows) {
        // Check if already exists in plugin_events
        const existing = await client.query(`
          SELECT id FROM plugin_events
          WHERE plugin_id = $1 AND event_name = $2
        `, [row.plugin_id, row.event_name]);

        if (existing.rows.length > 0) {
          console.log(`  ⏭️  Skipped: ${row.plugin_id} - ${row.event_name} (already exists)`);
          skipped++;
          continue;
        }

        // Migrate to plugin_events
        await client.query(`
          INSERT INTO plugin_events
          (plugin_id, event_name, listener_function, priority, is_enabled)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          row.plugin_id,
          row.event_name,
          row.listener_function,
          row.priority || 10,
          row.is_enabled !== false
        ]);

        console.log(`  ✅ Migrated: ${row.plugin_id} - ${row.event_name}`);
        migrated++;
      }

      console.log(`\n📊 Migration Summary:`);
      console.log(`   Migrated: ${migrated}`);
      console.log(`   Skipped: ${skipped} (already existed)`);
    }

    // 3. Drop the table
    console.log('\n🗑️  Dropping plugin_event_listeners table...');
    await client.query('DROP TABLE IF EXISTS plugin_event_listeners CASCADE');
    console.log('  ✅ Table dropped');

    console.log('\n✅ Migration complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Remove plugin_event_listeners queries from plugin-api.js');
    console.log('   2. Commit and deploy changes');
    console.log('   3. All events now use plugin_events table only');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateEventListeners();
