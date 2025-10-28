/**
 * Fix Cart Test plugin creator_id to match current user
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

async function fixCreator() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing Cart Test creator_id...\n');

    // Get user ID by email
    const user = await client.query(`
      SELECT id FROM users WHERE email = 'info@itomoti.com'
    `);

    if (user.rows.length === 0) {
      console.log('❌ User info@itomoti.com not found!');
      return;
    }

    const pluginId = 'b811f37d-f09c-4eb6-a813-eaf0f7324a14';
    const correctUserId = user.rows[0].id;

    console.log(`📋 Found user: ${correctUserId}`);

    // Update creator_id
    await client.query(`
      UPDATE plugin_registry
      SET creator_id = $1
      WHERE id = $2
    `, [correctUserId, pluginId]);

    console.log('✅ Updated Cart Test creator_id');
    console.log(`   Plugin ID: ${pluginId}`);
    console.log(`   New creator_id: ${correctUserId}`);

    // Verify
    const plugin = await client.query(`
      SELECT name, creator_id FROM plugin_registry WHERE id = $1
    `, [pluginId]);

    console.log('\n✅ Verification:');
    console.log(`   ${plugin.rows[0].name}: ${plugin.rows[0].creator_id}`);
    console.log('\n📋 Cart Test should now appear in My Plugins!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCreator();
