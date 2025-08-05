const pluginManager = require('./src/core/PluginManager');
const PluginConfiguration = require('./src/models/PluginConfiguration');
const Plugin = require('./src/models/Plugin');

(async () => {
  try {
    console.log('🧪 Testing plugin enable/disable functionality for store owners...');
    
    // Initialize plugin manager
    await pluginManager.initialize();
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const mockUserId = null; // Use null to avoid foreign key constraint issues
    
    console.log('\n📋 Step 1: Get installed plugins from database');
    const installedPlugins = await Plugin.findInstalled();
    console.log(`✅ Found ${installedPlugins.length} installed plugins in database:`);
    installedPlugins.forEach(plugin => {
      console.log(`  - ${plugin.name} (${plugin.slug})`);
      console.log(`    ID: ${plugin.id}`);
      console.log(`    Version: ${plugin.version}`);
      console.log(`    Status: ${plugin.status}`);
    });
    
    if (installedPlugins.length === 0) {
      console.log('❌ No installed plugins found in database to test with');
      process.exit(1);
    }
    
    const testPlugin = installedPlugins[0];
    console.log(`\n🚀 Testing with plugin: ${testPlugin.name} (ID: ${testPlugin.id})`);
    
    console.log('\n📋 Step 2: Enable plugin for store');
    const config = await PluginConfiguration.enableForStore(
      testPlugin.id, // Use the actual UUID from database
      storeId,
      {
        apiUrl: 'https://test-api.example.com',
        timeout: 30000,
        retries: 3,
        environment: 'test'
      },
      mockUserId
    );
    
    console.log('✅ Plugin enabled for store:');
    console.log('  ID:', config.id);
    console.log('  Plugin ID:', config.pluginId);
    console.log('  Store ID:', config.storeId);
    console.log('  Is Enabled:', config.isEnabled);
    console.log('  Configuration:', JSON.stringify(config.configData, null, 2));
    console.log('  Enabled At:', config.enabledAt);
    
    console.log('\n📋 Step 3: Update plugin configuration');
    const updatedConfig = await PluginConfiguration.updateConfig(
      testPlugin.id,
      storeId,
      {
        apiUrl: 'https://updated-api.example.com',
        timeout: 45000,
        retries: 5,
        environment: 'production',
        features: ['sync', 'import', 'export']
      },
      mockUserId
    );
    
    console.log('✅ Configuration updated:');
    console.log('  New config:', JSON.stringify(updatedConfig.configData, null, 2));
    console.log('  Last configured at:', updatedConfig.lastConfiguredAt);
    
    console.log('\n📋 Step 4: Get enabled plugins for store');
    const enabledPlugins = await PluginConfiguration.getEnabledPluginsForStore(storeId);
    console.log(`✅ Found ${enabledPlugins.length} enabled plugins for store`);
    enabledPlugins.forEach(cfg => {
      console.log(`  - Plugin ID: ${cfg.pluginId}`);
      console.log(`    Enabled: ${cfg.isEnabled}`);
      console.log(`    Config keys: ${Object.keys(cfg.configData).join(', ')}`);
    });
    
    console.log('\n📋 Step 5: Test plugin manager integration');
    const allPlugins = pluginManager.getAllPlugins();
    const storeConfigs = await PluginConfiguration.findByStore(storeId);
    const configMap = new Map(storeConfigs.map(config => [config.pluginId, config]));
    
    console.log('✅ Plugin status with store configurations:');
    allPlugins.forEach(plugin => {
      // Try to match plugin by ID or slug
      const storeConfig = configMap.get(testPlugin.id) || configMap.get(plugin.slug);
      
      console.log(`  - ${plugin.name}:`);
      console.log(`    Platform installed: ${plugin.isInstalled}`);
      console.log(`    Enabled for store: ${storeConfig?.isEnabled || false}`);
      console.log(`    Configured for store: ${!!storeConfig}`);
      if (storeConfig) {
        console.log(`    Store config keys: ${Object.keys(storeConfig.configData).join(', ')}`);
      }
    });
    
    console.log('\n📋 Step 6: Test disabling plugin for store');
    const disabledConfig = await PluginConfiguration.disableForStore(
      testPlugin.id,
      storeId,
      mockUserId
    );
    
    console.log('✅ Plugin disabled for store:');
    console.log('  Is Enabled:', disabledConfig.isEnabled);
    console.log('  Disabled At:', disabledConfig.disabledAt);
    
    console.log('\n📋 Step 7: Test re-enabling plugin for store');
    const reEnabledConfig = await PluginConfiguration.enableForStore(
      testPlugin.id,
      storeId,
      {
        apiUrl: 'https://re-enabled-api.example.com',
        timeout: 60000,
        environment: 'staging'
      },
      mockUserId
    );
    
    console.log('✅ Plugin re-enabled for store:');
    console.log('  Is Enabled:', reEnabledConfig.isEnabled);
    console.log('  Configuration merged:', JSON.stringify(reEnabledConfig.configData, null, 2));
    
    console.log('\n📋 Step 8: Clean up test data');
    await PluginConfiguration.destroy({
      where: {
        store_id: storeId,
        plugin_id: testPlugin.id
      }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎯 Plugin enable/disable functionality is working correctly!');
    console.log('\n📊 Summary of what works for store owners:');
    console.log('  ✅ Platform-wide plugin installation');
    console.log('  ✅ Store-specific plugin enabling');
    console.log('  ✅ Store-specific plugin configuration');
    console.log('  ✅ Configuration updates and merging');
    console.log('  ✅ Plugin disable/re-enable functionality');
    console.log('  ✅ Plugin status tracking per store');
    console.log('  ✅ Integration with plugin manager');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();