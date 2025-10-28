/**
 * Check if plugin_event_listeners table has any data
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

async function checkUsage() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking plugin_event_listeners table...\n');

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'plugin_event_listeners'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ plugin_event_listeners table does not exist');
      console.log('✅ Safe to remove references from code');
      return;
    }

    // Count total rows
    const count = await client.query(`
      SELECT COUNT(*) FROM plugin_event_listeners
    `);

    console.log(`📊 Total rows: ${count.rows[0].count}`);

    if (count.rows[0].count == 0) {
      console.log('✅ Table is empty - safe to drop');
      console.log('\n💡 Recommendation:');
      console.log('   1. Remove queries from plugin-api.js');
      console.log('   2. Drop table: DROP TABLE plugin_event_listeners CASCADE;');
      return;
    }

    // Show data
    console.log('\n📋 Data in plugin_event_listeners:');
    const data = await client.query(`
      SELECT plugin_id, file_name, event_name, is_enabled
      FROM plugin_event_listeners
      ORDER BY plugin_id, file_name
    `);

    data.rows.forEach(row => {
      console.log(`  - Plugin: ${row.plugin_id}`);
      console.log(`    File: ${row.file_name}`);
      console.log(`    Event: ${row.event_name}`);
      console.log(`    Enabled: ${row.is_enabled}`);
      console.log('');
    });

    console.log('⚠️  Table has data - need to migrate first!');
    console.log('\n💡 Migration steps:');
    console.log('   1. Migrate data from plugin_event_listeners → plugin_events');
    console.log('   2. Verify migration');
    console.log('   3. Remove queries from plugin-api.js');
    console.log('   4. Drop table: DROP TABLE plugin_event_listeners CASCADE;');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsage();
