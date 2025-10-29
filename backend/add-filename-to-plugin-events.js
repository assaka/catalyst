/**
 * Add file_name column to plugin_events table
 * Allows custom filenames for event listeners
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

async function addFileNameColumn() {
  const client = await pool.connect();

  try {
    console.log('🔧 Adding file_name column to plugin_events...\n');

    // Add file_name column
    await client.query(`
      ALTER TABLE plugin_events
      ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)
    `);

    console.log('✅ Column added');

    // Populate existing rows with event_name-based filename
    console.log('\n📋 Populating existing rows...');
    const result = await client.query(`
      UPDATE plugin_events
      SET file_name = REPLACE(event_name, '.', '_') || '.js'
      WHERE file_name IS NULL
    `);

    console.log(`✅ Updated ${result.rowCount} rows with auto-generated filenames`);

    // Verify
    const events = await client.query(`
      SELECT event_name, file_name FROM plugin_events LIMIT 5
    `);

    console.log('\n🔍 Sample data:');
    events.rows.forEach(e => {
      console.log(`   ${e.file_name} → ${e.event_name}`);
    });

    console.log('\n✅ Migration complete!');
    console.log('\n📋 Now:');
    console.log('   - Custom filenames will be preserved');
    console.log('   - "my-tracker.js" stays as "my-tracker.js"');
    console.log('   - "test.js" stays as "test.js"');
    console.log('   - Event mapping is separate in event_name column');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addFileNameColumn();
