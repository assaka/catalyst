const { SlotConfiguration } = require('./src/models');

async function checkCategorySlots() {
  try {
    const configs = await SlotConfiguration.findAll({
      where: {
        is_active: true
      },
      order: [['updated_at', 'DESC']],
      limit: 10
    });

    console.log('\n=== Active Slot Configurations ===\n');

    configs.forEach(config => {
      const conf = config.configuration || {};
      console.log(`ID: ${config.id}`);
      console.log(`Store ID: ${config.store_id}`);
      console.log(`Page: ${conf.page_name}`);
      console.log(`Slot Type: ${conf.slot_type}`);
      console.log(`Has product_items slot: ${!!conf.slots?.product_items}`);
      if (conf.slots?.product_items) {
        console.log(`  - Type: ${conf.slots.product_items.type}`);
        console.log(`  - Component: ${conf.slots.product_items.component}`);
        console.log(`  - Has script: ${!!conf.slots.product_items.script}`);
        if (conf.slots.product_items.script) {
          console.log(`  - Script length: ${conf.slots.product_items.script.length} chars`);
        }
      }
      console.log('---\n');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategorySlots();
