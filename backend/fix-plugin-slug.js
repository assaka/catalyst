/**
 * Fix undefined slug for My Cart Alert plugin
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

async function fixPluginSlug() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Fixing plugin slug...\n');

    // Check current state
    const before = await client.query(`
      SELECT id, name, slug FROM plugin_registry WHERE id = $1
    `, [pluginId]);

    console.log('BEFORE:');
    console.log('  Name:', before.rows[0].name);
    console.log('  Slug:', before.rows[0].slug);

    // Set slug to 'my-cart-alert'
    await client.query(`
      UPDATE plugin_registry
      SET slug = $1, updated_at = NOW()
      WHERE id = $2
    `, ['my-cart-alert', pluginId]);

    // Verify
    const after = await client.query(`
      SELECT id, name, slug FROM plugin_registry WHERE id = $1
    `, [pluginId]);

    console.log('\nAFTER:');
    console.log('  Name:', after.rows[0].name);
    console.log('  Slug:', after.rows[0].slug);

    console.log('\n✅ Slug updated successfully!');
    console.log('\n🌐 Now visit:');
    console.log('   http://localhost:5179/admin/plugins/my-cart-alert/emails');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPluginSlug();
