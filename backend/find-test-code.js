// Find any hook or event with "// test" code
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function findTestCode() {
  try {
    console.log('🔍 Searching for "// test" code in hooks and events...\n');

    // Check hooks
    console.log('1️⃣ Checking hooks...');
    const hooks = await sequelize.query(`
      SELECT plugin_id, hook_name,
             handler_function,
             LENGTH(handler_function) as len
      FROM plugin_hooks
      WHERE handler_function LIKE '%// test%'
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   Found ${hooks.length} hook(s) with "// test"\n`);
    hooks.forEach(h => {
      console.log(`   Hook: ${h.hook_name}`);
      console.log(`   Plugin: ${h.plugin_id}`);
      console.log(`   Code (${h.len} chars):`);
      console.log(`   ${h.handler_function}`);
      console.log('');
    });

    // Check events
    console.log('2️⃣ Checking events...');
    const events = await sequelize.query(`
      SELECT plugin_id, event_name, file_name,
             listener_function,
             LENGTH(listener_function) as len
      FROM plugin_events
      WHERE listener_function LIKE '%// test%'
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   Found ${events.length} event(s) with "// test"\n`);
    events.forEach(e => {
      console.log(`   Event: ${e.event_name}`);
      console.log(`   File: ${e.file_name}`);
      console.log(`   Plugin: ${e.plugin_id}`);
      console.log(`   Code (${e.len} chars):`);
      console.log(`   ${e.listener_function}`);
      console.log('');
    });

    // Also check for very short code (likely broken)
    console.log('3️⃣ Checking for suspiciously short code...');
    const shortEvents = await sequelize.query(`
      SELECT plugin_id, event_name, file_name,
             listener_function,
             LENGTH(listener_function) as len
      FROM plugin_events
      WHERE LENGTH(listener_function) < 50
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   Found ${shortEvents.length} event(s) with < 50 chars\n`);
    shortEvents.forEach(e => {
      console.log(`   Event: ${e.event_name}`);
      console.log(`   File: ${e.file_name}`);
      console.log(`   Plugin: ${e.plugin_id}`);
      console.log(`   Code: "${e.listener_function}"`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

findTestCode();
