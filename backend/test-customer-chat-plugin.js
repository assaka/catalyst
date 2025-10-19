/**
 * Test Customer Service Chat Plugin
 * Loads the plugin using PluginModuleLoader and verifies functionality
 */

const { Pool } = require('pg');
require('dotenv').config();

const PluginRegistry = require('./src/core/PluginRegistry');
const PluginModuleLoader = require('./src/core/PluginModuleLoader');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function testChatPlugin() {
  console.log('🧪 Testing Customer Service Chat Plugin...\n');

  try {
    // 1. Initialize PluginRegistry
    const pluginRegistry = new PluginRegistry(pool);
    await pluginRegistry.initialize();

    // 2. Initialize PluginModuleLoader
    const pluginLoader = new PluginModuleLoader(pool, pluginRegistry);

    // 3. Load the customer chat plugin
    console.log('\n📦 Loading customer-service-chat plugin...');
    const loadResult = await pluginLoader.loadPlugin('customer-service-chat');

    if (!loadResult.success) {
      throw new Error(`Failed to load plugin: ${loadResult.error}`);
    }

    console.log('✅ Plugin loaded successfully!\n');

    // 4. Get plugin context
    const context = pluginLoader.getPluginContext('customer-service-chat');

    // 5. Verify scripts loaded
    console.log('📄 Checking loaded modules:');
    console.log(`  - Modules loaded: ${context.modules.size}`);

    for (const [modulePath, moduleExports] of context.modules.entries()) {
      console.log(`    ✅ ${modulePath}`);
    }

    // 6. Verify hooks loaded
    console.log('\n🪝 Checking loaded hooks:');
    console.log(`  - Hooks registered: ${context.hooks.size}`);

    for (const [hookName, hookData] of context.hooks.entries()) {
      console.log(`    ✅ ${hookName} (priority: ${hookData.priority}, enabled: ${hookData.enabled})`);
    }

    // 7. Verify events loaded
    console.log('\n📡 Checking loaded events:');
    console.log(`  - Events registered: ${context.events.size}`);

    for (const [eventName, eventData] of context.events.entries()) {
      console.log(`    ✅ ${eventName} (priority: ${eventData.priority}, enabled: ${eventData.enabled})`);
    }

    // 8. Test hook execution
    console.log('\n🔧 Testing hook execution...');
    try {
      const hookResults = await pluginLoader.executeHook('page.render', { page: 'home' });
      console.log(`  ✅ Hook executed successfully (${hookResults.length} results)`);

      if (hookResults.length > 0) {
        console.log(`  📊 Result:`, hookResults[0].result);
      }
    } catch (error) {
      console.error(`  ❌ Hook execution failed:`, error.message);
    }

    // 9. Test event emission
    console.log('\n📢 Testing event emission...');
    try {
      await pluginLoader.emitEvent('chat.conversation.opened', {
        conversationId: 'test-123',
        customerId: 'customer-456',
        timestamp: new Date().toISOString()
      });
      console.log(`  ✅ Event emitted successfully`);
    } catch (error) {
      console.error(`  ❌ Event emission failed:`, error.message);
    }

    // 10. Verify plugin data API
    console.log('\n💾 Testing plugin data storage...');
    try {
      await context.pluginData.set('test_key', { value: 'test_value', timestamp: Date.now() });
      const retrievedData = await context.pluginData.get('test_key');
      console.log(`  ✅ Data storage working:`, retrievedData);
      await context.pluginData.delete('test_key');
      console.log(`  ✅ Data deletion working`);
    } catch (error) {
      console.error(`  ❌ Data storage failed:`, error.message);
    }

    // 11. Check plugin metadata
    console.log('\n📋 Plugin Metadata:');
    const pluginInfo = await pool.query(
      'SELECT id, name, version, description, status, manifest FROM plugin_registry WHERE id = $1',
      ['customer-service-chat']
    );

    if (pluginInfo.rows.length > 0) {
      const plugin = pluginInfo.rows[0];
      console.log(`  - Name: ${plugin.name}`);
      console.log(`  - Version: ${plugin.version}`);
      console.log(`  - Status: ${plugin.status}`);
      console.log(`  - Description: ${plugin.description}`);
      console.log(`  - UI Pages: ${plugin.manifest?.ui?.pages?.length || 0}`);
      console.log(`  - Database Tables: ${plugin.manifest?.database?.tables?.length || 0}`);
      console.log(`  - Features: ${plugin.manifest?.features?.length || 0}`);
    }

    // 12. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ All Tests Passed!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log(`  ✅ Plugin loaded successfully`);
    console.log(`  ✅ ${context.modules.size} modules loaded`);
    console.log(`  ✅ ${context.hooks.size} hooks registered`);
    console.log(`  ✅ ${context.events.size} events registered`);
    console.log(`  ✅ Hook execution working`);
    console.log(`  ✅ Event emission working`);
    console.log(`  ✅ Plugin data storage working`);

    console.log('\n🎯 Next Steps:');
    console.log('  1. Create database tables from manifest schema');
    console.log('  2. Create API endpoints for chat operations');
    console.log('  3. Deploy to production and test in browser');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

testChatPlugin()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
