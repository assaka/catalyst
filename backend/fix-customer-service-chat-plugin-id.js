// Fix customer-service-chat plugin_id from slug to UUID
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const OLD_PLUGIN_ID = 'customer-service-chat';
const NEW_PLUGIN_ID = 'c80b7d37-b985-4ead-be17-b265938753ab';

async function fixPluginId() {
  try {
    console.log('🔧 Fixing customer-service-chat plugin_id...\n');
    console.log(`   From: "${OLD_PLUGIN_ID}"`);
    console.log(`   To:   ${NEW_PLUGIN_ID}\n`);

    // Check what hooks exist
    const hooks = await sequelize.query(`
      SELECT hook_name,
             LENGTH(handler_function) as code_length,
             SUBSTRING(handler_function, 1, 100) as preview
      FROM plugin_hooks
      WHERE plugin_id = $1
    `, {
      bind: [OLD_PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} hook(s) to update:\n`);

    hooks.forEach(hook => {
      console.log(`  - ${hook.hook_name}`);
      console.log(`    Code: ${hook.code_length} chars`);
      console.log(`    Preview: ${hook.preview}...`);
      console.log('');
    });

    if (hooks.length === 0) {
      console.log('ℹ️  No hooks found with old plugin_id. Nothing to update.');
      return;
    }

    // Update plugin_id
    const result = await sequelize.query(`
      UPDATE plugin_hooks
      SET plugin_id = $1
      WHERE plugin_id = $2
    `, {
      bind: [NEW_PLUGIN_ID, OLD_PLUGIN_ID],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log(`✅ Updated ${result[1]} hook(s) successfully!`);
    console.log(`\n🔍 Verifying update...`);

    // Verify
    const updated = await sequelize.query(`
      SELECT hook_name, plugin_id
      FROM plugin_hooks
      WHERE plugin_id = $1
    `, {
      bind: [NEW_PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`\n✅ Plugin ${NEW_PLUGIN_ID} now has ${updated.length} hook(s):`);
    updated.forEach(h => {
      console.log(`  - ${h.hook_name}`);
    });

    console.log('\n🔄 Refresh your browser to reload plugins!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixPluginId();
