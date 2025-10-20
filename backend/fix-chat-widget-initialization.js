/**
 * Fix ChatWidget initialization - initialize immediately instead of waiting for DOMContentLoaded
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

async function fixInitialization() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing ChatWidget initialization...\n');

    // Get current ChatWidget script
    const result = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/ChatWidget.js'
    `, [PLUGIN_ID]);

    if (result.rows.length === 0) {
      console.log('❌ ChatWidget.js not found!');
      return;
    }

    const currentCode = result.rows[0].file_content;

    // Replace the DOMContentLoaded listener with immediate initialization
    const updatedCode = currentCode.replace(
      `// Auto-initialize
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const widget = new ChatWidget();
    widget.init();
  });
}`,
      `// Auto-initialize immediately (plugin loads after DOMContentLoaded)
if (typeof window !== 'undefined') {
  console.log('💬 Initializing ChatWidget...');
  const widget = new ChatWidget();
  widget.init();
  console.log('✅ ChatWidget initialized!');
}`
    );

    if (updatedCode === currentCode) {
      console.log('⚠️ No changes needed - code pattern not found');
      console.log('Current ending:', currentCode.slice(-300));
      return;
    }

    // Update the script in database
    await client.query(`
      UPDATE plugin_scripts
      SET file_content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
    `, [updatedCode, PLUGIN_ID]);

    console.log('✅ ChatWidget initialization fixed!');
    console.log('\n📝 Changed:');
    console.log('   FROM: window.addEventListener(\'DOMContentLoaded\', ...)');
    console.log('   TO:   Immediate initialization');
    console.log('\n🔄 Refresh your browser to see the chat widget!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixInitialization()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
