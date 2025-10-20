/**
 * Fix chat widget reopening issue - attach click listener after every render
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

async function fixReopenIssue() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing chat reopen issue...\n');

    const result = await client.query(`
      SELECT file_content FROM plugin_scripts
      WHERE plugin_id = $1 AND file_name = 'components/ChatWidget.js'
    `, [PLUGIN_ID]);

    if (result.rows.length === 0) {
      console.log('❌ ChatWidget.js not found!');
      return;
    }

    let code = result.rows[0].file_content;

    // Find the render() method and add click listener re-attachment for bubble
    const searchString = `      console.log('🎨 Chat bubble HTML set');
    } else {`;

    const replacement = `      console.log('🎨 Chat bubble HTML set');

      // Re-attach click listener to new bubble element
      const bubbleElement = this.widget.querySelector('#chat-bubble');
      if (bubbleElement) {
        bubbleElement.addEventListener('click', () => {
          console.log('🖱️ Chat bubble clicked!');
          this.open();
        });
        console.log('✅ Click listener re-attached to bubble');
      }
    } else {`;

    if (code.includes(searchString)) {
      code = code.replace(searchString, replacement);

      await client.query(`
        UPDATE plugin_scripts
        SET file_content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
      `, [code, PLUGIN_ID]);

      console.log('✅ Fixed reopen issue!');
      console.log('📝 Click listener will now be re-attached every time the bubble is rendered');
      console.log('🔄 HARD REFRESH your browser (Ctrl+Shift+R)');
    } else {
      console.log('❌ Search string not found in code');
      console.log('Searching for alternative location...');

      // Try to find the section
      const idx = code.indexOf('Chat bubble HTML set');
      if (idx !== -1) {
        console.log('Found at position', idx);
        console.log('Context:');
        console.log(code.substring(idx, idx + 300));
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

fixReopenIssue()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
