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

    // Get all event listeners
    const events = await client.query(`
      SELECT id, event_name, file_name, listener_function
      FROM plugin_events
    `);

    console.log(`📋 Found ${events.rows.length} event listeners to check\n`);

    if (events.rows.length === 0) {
      console.log('✅ No events found!');
      return;
    }

    let fixed = 0;

    for (const event of events.rows) {
      const originalCode = event.listener_function.trim();
      let fixedCode = originalCode;

      // Fix 1: Remove "return " from "return function(...)"
      if (fixedCode.match(/^\s*return\s+function\s*\(/m)) {
        fixedCode = fixedCode.replace(/^\s*return\s+function\s*\(/m, 'function(');
      }

      // Fix 2: Convert anonymous function to arrow function
      // Need to handle multi-line code properly
      const lines = fixedCode.split('\n');

      // Check if any line has the anonymous function pattern
      let hasAnonymousFunction = false;
      for (const line of lines) {
        if (line.trim().match(/^function\s*\([^)]*\)\s*\{/)) {
          hasAnonymousFunction = true;
          break;
        }
      }

      if (hasAnonymousFunction) {
        // Find and replace the function declaration line
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().match(/^function\s*\([^)]*\)\s*\{/)) {
            lines[i] = lines[i].replace(/function\s*\(([^)]*)\)\s*\{/, '($1) => {');
            break;
          }
        }
        fixedCode = lines.join('\n').replace(/;\s*$/, ''); // Remove trailing semicolon
      }

      // Only update if code actually changed
      if (fixedCode !== originalCode) {
        await client.query(`
          UPDATE plugin_events
          SET listener_function = $1, updated_at = NOW()
          WHERE id = $2
        `, [fixedCode, event.id]);

        fixed++;
        console.log(`✓ Fixed: ${event.event_name} (${event.file_name})`);
        console.log(`  Before: ${originalCode.substring(0, 60)}...`);
        console.log(`  After:  ${fixedCode.substring(0, 60)}...`);
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
