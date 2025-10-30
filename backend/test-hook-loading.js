require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function testHookLoading() {
  try {
    const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

    console.log('🔍 Checking hooks in database...\n');

    const hooks = await sequelize.query(`
      SELECT hook_name, priority, is_enabled,
             LENGTH(handler_function) as code_length,
             SUBSTRING(handler_function, 1, 100) as code_preview
      FROM plugin_hooks
      WHERE plugin_id = $1
      ORDER BY hook_name
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} hooks:\n`);

    hooks.forEach((hook, i) => {
      console.log(`${i + 1}. Hook: ${hook.hook_name}`);
      console.log(`   Enabled: ${hook.is_enabled}`);
      console.log(`   Priority: ${hook.priority}`);
      console.log(`   Code Length: ${hook.code_length} chars`);
      console.log(`   Preview: ${hook.code_preview}...`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

testHookLoading();
