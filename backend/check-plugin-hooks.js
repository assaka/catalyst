require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkHooks() {
  try {
    const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';
    
    const hooks = await sequelize.query(`
      SELECT hook_name, priority, is_enabled 
      FROM plugin_hooks
      WHERE plugin_id = $1
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Plugin ${PLUGIN_ID} has ${hooks.length} hooks:`);
    hooks.forEach(h => {
      console.log(`  - ${h.hook_name} (priority: ${h.priority}, enabled: ${h.is_enabled})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkHooks();
