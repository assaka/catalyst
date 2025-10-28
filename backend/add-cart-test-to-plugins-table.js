/**
 * Add Cart Test to plugins table (for current deployed backend)
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
    console.log('🔧 Adding Cart Test to plugins table...\n');

    const pluginId = 'b811f37d-f09c-4eb6-a813-eaf0f7324a14';

    // Get plugin from plugin_registry
    const registryPlugin = await client.query(`
      SELECT * FROM plugin_registry WHERE id = $1
    `, [pluginId]);

    if (registryPlugin.rows.length === 0) {
      console.log('❌ Cart Test not found in plugin_registry!');
      return;
    }

    const plugin = registryPlugin.rows[0];
    console.log(`✅ Found in plugin_registry: ${plugin.name}`);

    // Add to plugins table
    await client.query(`
      INSERT INTO plugins (
        id, name, slug, version, description, author, category, type,
        status, is_installed, is_enabled, creator_id,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          status = EXCLUDED.status,
          is_enabled = EXCLUDED.is_enabled
    `, [
      plugin.id,
      plugin.name,
      plugin.slug,
      plugin.version,
      plugin.description,
      plugin.author,
      plugin.category,
      plugin.type,
      plugin.status,
      plugin.is_installed,
      plugin.is_enabled,
      plugin.creator_id
    ]);

    console.log('✅ Added to plugins table');
    console.log('\n📋 Cart Test should now appear in My Plugins!');
    console.log('   (After Render deploys new code, only plugin_registry will be used)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addToPluginsTable();
