/**
 * Clean up plugin_registry manifest column
 * Remove code (generatedFiles, models, controllers, components)
 * Keep only metadata (UI config, database schema, settings, etc.)
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

async function cleanManifests() {
  const client = await pool.connect();

  try {
    console.log('🧹 Cleaning plugin manifests...\n');

    // Get all plugins
    const result = await client.query('SELECT id, name, manifest FROM plugin_registry');

    for (const plugin of result.rows) {
      const manifest = plugin.manifest || {};

      console.log(`📦 Cleaning: ${plugin.name}`);

      // Build clean manifest with ONLY metadata
      const cleanManifest = {
        name: manifest.name || plugin.name,
        version: manifest.version || '1.0.0',
        author: manifest.author || 'System',
        description: manifest.description || '',
        slug: manifest.slug || plugin.id,
        mode: manifest.mode || 'custom',
        category: manifest.category || 'utility',

        // Keep UI configuration (no code)
        ui: manifest.ui || { pages: [], widgets: [] },

        // Keep database schema (structure only, no code)
        database: manifest.database || { tables: [] },

        // Keep settings schema
        settings: manifest.settings || {},

        // Keep features list
        features: manifest.features || []
      };

      // Remove ALL code-related fields
      delete cleanManifest.generatedFiles;
      delete cleanManifest.generatedCode;
      delete cleanManifest.source_code;
      delete cleanManifest.models;
      delete cleanManifest.controllers;
      delete cleanManifest.components;
      delete cleanManifest.hooks;
      delete cleanManifest.events;
      delete cleanManifest.endpoints;

      // Update in database
      await client.query(
        'UPDATE plugin_registry SET manifest = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(cleanManifest), plugin.id]
      );

      console.log(`  ✅ Cleaned manifest for ${plugin.name}`);
    }

    console.log('\n✅ All manifests cleaned!');

    // Show clean manifests
    console.log('\n📋 Final manifests (metadata only):');
    const finalResult = await client.query('SELECT id, name, manifest FROM plugin_registry');
    finalResult.rows.forEach(p => {
      console.log(`\n${p.name}:`);
      console.log(JSON.stringify(p.manifest, null, 2));
    });

  } catch (error) {
    console.error('❌ Error cleaning manifests:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanManifests()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
