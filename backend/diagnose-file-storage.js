// Diagnose where files are actually stored for a plugin
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = process.argv[2] || 'eea24e22-7bc7-457e-8403-df53758ebf76';

async function diagnose() {
  try {
    console.log(`🔍 Diagnosing file storage for plugin: ${PLUGIN_ID}\n`);

    // Check plugin_scripts
    console.log('📄 plugin_scripts table:');
    try {
      const scripts = await sequelize.query(`
        SELECT file_name, scope FROM plugin_scripts
        WHERE plugin_id = $1
      `, {
        bind: [PLUGIN_ID],
        type: sequelize.QueryTypes.SELECT
      });
      console.log(`   Found ${scripts.length} files`);
      scripts.forEach(s => console.log(`   - ${s.file_name} (${s.scope})`));
    } catch (err) {
      console.log(`   ❌ Error:`, err.message);
    }

    // Check plugin_events
    console.log('\n⚡ plugin_events table:');
    try {
      const events = await sequelize.query(`
        SELECT file_name, event_name FROM plugin_events
        WHERE plugin_id = $1
      `, {
        bind: [PLUGIN_ID],
        type: sequelize.QueryTypes.SELECT
      });
      console.log(`   Found ${events.length} files`);
      events.forEach(e => console.log(`   - ${e.file_name} (${e.event_name})`));
    } catch (err) {
      console.log(`   ❌ Error:`, err.message);
    }

    // Check plugin_entities
    console.log('\n🗄️  plugin_entities table:');
    try {
      const entities = await sequelize.query(`
        SELECT entity_name, table_name FROM plugin_entities
        WHERE plugin_id = $1
      `, {
        bind: [PLUGIN_ID],
        type: sequelize.QueryTypes.SELECT
      });
      console.log(`   Found ${entities.length} files`);
      entities.forEach(e => console.log(`   - ${e.entity_name} (${e.table_name})`));
    } catch (err) {
      console.log(`   ❌ Error:`, err.message);
    }

    // Check plugin_controllers
    console.log('\n🎮 plugin_controllers table:');
    try {
      const controllers = await sequelize.query(`
        SELECT controller_name, method, path FROM plugin_controllers
        WHERE plugin_id = $1
      `, {
        bind: [PLUGIN_ID],
        type: sequelize.QueryTypes.SELECT
      });
      console.log(`   Found ${controllers.length} files`);
      controllers.forEach(c => console.log(`   - ${c.controller_name} (${c.method} ${c.path})`));
    } catch (err) {
      console.log(`   ❌ Error:`, err.message);
    }

    // Check manifest only (source_code column dropped)
    console.log('\n📦 plugin_registry.manifest (metadata only):');
    const plugin = await sequelize.query(`
      SELECT manifest FROM plugin_registry WHERE id = $1
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    if (plugin.length > 0) {
      const manifest = plugin[0].manifest || {};

      if (manifest.generatedFiles) {
        console.log(`   ⚠️ manifest.generatedFiles: ${manifest.generatedFiles.length} files (IGNORED BY NEW CODE)`);
        console.log(`   👉 These files will NOT appear in FileTree with new code`);
      } else {
        console.log(`   ✅ No old JSON file data`);
      }
    }

    console.log('\n✅ Diagnosis complete!\n');
    console.log('Summary:');
    console.log('- Files in normalized tables will appear in FileTree');
    console.log('- Files in JSON fields will be IGNORED');
    console.log('- Delete operations only affect normalized tables');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnose();
