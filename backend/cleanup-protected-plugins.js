// Clean up duplicates from protected plugins
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PROTECTED_PLUGINS = [
  'eea24e22-7bc7-457e-8403-df53758ebf76',
  'c80b7d37-b985-4ead-be17-b265938753ab'
];

async function cleanupProtectedPlugins() {
  try {
    console.log('🧹 Cleaning up duplicates from protected plugins\n');

    for (const pluginId of PROTECTED_PLUGINS) {
      // Get plugin name
      const plugin = await sequelize.query(`
        SELECT name FROM plugin_registry WHERE id = $1
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      if (plugin.length === 0) {
        console.log(`⚠️  Plugin ${pluginId} not found\n`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Plugin: ${plugin[0].name} (${pluginId})`);
      console.log('='.repeat(60));

      let totalCleaned = 0;

      // 1. Remove entity files from plugin_scripts (they belong in plugin_entities)
      console.log('\n1️⃣ Removing entity files from plugin_scripts...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'entities/%'
        `, {
          bind: [pluginId],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} entity file(s)`);
        totalCleaned += count;
      } catch (err) {
        console.log(`   ❌ Error:`, err.message);
      }

      // 2. Remove controller files from plugin_scripts
      console.log('2️⃣ Removing controller files from plugin_scripts...');
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name LIKE 'controllers/%'
        `, {
          bind: [pluginId],
          type: sequelize.QueryTypes.DELETE
        });
        const count = result[1] || 0;
        console.log(`   ✅ Deleted ${count} controller file(s)`);
        totalCleaned += count;
      } catch (err) {
        console.log(`   ❌ Error:`, err.message);
      }

      // 3. Move README.md from plugin_scripts to plugin_docs
      console.log('3️⃣ Moving README.md to plugin_docs...');
      try {
        // Get README from plugin_scripts
        const readme = await sequelize.query(`
          SELECT file_content FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name = 'README.md'
        `, {
          bind: [pluginId],
          type: sequelize.QueryTypes.SELECT
        });

        if (readme.length > 0) {
          // Insert into plugin_docs
          await sequelize.query(`
            INSERT INTO plugin_docs (plugin_id, doc_type, file_name, content, format, is_visible)
            VALUES ($1, 'readme', 'README.md', $2, 'markdown', true)
            ON CONFLICT (plugin_id, doc_type) DO UPDATE
            SET content = EXCLUDED.content, updated_at = NOW()
          `, {
            bind: [pluginId, readme[0].file_content]
          });

          // Delete from plugin_scripts
          await sequelize.query(`
            DELETE FROM plugin_scripts
            WHERE plugin_id = $1 AND file_name = 'README.md'
          `, {
            bind: [pluginId]
          });

          console.log(`   ✅ Moved README.md to plugin_docs`);
          totalCleaned++;
        } else {
          console.log(`   ℹ️  No README.md found`);
        }
      } catch (err) {
        console.log(`   ❌ Error:`, err.message);
      }

      // 4. Move manifest.json from plugin_scripts to plugin_docs (if exists)
      console.log('4️⃣ Moving manifest.json to plugin_docs...');
      try {
        const manifest = await sequelize.query(`
          SELECT file_content FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name = 'manifest.json'
        `, {
          bind: [pluginId],
          type: sequelize.QueryTypes.SELECT
        });

        if (manifest.length > 0) {
          await sequelize.query(`
            INSERT INTO plugin_docs (plugin_id, doc_type, file_name, content, format, is_visible)
            VALUES ($1, 'manifest', 'manifest.json', $2, 'json', true)
            ON CONFLICT (plugin_id, doc_type) DO UPDATE
            SET content = EXCLUDED.content, updated_at = NOW()
          `, {
            bind: [pluginId, manifest[0].file_content]
          });

          await sequelize.query(`
            DELETE FROM plugin_scripts
            WHERE plugin_id = $1 AND file_name = 'manifest.json'
          `, {
            bind: [pluginId]
          });

          console.log(`   ✅ Moved manifest.json to plugin_docs`);
          totalCleaned++;
        } else {
          console.log(`   ℹ️  No manifest.json found`);
        }
      } catch (err) {
        console.log(`   ❌ Error:`, err.message);
      }

      console.log(`\n📊 Total items cleaned: ${totalCleaned}`);

      // Show final state
      const remaining = await sequelize.query(`
        SELECT file_name FROM plugin_scripts
        WHERE plugin_id = $1
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      console.log(`\n✅ Remaining in plugin_scripts (${remaining.length} files):`);
      remaining.forEach(f => console.log(`   - ${f.file_name}`));
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ Protected plugins cleaned up successfully!');
    console.log('='.repeat(60));
    console.log('\n✨ Clean Architecture Applied:');
    console.log('   plugin_scripts: Components, utils, services, styles ONLY');
    console.log('   plugin_docs: README.md, manifest.json');
    console.log('   plugin_entities: Entity schemas');
    console.log('   plugin_controllers: API endpoints');
    console.log('   plugin_events: Event listeners');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanupProtectedPlugins();
