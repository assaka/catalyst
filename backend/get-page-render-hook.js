require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function getPageRenderHook() {
  try {
    const hooks = await sequelize.query(`
      SELECT hook_name, plugin_id, handler_function
      FROM plugin_hooks
      WHERE hook_name = 'page.render'
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} page.render hook(s):\n`);

    hooks.forEach(h => {
      console.log(`Plugin: ${h.plugin_id}`);
      console.log(`Hook: ${h.hook_name}`);
      console.log(`Code:`);
      console.log(h.handler_function);
      console.log('\n' + '='.repeat(60) + '\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

getPageRenderHook();
