// Delete broken hooks with invalid plugin_id
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function deleteBrokenHooks() {
  try {
    console.log('🔍 Finding hooks with invalid plugin_id...\n');

    // Find all hooks first (without the join that breaks)
    const allHooks = await sequelize.query(`
      SELECT plugin_id, hook_name,
             LENGTH(handler_function) as code_length,
             SUBSTRING(handler_function, 1, 100) as preview
      FROM plugin_hooks
      ORDER BY plugin_id
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${allHooks.length} total hooks\n`);

    const validUUIDs = [];
    const invalidHooks = [];

    allHooks.forEach(hook => {
      // Check if plugin_id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(hook.plugin_id)) {
        validUUIDs.push(hook);
        console.log(`✅ ${hook.plugin_id.substring(0, 8)}... → ${hook.hook_name}`);
      } else {
        invalidHooks.push(hook);
        console.log(`❌ "${hook.plugin_id}" → ${hook.hook_name}`);
        console.log(`   Code: ${hook.preview}...`);
        console.log(`   Length: ${hook.code_length} chars\n`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Summary:`);
    console.log(`  ✅ Valid hooks: ${validUUIDs.length}`);
    console.log(`  ❌ Invalid hooks: ${invalidHooks.length}\n`);

    if (invalidHooks.length > 0) {
      console.log('🗑️  Deleting invalid hooks...\n');

      for (const hook of invalidHooks) {
        console.log(`Deleting: "${hook.plugin_id}" → ${hook.hook_name}`);

        await sequelize.query(`
          DELETE FROM plugin_hooks
          WHERE plugin_id = $1 AND hook_name = $2
        `, {
          bind: [hook.plugin_id, hook.hook_name],
          type: sequelize.QueryTypes.DELETE
        });

        console.log(`   ✅ Deleted\n`);
      }

      console.log('✅ All invalid hooks removed!');
      console.log('\n🔄 Refresh your browser to reload plugins.');
    } else {
      console.log('✅ No invalid hooks found!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

deleteBrokenHooks();
