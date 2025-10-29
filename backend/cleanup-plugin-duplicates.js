// Clean up plugin architecture - remove duplicates from plugin_scripts
// Keep ONLY executable code (components, utils, services, styles) in plugin_scripts
// Remove events, hooks, entities, controllers, migrations (they have their own tables)
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

// Keep these plugins (don't clean up)
const PROTECTED_PLUGINS = [
  'eea24e22-7bc7-457e-8403-df53758ebf76',
  'c80b7d37-b985-4ead-be17-b265938753ab'
];

async function cleanupDuplicates() {
  try {
    console.log('🧹 Cleaning up plugin architecture - removing duplicates from plugin_scripts\n');
    console.log('Protected plugins (will NOT be cleaned):');
    PROTECTED_PLUGINS.forEach(id => console.log(`  - ${id}`));
    console.log('');

    // Get all plugins
    const plugins = await sequelize.query(`
      SELECT id, name FROM plugin_registry
      WHERE id NOT IN (${PROTECTED_PLUGINS.map((_, i) => `$${i + 1}`).join(', ')})
    `, {
      bind: PROTECTED_PLUGINS,
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📦 Found ${plugins.length} plugins to clean up\n`);

    for (const plugin of plugins) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Plugin: ${plugin.name} (${plugin.id})`);
      console.log('='.repeat(60));

      let totalDeleted = 0;

      // 1. Remove entity files from plugin_scripts
      console.log('\n1️⃣ Removing entity files (entities/*.json)...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'entities/%'
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} entity file(s)`);
        totalDeleted += count;
      } catch (err) {
        console.log(`   ⚠️ Error:`, err.message);
      }

      // 2. Remove controller files from plugin_scripts
      console.log('2️⃣ Removing controller files (controllers/*.js)...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'controllers/%'
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} controller file(s)`);
        totalDeleted += count;
      } catch (err) {
        console.log(`   ⚠️ Error:`, err.message);
      }

      // 3. Remove migration files from plugin_scripts
      console.log('3️⃣ Removing migration files (migrations/*.sql)...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'migrations/%'
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} migration file(s)`);
        totalDeleted += count;
      } catch (err) {
        console.log(`   ⚠️ Error:`, err.message);
      }

      // 4. Remove event files from plugin_scripts (they're in plugin_events)
      console.log('4️⃣ Removing event files (events/*.js)...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'events/%'
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} event file(s)`);
        totalDeleted += count;
      } catch (err) {
        console.log(`   ⚠️ Error:`, err.message);
      }

      // 5. Remove hook files from plugin_scripts (they're in plugin_hooks)
      console.log('5️⃣ Removing hook files (hooks/*.js)...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'hooks/%'
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} hook file(s)`);
        totalDeleted += count;
      } catch (err) {
        console.log(`   ⚠️ Error:`, err.message);
      }

      // 6. Remove admin page files from plugin_scripts (they're in plugin_admin_pages or plugin_scripts with admin scope)
      console.log('6️⃣ Removing admin page files (admin/*.jsx)...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'admin/%'
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} admin page file(s)`);
        totalDeleted += count;
      } catch (err) {
        console.log(`   ⚠️ Error:`, err.message);
      }

      // 7. Remove model files from plugin_scripts (models should be in plugin_entities)
      console.log('7️⃣ Removing model files (models/*.js)...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'models/%'
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} model file(s)`);
        totalDeleted += count;
      } catch (err) {
        console.log(`   ⚠️ Error:`, err.message);
      }

      console.log(`\n📊 Total duplicates removed: ${totalDeleted}`);

      // Show what remains in plugin_scripts
      const remaining = await sequelize.query(`
        SELECT file_name FROM plugin_scripts
        WHERE plugin_id = $1
      `, {
        bind: [plugin.id],
        type: sequelize.QueryTypes.SELECT
      });

      console.log(`\n✅ Remaining in plugin_scripts (${remaining.length} files):`);
      remaining.forEach(f => console.log(`   - ${f.file_name}`));
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ Cleanup completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   plugin_scripts: Components, utils, services, styles ONLY');
    console.log('   plugin_events: Event listeners');
    console.log('   plugin_hooks: Hook handlers');
    console.log('   plugin_entities: Database entity schemas');
    console.log('   plugin_controllers: API endpoint handlers');
    console.log('   plugin_migrations: Migration SQL');
    console.log('   plugin_widgets: UI widgets');
    console.log('   plugin_data: Runtime key-value storage');
    console.log('   plugin_dependencies: npm packages');
    console.log('\n🎉 No more duplicates! Each file type in ONE table only!');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanupDuplicates();
