// Find all broken hooks across ALL plugins
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function findBrokenHooks() {
  try {
    console.log('🔍 Searching for broken hooks across ALL plugins...\n');

    // Get ALL hooks from ALL plugins
    const hooks = await sequelize.query(`
      SELECT
        ph.hook_name,
        ph.plugin_id,
        pr.name as plugin_name,
        ph.is_enabled,
        LENGTH(ph.handler_function) as code_length,
        ph.handler_function
      FROM plugin_hooks ph
      LEFT JOIN plugin_registry pr ON ph.plugin_id::uuid = pr.id
      ORDER BY pr.name, ph.hook_name
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} total hooks across all plugins\n`);

    const brokenHooks = [];
    const validHooks = [];

    for (const hook of hooks) {
      const code = (hook.handler_function || '').trim();

      // Check if it's obviously broken
      if (!code || code === '' || code === '// test') {
        console.log(`❌ BROKEN: ${hook.plugin_name} → ${hook.hook_name}`);
        console.log(`   Plugin ID: ${hook.plugin_id}`);
        console.log(`   Code: "${code}"`);
        console.log(`   Issue: Empty or test code\n`);
        brokenHooks.push(hook);
        continue;
      }

      // Try to validate syntax
      try {
        eval(`(${code})`);
        console.log(`✅ Valid: ${hook.plugin_name} → ${hook.hook_name}`);
        validHooks.push(hook);
      } catch (error) {
        console.log(`❌ BROKEN: ${hook.plugin_name} → ${hook.hook_name}`);
        console.log(`   Plugin ID: ${hook.plugin_id}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Code preview: ${code.substring(0, 100)}...\n`);
        brokenHooks.push(hook);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Summary:`);
    console.log(`  ✅ Valid hooks: ${validHooks.length}`);
    console.log(`  ❌ Broken hooks: ${brokenHooks.length}\n`);

    if (brokenHooks.length > 0) {
      console.log('🔧 Fixing broken hooks...\n');

      for (const hook of brokenHooks) {
        console.log(`Deleting broken hook: ${hook.hook_name} from ${hook.plugin_name}`);

        await sequelize.query(`
          DELETE FROM plugin_hooks
          WHERE plugin_id = $1 AND hook_name = $2
        `, {
          bind: [hook.plugin_id, hook.hook_name],
          type: sequelize.QueryTypes.DELETE
        });

        console.log(`   ✅ Deleted\n`);
      }

      console.log('✅ All broken hooks removed!');
      console.log('\n🔄 Now refresh your browser to reload plugins.');
    } else {
      console.log('✅ No broken hooks found!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

findBrokenHooks();
