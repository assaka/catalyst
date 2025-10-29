/**
 * Fix event listener code format
 * Removes the extra "return" statement that causes syntax errors
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

async function fixEventListenerCode() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing event listener code format...\n');

    // Get all event listeners with "return function" pattern
    const events = await client.query(`
      SELECT id, event_name, file_name, listener_function
      FROM plugin_events
      WHERE listener_function LIKE '%return function%'
    `);

    console.log(`📋 Found ${events.rows.length} event listeners to fix\n`);

    if (events.rows.length === 0) {
      console.log('✅ No events need fixing!');
      return;
    }

    let fixed = 0;

    for (const event of events.rows) {
      const originalCode = event.listener_function;

      // Remove the outer "return " from "return function(...)"
      // Pattern: return function(eventData) { ... };
      // Result: function(eventData) { ... }
      let fixedCode = originalCode.replace(/^\s*return\s+function\s*\(/m, 'function(');

      // Only update if code actually changed
      if (fixedCode !== originalCode) {
        await client.query(`
          UPDATE plugin_events
          SET listener_function = $1, updated_at = NOW()
          WHERE id = $2
        `, [fixedCode, event.id]);

        fixed++;
        console.log(`✓ Fixed: ${event.event_name} (${event.file_name})`);
        console.log(`  Before: ${originalCode.substring(0, 50)}...`);
        console.log(`  After:  ${fixedCode.substring(0, 50)}...`);
        console.log('');
      }
    }

    console.log(`\n✅ Fixed ${fixed} event listeners`);
    console.log('\n🔄 Refresh your app to see the changes!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixEventListenerCode();
