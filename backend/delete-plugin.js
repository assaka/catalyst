/**
 * Safely delete a single plugin
 * Usage: node delete-plugin.js <plugin-slug>
 * Example: node delete-plugin.js cart-hamid
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

async function deletePlugin() {
  const pluginSlug = process.argv[2];

  if (!pluginSlug) {
    console.error('❌ Usage: node delete-plugin.js <plugin-slug>');
    console.error('   Example: node delete-plugin.js cart-hamid');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    console.log(`🔍 Looking for plugin: ${pluginSlug}`);

    // Find the plugin
    const plugin = await client.query(`
      SELECT id, name, slug, version FROM plugin_registry
      WHERE slug = $1
    `, [pluginSlug]);

    if (plugin.rows.length === 0) {
      console.error(`❌ Plugin not found: ${pluginSlug}`);
      process.exit(1);
    }

    const pluginData = plugin.rows[0];
    console.log(`\n📦 Found plugin:`);
    console.log(`   Name: ${pluginData.name}`);
    console.log(`   Slug: ${pluginData.slug}`);
    console.log(`   Version: ${pluginData.version}`);
    console.log(`   ID: ${pluginData.id}`);

    // Count related data
    const events = await client.query('SELECT COUNT(*) FROM plugin_events WHERE plugin_id = $1', [pluginData.id]);
    const hooks = await client.query('SELECT COUNT(*) FROM plugin_hooks WHERE plugin_id = $1', [pluginData.id]);
    const scripts = await client.query('SELECT COUNT(*) FROM plugin_scripts WHERE plugin_id = $1', [pluginData.id]);
    const entities = await client.query('SELECT COUNT(*) FROM plugin_entities WHERE plugin_id = $1', [pluginData.id]);
    const controllers = await client.query('SELECT COUNT(*) FROM plugin_controllers WHERE plugin_id = $1', [pluginData.id]);

    console.log(`\n📊 This will also delete:`);
    console.log(`   - ${events.rows[0].count} events`);
    console.log(`   - ${hooks.rows[0].count} hooks`);
    console.log(`   - ${scripts.rows[0].count} scripts`);
    console.log(`   - ${entities.rows[0].count} entities`);
    console.log(`   - ${controllers.rows[0].count} controllers`);

    console.log(`\n⚠️  WARNING: This action cannot be undone!`);
    console.log(`\n🗑️  Deleting plugin in 3 seconds... Press Ctrl+C to cancel`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete the plugin (CASCADE will handle related tables)
    await client.query(`
      DELETE FROM plugin_registry
      WHERE id = $1
    `, [pluginData.id]);

    console.log(`\n✅ Plugin deleted successfully!`);
    console.log(`   All related data has been removed from:`);
    console.log(`   - plugin_events`);
    console.log(`   - plugin_hooks`);
    console.log(`   - plugin_scripts`);
    console.log(`   - plugin_entities`);
    console.log(`   - plugin_controllers`);
    console.log(`   - plugin_migrations`);
    console.log(`   - plugin_docs`);
    console.log(`   - plugin_admin_pages`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

deletePlugin();
