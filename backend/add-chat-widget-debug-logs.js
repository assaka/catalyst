/**
 * Add debug logs to ChatWidget to see where it's failing
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

async function addDebugLogs() {
  const client = await pool.connect();

  try {
    console.log('🔍 Adding debug logs to ChatWidget...\n');

    // Get current ChatWidget script
    const result = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/ChatWidget.js'
    `, [PLUGIN_ID]);

    if (result.rows.length === 0) {
      console.log('❌ ChatWidget.js not found!');
      return;
    }

    let code = result.rows[0].file_content;

    // Add try-catch and logs to init() method
    code = code.replace(
      `  // Initialize and inject widget into page
  init() {
    // Create widget container
    this.widget = document.createElement('div');`,
      `  // Initialize and inject widget into page
  init() {
    try {
      console.log('💬 Step 1: Creating widget container...');
      // Create widget container
      this.widget = document.createElement('div');
      console.log('✅ Widget container created');`
    );

    code = code.replace(
      `    this.render();
    document.body.appendChild(this.widget);`,
      `    console.log('💬 Step 2: Rendering widget...');
      this.render();
      console.log('✅ Widget rendered');

      console.log('💬 Step 3: Appending to document.body...');
      document.body.appendChild(this.widget);
      console.log('✅ Widget appended to body');`
    );

    code = code.replace(
      `    // Start polling for new messages
    setInterval(() => this.pollMessages(), 3000);
  }`,
      `    // Start polling for new messages
      console.log('💬 Step 4: Starting message polling...');
      setInterval(() => this.pollMessages(), 3000);
      console.log('✅ ChatWidget fully initialized!');
    } catch (error) {
      console.error('❌ ChatWidget initialization error:', error);
      console.error('Stack:', error.stack);
    }
  }`
    );

    // Update the script in database
    await client.query(`
      UPDATE plugin_scripts
      SET file_content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
    `, [code, PLUGIN_ID]);

    console.log('✅ Debug logs added!');
    console.log('🔄 Hard refresh your browser (Ctrl+Shift+R) to see detailed logs');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDebugLogs()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
