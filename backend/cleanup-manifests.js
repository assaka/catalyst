// Clean up plugin_registry.manifest - remove all file data and obsolete fields
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

// Keep ONLY these plugins (or clean all if empty)
const PROTECTED_PLUGINS = [
  'eea24e22-7bc7-457e-8403-df53758ebf76',
  'c80b7d37-b985-4ead-be17-b265938753ab'
];

async function cleanupManifests() {
  try {
    console.log('🧹 Cleaning up plugin_registry.manifest fields\n');
    console.log('Removing obsolete data that now lives in normalized tables...\n');

    // Get all plugins (or just protected ones)
    const plugins = await sequelize.query(`
      SELECT id, name, manifest FROM plugin_registry
      WHERE id IN (${PROTECTED_PLUGINS.map((_, i) => `$${i + 1}`).join(', ')})
    `, {
      bind: PROTECTED_PLUGINS,
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📦 Processing ${plugins.length} plugin(s)\n`);

    for (const plugin of plugins) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Plugin: ${plugin.name} (${plugin.id})`);
      console.log('='.repeat(60));

      const manifest = plugin.manifest || {};

      console.log('\n📋 Current manifest keys:', Object.keys(manifest));

      // Fields to REMOVE (obsolete - data in normalized tables)
      const obsoleteFields = [
        'generatedFiles',      // → plugin_scripts/events/entities/etc
        'files',               // → plugin_scripts
        'source_code',         // → plugin_scripts
        'hooks',               // → plugin_hooks
        'events',              // → plugin_events
        'eventListeners',      // → plugin_events
        'widgets',             // → plugin_widgets
        'controllers',         // → plugin_controllers
        'models',              // → plugin_entities
        'entities',            // → plugin_entities
        'migrations',          // → plugin_migrations
        'adminPages',          // → plugin_admin_pages or plugin_scripts
        'readme',              // → plugin_docs
        'dependencies',        // → plugin_dependencies
        'scripts',             // → plugin_scripts
        'routes',              // → plugin_controllers
        'api',                 // → plugin_controllers
        'database',            // → plugin_entities
        'compiled_code',       // → Obsolete
        'bundle',              // → Obsolete
        'generated_by_ai',     // → Move to plugin_registry column
      ];

      // Fields to KEEP (actual metadata)
      const keepFields = [
        'name',
        'version',
        'description',
        'author',
        'category',
        'icon',
        'tags',
        'adminNavigation',
        'permissions',
        'capabilities',
        'settings',
        'config',
        'homepage',
        'repository',
        'bugs',
        'keywords',
        'license'
      ];

      // Count what will be removed
      const keysToRemove = Object.keys(manifest).filter(key =>
        obsoleteFields.includes(key) || !keepFields.includes(key)
      );

      console.log('\n🗑️  Removing obsolete fields:');
      keysToRemove.forEach(key => {
        const valueType = Array.isArray(manifest[key]) ? 'array' : typeof manifest[key];
        const count = Array.isArray(manifest[key]) ? manifest[key].length : '';
        console.log(`   - ${key} (${valueType}${count ? ` - ${count} items` : ''})`);
      });

      // Create clean manifest with only metadata
      const cleanManifest = {};
      keepFields.forEach(key => {
        if (manifest[key] !== undefined) {
          cleanManifest[key] = manifest[key];
        }
      });

      console.log('\n✅ Keeping metadata fields:');
      Object.keys(cleanManifest).forEach(key => {
        console.log(`   - ${key}`);
      });

      // Update manifest
      await sequelize.query(`
        UPDATE plugin_registry
        SET manifest = $1, updated_at = NOW()
        WHERE id = $2
      `, {
        bind: [JSON.stringify(cleanManifest), plugin.id]
      });

      console.log(`\n✅ Manifest cleaned (${Object.keys(manifest).length} → ${Object.keys(cleanManifest).length} fields)`);
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ All manifests cleaned successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Manifest now contains ONLY:');
    console.log('   - Plugin metadata (name, version, author, etc.)');
    console.log('   - UI configuration (adminNavigation, icons)');
    console.log('   - Permissions and capabilities');
    console.log('   - Settings and config');
    console.log('\n❌ Manifest NO LONGER contains:');
    console.log('   - Files (→ plugin_scripts)');
    console.log('   - Events (→ plugin_events)');
    console.log('   - Hooks (→ plugin_hooks)');
    console.log('   - Entities (→ plugin_entities)');
    console.log('   - Controllers (→ plugin_controllers)');
    console.log('   - Migrations (→ plugin_migrations)');
    console.log('   - README (→ plugin_docs)');
    console.log('\n🎉 Clean architecture achieved!');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanupManifests();
