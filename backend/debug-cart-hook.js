// Debug cart hook loading and execution
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function debugCartHook() {
  try {
    console.log('🔍 Debugging Cart Hook...\n');
    console.log(`Plugin ID: ${PLUGIN_ID}\n`);

    // 1. Check plugin status
    console.log('1️⃣ Checking plugin status...');
    const plugin = await sequelize.query(`
      SELECT id, name, slug, status, is_enabled, type
      FROM plugin_registry
      WHERE id = $1
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    if (plugin.length === 0) {
      console.log('❌ Plugin not found!');
      return;
    }

    console.log(`   Plugin: ${plugin[0].name}`);
    console.log(`   Slug: ${plugin[0].slug}`);
    console.log(`   Status: ${plugin[0].status}`);
    console.log(`   Enabled: ${plugin[0].is_enabled}`);
    console.log(`   Type: ${plugin[0].type}\n`);

    if (!plugin[0].is_enabled) {
      console.log('⚠️  WARNING: Plugin is DISABLED! It won\'t load on the frontend.\n');
    }

    if (plugin[0].status !== 'active') {
      console.log(`⚠️  WARNING: Plugin status is "${plugin[0].status}", not "active".\n`);
    }

    // 2. Check hooks
    console.log('2️⃣ Checking hooks...');
    const hooks = await sequelize.query(`
      SELECT hook_name, priority, is_enabled,
             LENGTH(handler_function) as code_length,
             SUBSTRING(handler_function, 1, 200) as code_preview
      FROM plugin_hooks
      WHERE plugin_id = $1
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   Found ${hooks.length} hook(s):\n`);

    hooks.forEach(hook => {
      console.log(`   Hook: ${hook.hook_name}`);
      console.log(`   Enabled: ${hook.is_enabled}`);
      console.log(`   Priority: ${hook.priority}`);
      console.log(`   Code Length: ${hook.code_length} chars`);
      console.log(`   Preview:`);
      console.log(`   ${hook.code_preview}...`);
      console.log('');

      if (!hook.is_enabled) {
        console.log(`   ⚠️  WARNING: Hook "${hook.hook_name}" is DISABLED!\n`);
      }
    });

    // 3. Check if hook is in active plugins API response
    console.log('3️⃣ Simulating API check...');
    console.log(`   The hook should appear in:`);
    console.log(`   GET /api/plugins/active`);
    console.log(`   GET /api/plugins/registry/${PLUGIN_ID}\n`);

    // 4. Recommendations
    console.log('4️⃣ Debugging Steps:\n');
    console.log('   A. Check browser console for errors:');
    console.log('      - Open DevTools (F12)');
    console.log('      - Go to Console tab');
    console.log('      - Look for errors when visiting /cart\n');

    console.log('   B. Check if hook is registered:');
    console.log('      - In console, type: window.hookSystem');
    console.log('      - Check if cart.processLoadedItems exists\n');

    console.log('   C. Check if plugin is loaded:');
    console.log('      - In console, type: fetch("/api/plugins/active").then(r => r.json()).then(console.log)');
    console.log(`      - Look for plugin ID: ${PLUGIN_ID}\n`);

    console.log('   D. Manually test the hook:');
    console.log('      - In console, clear storage: sessionStorage.clear()');
    console.log('      - Refresh page and visit /cart with empty cart\n');

    console.log('   E. Check if cart.processLoadedItems is being called:');
    console.log('      - Add console.log to Cart.jsx line 438');
    console.log('      - Or check Network tab for cart API calls\n');

    // 5. Quick fix suggestion
    console.log('5️⃣ Quick Fix:\n');
    if (!plugin[0].is_enabled) {
      console.log('   Run this to enable the plugin:');
      console.log(`   UPDATE plugin_registry SET is_enabled = true WHERE id = '${PLUGIN_ID}';\n`);
    }

    if (hooks.length === 0) {
      console.log('   ⚠️  No hooks found! The hook might not have been created.\n');
      console.log('   Run: node backend/fix-empty-cart-coupon-hook.js\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

debugCartHook();
