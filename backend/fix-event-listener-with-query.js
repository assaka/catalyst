/**
 * Fix event listener by querying from widget element directly
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

async function fixEventListenerWithQuery() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing event listener with querySelector...\n');

    const result = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/ChatWidget.js'
    `, [PLUGIN_ID]);

    if (result.rows.length === 0) {
      console.log('❌ ChatWidget.js not found!');
      return;
    }

    let code = result.rows[0].file_content;

    // Replace getElementById with querySelector on the widget element
    code = code.replace(
      `      // Attach event listeners AFTER element is in DOM
      console.log('💬 Step 3.5: Attaching event listeners...');
      const bubbleElement = document.getElementById('chat-bubble');
      console.log('🎨 Chat bubble element found:', bubbleElement);
      if (bubbleElement) {
        bubbleElement.addEventListener('click', () => this.open());
        console.log('✅ Click listener attached to bubble');
      } else {
        console.error('❌ chat-bubble element still not found after appendChild!');
      }`,
      `      // Attach event listeners AFTER element is in DOM
      console.log('💬 Step 3.5: Attaching event listeners...');
      console.log('🔍 Widget element:', this.widget);
      console.log('🔍 Widget innerHTML length:', this.widget.innerHTML.length);

      // Query from widget element directly instead of global document
      const bubbleElement = this.widget.querySelector('#chat-bubble');
      console.log('🎨 Chat bubble element (via querySelector):', bubbleElement);

      if (bubbleElement) {
        bubbleElement.addEventListener('click', () => {
          console.log('🖱️ Chat bubble clicked!');
          this.open();
        });
        console.log('✅ Click listener attached to bubble');
      } else {
        console.error('❌ chat-bubble element not found in widget!');
        console.error('Widget HTML:', this.widget.innerHTML.substring(0, 200));
      }`
    );

    await client.query(`
      UPDATE plugin_scripts
      SET file_content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
    `, [code, PLUGIN_ID]);

    console.log('✅ Event listener fixed with querySelector!');
    console.log('📝 Now using this.widget.querySelector() instead of document.getElementById()');
    console.log('🔄 Hard refresh your browser!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixEventListenerWithQuery()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
