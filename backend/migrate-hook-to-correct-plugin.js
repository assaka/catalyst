// Migrate empty cart coupon hook to correct plugin ID
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const OLD_PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';
const NEW_PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function migrateHook() {
  try {
    console.log('🔄 Migrating hook to correct plugin ID...\n');
    console.log(`   From: ${OLD_PLUGIN_ID}`);
    console.log(`   To:   ${NEW_PLUGIN_ID}\n`);

    // Check if hook exists in old plugin
    const oldHooks = await sequelize.query(`
      SELECT hook_name FROM plugin_hooks
      WHERE plugin_id = $1
    `, {
      bind: [OLD_PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    if (oldHooks.length === 0) {
      console.log('ℹ️  No hooks found in old plugin. Nothing to migrate.');
      return;
    }

    console.log(`Found ${oldHooks.length} hook(s) to migrate:`);
    oldHooks.forEach(h => console.log(`  - ${h.hook_name}`));
    console.log('');

    // Update plugin_id
    const result = await sequelize.query(`
      UPDATE plugin_hooks
      SET plugin_id = $1
      WHERE plugin_id = $2
    `, {
      bind: [NEW_PLUGIN_ID, OLD_PLUGIN_ID],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('✅ Hook(s) migrated successfully!');
    console.log(`   Rows updated: ${result[1]}`);
    console.log('\n🔍 Verifying...');

    // Verify migration
    const newHooks = await sequelize.query(`
      SELECT hook_name, priority FROM plugin_hooks
      WHERE plugin_id = $1
    `, {
      bind: [NEW_PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`\n✅ Plugin ${NEW_PLUGIN_ID} now has ${newHooks.length} hook(s):`);
    newHooks.forEach(h => console.log(`  - ${h.hook_name} (priority: ${h.priority})`));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrateHook();
