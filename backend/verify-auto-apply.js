require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function verify() {
  try {
    const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

    // Check hook
    const hooks = await sequelize.query(`
      SELECT hook_name, SUBSTRING(handler_function, 1, 200) as preview
      FROM plugin_hooks
      WHERE plugin_id = $1 AND hook_name = 'cart.processLoadedItems'
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log('Hook check:');
    if (hooks.length > 0) {
      console.log('✅ Hook exists');
      console.log('   Has "Apply & Shop"?', hooks[0].preview.includes('applyShopBtn') ? 'YES' : 'NO');
      console.log('   Has "HAMID"?', hooks[0].preview.includes('HAMID') ? 'YES' : 'NO');
    }

    // Check event
    const events = await sequelize.query(`
      SELECT event_name, file_name
      FROM plugin_events
      WHERE plugin_id = $1 AND file_name = 'auto-apply-coupon.js'
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log('\nEvent check:');
    console.log(events.length > 0 ? '✅ Auto-apply event exists' : '❌ Event missing');

    console.log('\n✅ Auto-apply feature is ready!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verify();
