require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function findHTMLCode() {
  try {
    console.log('🔍 Searching for HTML/JSX code in wrong places...\n');

    // Find events with < character (likely HTML/JSX)
    const events = await sequelize.query(`
      SELECT plugin_id, event_name, file_name,
             SUBSTRING(listener_function, 1, 200) as preview
      FROM plugin_events
      WHERE listener_function LIKE '%<%'
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${events.length} events with HTML/JSX:\n`);

    events.forEach(e => {
      console.log(`Event: ${e.event_name} (${e.file_name})`);
      console.log(`Plugin: ${e.plugin_id}`);
      console.log(`Preview: ${e.preview}...`);
      console.log('');
    });

    // Find hooks with < character
    const hooks = await sequelize.query(`
      SELECT plugin_id, hook_name,
             SUBSTRING(handler_function, 1, 200) as preview
      FROM plugin_hooks
      WHERE handler_function LIKE '%<%'
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} hooks with HTML/JSX:\n`);

    hooks.forEach(h => {
      console.log(`Hook: ${h.hook_name}`);
      console.log(`Plugin: ${h.plugin_id}`);
      console.log(`Preview: ${h.preview}...`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

findHTMLCode();
