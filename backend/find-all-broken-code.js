// Find ALL broken code in events, hooks, and scripts
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function findAllBrokenCode() {
  try {
    console.log('🔍 Searching for ALL broken code...\n');

    const broken = [];

    // 1. Check events
    console.log('1️⃣ Checking plugin_events...');
    const events = await sequelize.query(`
      SELECT plugin_id, event_name, file_name, listener_function
      FROM plugin_events
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   Total events: ${events.length}\n`);

    for (const event of events) {
      const code = (event.listener_function || '').trim();

      if (!code || code.length < 20 || code.includes('<') || code.startsWith('// test')) {
        console.log(`   ❌ BROKEN EVENT: ${event.event_name} (${event.file_name})`);
        console.log(`      Plugin: ${event.plugin_id}`);
        console.log(`      Code: "${code.substring(0, 100)}..."`);
        console.log('');
        broken.push({ type: 'event', ...event });
        continue;
      }

      try {
        eval(`(${code})`);
      } catch (error) {
        console.log(`   ❌ SYNTAX ERROR in event: ${event.event_name}`);
        console.log(`      File: ${event.file_name}`);
        console.log(`      Plugin: ${event.plugin_id}`);
        console.log(`      Error: ${error.message}`);
        console.log(`      Code preview: ${code.substring(0, 150)}`);
        console.log('');
        broken.push({ type: 'event', ...event });
      }
    }

    // 2. Check hooks
    console.log('\n2️⃣ Checking plugin_hooks...');
    const hooks = await sequelize.query(`
      SELECT plugin_id, hook_name, handler_function
      FROM plugin_hooks
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   Total hooks: ${hooks.length}\n`);

    for (const hook of hooks) {
      const code = (hook.handler_function || '').trim();

      if (!code || code.length < 20 || code.includes('<') || code.startsWith('// test')) {
        console.log(`   ❌ BROKEN HOOK: ${hook.hook_name}`);
        console.log(`      Plugin: ${hook.plugin_id}`);
        console.log(`      Code: "${code.substring(0, 100)}..."`);
        console.log('');
        broken.push({ type: 'hook', ...hook });
        continue;
      }

      try {
        eval(`(${code})`);
      } catch (error) {
        console.log(`   ❌ SYNTAX ERROR in hook: ${hook.hook_name}`);
        console.log(`      Plugin: ${hook.plugin_id}`);
        console.log(`      Error: ${error.message}`);
        console.log(`      Code preview: ${code.substring(0, 150)}`);
        console.log('');
        broken.push({ type: 'hook', ...hook });
      }
    }

    // 3. Check plugin_scripts (might have broken frontend scripts)
    console.log('\n3️⃣ Checking plugin_scripts...');
    const scripts = await sequelize.query(`
      SELECT plugin_id, file_name, file_content
      FROM plugin_scripts
      WHERE scope = 'frontend'
      LIMIT 50
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   Total frontend scripts: ${scripts.length}\n`);

    for (const script of scripts) {
      const code = (script.file_content || '').trim();

      // Don't validate React components (they have JSX)
      if (code.includes('import React') || code.includes('export default function')) {
        continue;
      }

      if (!code || code.length < 10) {
        console.log(`   ❌ EMPTY SCRIPT: ${script.file_name}`);
        console.log(`      Plugin: ${script.plugin_id}`);
        console.log('');
        broken.push({ type: 'script', ...script });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`Summary: Found ${broken.length} broken item(s)\n`);

    if (broken.length > 0) {
      console.log('🗑️  DELETE THESE:\n');
      broken.forEach(item => {
        if (item.type === 'event') {
          console.log(`   DELETE FROM plugin_events WHERE plugin_id = '${item.plugin_id}' AND event_name = '${item.event_name}';`);
        } else if (item.type === 'hook') {
          console.log(`   DELETE FROM plugin_hooks WHERE plugin_id = '${item.plugin_id}' AND hook_name = '${item.hook_name}';`);
        } else if (item.type === 'script') {
          console.log(`   DELETE FROM plugin_scripts WHERE plugin_id = '${item.plugin_id}' AND file_name = '${item.file_name}';`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

findAllBrokenCode();
