/**
 * Add Cart Alert plugin to the plugins table (for My Plugins page)
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

async function addToPluginsTable() {
  const client = await pool.connect();

  try {
    console.log('🔧 Adding Cart Alert to plugins table...\n');

    // Get the plugin from plugin_registry
    const registryPlugin = await client.query(`
      SELECT id, name, version, description, category, author
      FROM plugin_registry
      WHERE name = 'Cart Alert'
    `);

    if (registryPlugin.rows.length === 0) {
      console.log('❌ Cart Alert not found in plugin_registry!');
      return;
    }

    const registryId = registryPlugin.rows[0].id;
    console.log(`✅ Found in plugin_registry: ${registryId}`);

    // Get current user (for creator_id)
    const users = await client.query(`SELECT id FROM users LIMIT 1`);
    const creatorId = users.rows[0]?.id;

    console.log(`📋 Using creator_id: ${creatorId}\n`);

    // Insert into plugins table
    const pluginId = registryId; // Use same UUID

    await client.query(`
      INSERT INTO plugins (
        id, name, slug, version, description, author, category, type,
        status, is_installed, is_enabled, creator_id,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          updated_at = NOW()
    `, [
      pluginId,
      'Cart Alert',
      'cart-alert',
      '1.0.0',
      'Shows an alert when you visit the cart page',
      'System',
      'utility',
      'utility',
      'active',
      true,
      true,
      creatorId
    ]);

    console.log('✅ Added to plugins table');
    console.log('\n📋 Verification:');

    const verification = await client.query(`
      SELECT id, name, status, creator_id
      FROM plugins
      WHERE id = $1
    `, [pluginId]);

    if (verification.rows.length > 0) {
      const p = verification.rows[0];
      console.log(`  ✅ ${p.name} - ${p.status} - creator: ${p.creator_id}`);
      console.log('\n✅ Cart Alert should now appear in My Plugins!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addToPluginsTable();
