/**
 * Add granular debug logs to render() method
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

async function debugRenderMethod() {
  const client = await pool.connect();

  try {
    console.log('🔍 Adding debug logs to render() method...\n');

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

    // Add debug logs to render() method
    code = code.replace(
      `  // Render widget HTML
  render() {
    if (!this.isOpen) {`,
      `  // Render widget HTML
  render() {
    console.log('🎨 render() called, isOpen:', this.isOpen);
    if (!this.isOpen) {
      console.log('🎨 Rendering chat bubble (closed state)...');`
    );

    code = code.replace(
      `      document.getElementById('chat-bubble').addEventListener('click', () => this.open());
    } else {`,
      `      console.log('🎨 Chat bubble HTML set');
      const bubbleElement = document.getElementById('chat-bubble');
      console.log('🎨 Chat bubble element:', bubbleElement);
      if (bubbleElement) {
        bubbleElement.addEventListener('click', () => this.open());
        console.log('🎨 Click listener attached');
      } else {
        console.error('❌ chat-bubble element not found!');
      }
    } else {
      console.log('🎨 Rendering chat window (open state)...');`
    );

    // Update the script in database
    await client.query(`
      UPDATE plugin_scripts
      SET file_content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE plugin_id = $2 AND file_name = 'components/ChatWidget.js'
    `, [code, PLUGIN_ID]);

    console.log('✅ Debug logs added to render() method!');
    console.log('🔄 Hard refresh your browser to see detailed render logs');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

debugRenderMethod()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
