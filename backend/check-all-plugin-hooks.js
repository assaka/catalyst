// Check ALL hooks for the plugin (not just enabled ones)
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function checkAllHooks() {
  try {
    console.log('🔍 Checking ALL hooks (including disabled)...\n');

    const hooks = await sequelize.query(`
      SELECT hook_name, is_enabled, priority,
             LENGTH(handler_function) as code_length,
             SUBSTRING(handler_function, 1, 100) as preview
      FROM plugin_hooks
      WHERE plugin_id = $1
      ORDER BY hook_name
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} total hook(s):\n`);

    hooks.forEach((hook, i) => {
      console.log(`${i + 1}. ${hook.hook_name}`);
      console.log(`   Enabled: ${hook.is_enabled}`);
      console.log(`   Priority: ${hook.priority}`);
      console.log(`   Code: ${hook.code_length} chars`);
      console.log(`   Preview: ${hook.preview}...`);
      console.log('');

      if (!hook.is_enabled) {
        console.log('   ⚠️  This hook is DISABLED and won\'t load!');
        console.log('');
      }

      // Check for suspicious content
      if (hook.preview.includes('// test')) {
        console.log('   ⚠️  WARNING: Contains "// test" - might be a test hook!');
        console.log('');
      }
    });

    // Also check for hooks with syntax errors
    console.log('🔍 Validating syntax for all hooks...\n');

    for (const hook of hooks) {
      const fullHook = await sequelize.query(`
        SELECT handler_function FROM plugin_hooks
        WHERE plugin_id = $1 AND hook_name = $2
      `, {
        bind: [PLUGIN_ID, hook.hook_name],
        type: sequelize.QueryTypes.SELECT
      });

      const code = fullHook[0].handler_function.trim();

      try {
        eval(`(${code})`);
        console.log(`✅ ${hook.hook_name}: Valid syntax`);
      } catch (error) {
        console.log(`❌ ${hook.hook_name}: SYNTAX ERROR!`);
        console.log(`   Error: ${error.message}`);
        console.log(`   First 200 chars:`, code.substring(0, 200));
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAllHooks();
