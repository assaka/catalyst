/**
 * Final fix for click handler - insert event listener after appendChild
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

async function fixClickHandler() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing click handler (final)...\n');

    const result = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/ChatWidget.js'
    `, [PLUGIN_ID]);

    if (result.rows.length === 0) {
      console.log('❌ ChatWidget.js not found!');
      return;
    }

    let code = result.rows[0].file_content;

    // Insert event listener code AFTER appendChild and BEFORE setInterval
    const searchString = `      console.log('✅ Widget appended to body');

      // Start polling for new messages`;

    const replacement = `      console.log('✅ Widget appended to body');

      // Attach click event listener
      console.log('💬 Step 3.5: Attaching click listener...');
      const bubbleElement = this.widget.querySelector('#chat-bubble');
      console.log('🎨 Bubble element found:', bubbleElement);
      if (bubbleElement) {
        bubbleElement.addEventListener('click', () => {
          console.log('🖱️ Chat bubble clicked!');
          this.open();
        });
        console.log('✅ Click listener attached!');
      } else {
        console.error('❌ Bubble element not found');
      }

      // Start polling for new messages`;

    if (code.includes(searchString)) {
      code = code.replace(searchString, replacement);

      await client.query(`
        UPDATE plugin_scripts
        SET file_content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
      `, [code, PLUGIN_ID]);

      console.log('✅ Click handler fixed!');
      console.log('🔄 HARD REFRESH your browser (Ctrl+Shift+R)');
    } else {
      console.log('❌ Search string not found in code');
      console.log('Code around that area:');
      const idx = code.indexOf('Widget appended to body');
      if (idx !== -1) {
        console.log(code.substring(idx, idx + 200));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixClickHandler()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
