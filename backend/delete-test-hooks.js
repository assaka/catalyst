// Delete broken test hooks
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function deleteTestHooks() {
  try {
    console.log('🔍 Finding broken test hooks...\n');

    // Find all hooks
    const hooks = await sequelize.query(`
      SELECT plugin_id, hook_name, handler_function
      FROM plugin_hooks
      ORDER BY plugin_id
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} total hooks\n`);

    const brokenHooks = [];

    for (const hook of hooks) {
      const code = (hook.handler_function || '').trim();

      // Check if it's a test/empty hook
      if (code.startsWith('// test') || code === '' || code.length < 20) {
        console.log(`❌ BROKEN: ${hook.hook_name}`);
        console.log(`   Plugin: ${hook.plugin_id}`);
        console.log(`   Code: "${code}"`);
        console.log('');
        brokenHooks.push(hook);
        continue;
      }

      // Try to validate syntax
      try {
        eval(`(${code})`);
      } catch (error) {
        console.log(`❌ BROKEN: ${hook.hook_name}`);
        console.log(`   Plugin: ${hook.plugin_id}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Code preview: ${code.substring(0, 100)}`);
        console.log('');
        brokenHooks.push(hook);
      }
    }

    if (brokenHooks.length === 0) {
      console.log('✅ No broken hooks found!');
      return;
    }

    console.log(`\n🗑️  Deleting ${brokenHooks.length} broken hook(s)...\n`);

    for (const hook of brokenHooks) {
      console.log(`Deleting: ${hook.hook_name} from plugin ${hook.plugin_id}`);

      await sequelize.query(`
        DELETE FROM plugin_hooks
        WHERE plugin_id = $1 AND hook_name = $2
      `, {
        bind: [hook.plugin_id, hook.hook_name],
        type: sequelize.QueryTypes.DELETE
      });

      console.log(`   ✅ Deleted\n`);
    }

    console.log('✅ All broken hooks deleted!');
    console.log('\n🔄 Refresh your browser to reload plugins.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

deleteTestHooks();
