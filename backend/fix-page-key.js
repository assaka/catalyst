/**
 * Fix page_key to match the URL
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

async function fixPageKey() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Fixing page_key to match URL...\n');

    // Update page_key from 'email-capture' to 'emails'
    await client.query(`
      UPDATE plugin_admin_pages
      SET page_key = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND page_key = $3
    `, ['emails', pluginId, 'email-capture']);

    console.log('✅ Updated page_key from "email-capture" to "emails"');

    // Verify
    const page = await client.query(`
      SELECT page_key, page_name, route FROM plugin_admin_pages WHERE plugin_id = $1
    `, [pluginId]);

    console.log('\nUpdated admin page:');
    console.log('  page_key:', page.rows[0].page_key);
    console.log('  route:', page.rows[0].route);
    console.log('\n✅ Now they match!');
    console.log('  URL: /admin/plugins/my-cart-alert/emails');
    console.log('              └──────┬──────┘  └─┬─┘');
    console.log('                 pluginSlug   pageKey');
    console.log('\n🌐 Visit: http://localhost:5179/admin/plugins/my-cart-alert/emails');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPageKey();
