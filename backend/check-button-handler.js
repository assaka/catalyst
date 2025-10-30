require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkHandler() {
  try {
    const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

    const hooks = await sequelize.query(`
      SELECT handler_function FROM plugin_hooks
      WHERE plugin_id = $1 AND hook_name = 'cart.processLoadedItems'
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    const code = hooks[0].handler_function;

    console.log('Button handler check:');
    console.log('Has applyShopBtn?', code.includes('applyShopBtn') ? 'YES' : 'NO');
    console.log('Has sessionStorage.setItem?', code.includes('sessionStorage.setItem') ? 'YES' : 'NO');
    console.log('Has pendingCoupon?', code.includes('pendingCoupon') ? 'YES' : 'NO');
    console.log('Has HAMID?', code.includes('HAMID') ? 'YES' : 'NO');

    // Show the button click handler
    const handlerStart = code.indexOf('applyBtn.onclick');
    if (handlerStart !== -1) {
      console.log('\nButton click handler:');
      console.log(code.substring(handlerStart, handlerStart + 300));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkHandler();
