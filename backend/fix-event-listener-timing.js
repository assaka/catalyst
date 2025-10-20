/**
 * Fix event listener timing - attach AFTER appending to DOM
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

async function fixEventListenerTiming() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing event listener timing...\n');

    const result = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/ChatWidget.js'
    `, [PLUGIN_ID]);

    if (result.rows.length === 0) {
      console.log('❌ ChatWidget.js not found!');
      return;
    }

    let code = result.rows[0].file_content;

    // Remove event listener from render() method
    code = code.replace(
      `      console.log('🎨 Chat bubble HTML set');
      const bubbleElement = document.getElementById('chat-bubble');
      console.log('🎨 Chat bubble element:', bubbleElement);
      if (bubbleElement) {
        bubbleElement.addEventListener('click', () => this.open());
        console.log('🎨 Click listener attached');
      } else {
        console.error('❌ chat-bubble element not found!');
      }`,
      `      console.log('🎨 Chat bubble HTML set');`
    );

    // Add event listener attachment AFTER appendChild in init()
    code = code.replace(
      `      console.log('💬 Step 3: Appending to document.body...');
      document.body.appendChild(this.widget);
      console.log('✅ Widget appended to body');

      // Start polling for new messages`,
      `      console.log('💬 Step 3: Appending to document.body...');
      document.body.appendChild(this.widget);
      console.log('✅ Widget appended to body');

      // Attach event listeners AFTER element is in DOM
      console.log('💬 Step 3.5: Attaching event listeners...');
      const bubbleElement = document.getElementById('chat-bubble');
      console.log('🎨 Chat bubble element found:', bubbleElement);
      if (bubbleElement) {
        bubbleElement.addEventListener('click', () => this.open());
        console.log('✅ Click listener attached to bubble');
      } else {
        console.error('❌ chat-bubble element still not found after appendChild!');
      }

      // Start polling for new messages`
    );

    await client.query(`
      UPDATE plugin_scripts
      SET file_content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
    `, [code, PLUGIN_ID]);

    console.log('✅ Event listener timing fixed!');
    console.log('📝 Event listener now attaches AFTER widget is in DOM');
    console.log('🔄 Hard refresh your browser to see the chat bubble!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixEventListenerTiming()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
