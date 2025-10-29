// Delete all plugins EXCEPT the protected ones
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

// Keep ONLY these plugins
const PROTECTED_PLUGINS = [
  'eea24e22-7bc7-457e-8403-df53758ebf76',
  'c80b7d37-b985-4ead-be17-b265938753ab'
];

async function deleteAllExceptProtected() {
  try {
    console.log('🗑️  DELETING ALL PLUGINS EXCEPT PROTECTED ONES\n');
    console.log('⚠️  WARNING: This will permanently delete plugins and all their data!\n');

    console.log('Protected plugins (will be KEPT):');

    // Get protected plugin names
    for (const id of PROTECTED_PLUGINS) {
      const plugin = await sequelize.query(`
        SELECT name FROM plugin_registry WHERE id = $1
      `, {
        bind: [id],
        type: sequelize.QueryTypes.SELECT
      });
      if (plugin.length > 0) {
        console.log(`  ✅ ${plugin[0].name} (${id})`);
      } else {
        console.log(`  ⚠️  Plugin ${id} not found`);
      }
    }

    console.log('\n📊 Plugins to be DELETED:\n');

    // Get all plugins except protected ones
    const pluginsToDelete = await sequelize.query(`
      SELECT id, name FROM plugin_registry
      WHERE id NOT IN (${PROTECTED_PLUGINS.map((_, i) => `$${i + 1}`).join(', ')})
    `, {
      bind: PROTECTED_PLUGINS,
      type: sequelize.QueryTypes.SELECT
    });

    if (pluginsToDelete.length === 0) {
      console.log('✅ No plugins to delete. Only protected plugins exist.\n');
      await sequelize.close();
      return;
    }

    console.log(`Found ${pluginsToDelete.length} plugins to delete:\n`);
    pluginsToDelete.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.name} (${p.id})`);
    });

    console.log('\n⏳ Deleting in 3 seconds... (Ctrl+C to cancel)\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all non-protected plugins
    // CASCADE will automatically delete from all related tables:
    // - plugin_scripts
    // - plugin_events
    // - plugin_hooks
    // - plugin_entities
    // - plugin_controllers
    // - plugin_migrations
    // - plugin_docs
    // - plugin_data
    // - plugin_dependencies
    // - plugin_widgets

    const result = await sequelize.query(`
      DELETE FROM plugin_registry
      WHERE id NOT IN (${PROTECTED_PLUGINS.map((_, i) => `$${i + 1}`).join(', ')})
    `, {
      bind: PROTECTED_PLUGINS,
      type: sequelize.QueryTypes.DELETE
    });

    const deletedCount = result[1];

    console.log(`\n✅ Deleted ${deletedCount} plugins successfully!\n`);

    // Verify only protected plugins remain
    const remaining = await sequelize.query(`
      SELECT id, name FROM plugin_registry
      ORDER BY name
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📊 Remaining plugins (${remaining.length}):\n`);
    remaining.forEach(p => {
      const isProtected = PROTECTED_PLUGINS.includes(p.id);
      console.log(`  ${isProtected ? '🔒' : '  '} ${p.name} (${p.id})`);
    });

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n✨ Clean Architecture:');
    console.log('   - Only protected plugins remain');
    console.log('   - All related data cleaned up (CASCADE)');
    console.log('   - Database is now clean and optimized');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

deleteAllExceptProtected();
