/**
 * Remove debug console.log statements from ChatWidget
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

const PLUGIN_ID = 'customer-service-chat';

async function removeDebugLogs() {
  const client = await pool.connect();

  try {
    console.log('🧹 Removing debug logs from ChatWidget...\n');

    const result = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/ChatWidget.js'
    `, [PLUGIN_ID]);

    if (result.rows.length === 0) {
      console.log('❌ ChatWidget.js not found!');
      return;
    }

    let code = result.rows[0].file_content;

    // Remove all debug console.log statements (keep console.error)
    const logsToRemove = [
      "      console.log('💬 Step 1: Creating widget container...');",
      "      console.log('✅ Widget container created');",
      "    console.log('✅ Widget container created');",
      "      console.log('💬 Step 2: Rendering widget...');",
      "      console.log('✅ Widget rendered');",
      "      console.log('💬 Step 3: Appending to document.body...');",
      "      console.log('✅ Widget appended to body');",
      "        console.log('🖱️ Chat bubble clicked!');",
      "        console.log('✅ Click listener attached');",
      "      console.log('✅ Click listener attached');",
      "      console.log('💬 Step 4: Starting message polling...');",
      "      console.log('✅ ChatWidget fully initialized!');",
      "    console.log('🎨 render() called, isOpen:', this.isOpen);",
      "      console.log('🎨 Rendering chat bubble (closed state)...');",
      "      console.log('🎨 Chat bubble HTML set');",
      "        console.log('✅ Click listener re-attached to bubble');",
      "      console.log('🎨 Rendering chat window (open state)...');",
      "  console.log('💬 Initializing ChatWidget...');",
      "  console.log('✅ ChatWidget initialized!');"
    ];

    let removedCount = 0;
    for (const logStatement of logsToRemove) {
      const beforeLength = code.length;
      code = code.replace(new RegExp(logStatement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n', 'g'), '');
      if (code.length < beforeLength) {
        removedCount++;
      }
    }

    await client.query(`
      UPDATE plugin_scripts
      SET file_content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
    `, [code, PLUGIN_ID]);

    console.log(`✅ Removed ${removedCount} debug log statements`);
    console.log('📝 Error logging (console.error) has been kept');
    console.log('🔄 Hard refresh your browser (Ctrl+Shift+R)');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

removeDebugLogs()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
