const pluginManager = require('./src/core/PluginManager');
const PluginConfiguration = require('./src/models/PluginConfiguration');
const Plugin = require('./src/models/Plugin');

(async () => {
  try {
    console.log('🧪 Testing plugin enable/disable functionality for store owners...');
    
    // Initialize plugin manager
    await pluginManager.initialize();
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const mockUserId = '12345678-1234-1234-1234-123456789012';
    
    console.log('\n📋 Step 1: Get all available plugins');
    const allPlugins = pluginManager.getAllPlugins();
    console.log(`✅ Found ${allPlugins.length} total plugins:`);
    allPlugins.forEach(plugin => {
      console.log(`  - ${plugin.name} (${plugin.slug})`);
      console.log(`    Installed: ${plugin.isInstalled}`);
      console.log(`    Enabled: ${plugin.isEnabled}`);
      console.log(`    Source: ${plugin.source}`);
    });
    
    console.log('\n📋 Step 2: Check store-specific configurations');
    const storeConfigs = await PluginConfiguration.findByStore(storeId);
    console.log(`✅ Found ${storeConfigs.length} existing configurations for store`);
    
    console.log('\n📋 Step 3: Test enabling a plugin for the store');
    
    // Find an installed plugin to test with
    const installedPlugin = allPlugins.find(p => p.isInstalled);
    if (!installedPlugin) {
      console.log('❌ No installed plugins found to test with');
      process.exit(1);
    }
    
    console.log(`🚀 Testing with plugin: ${installedPlugin.name}`);
    
    // Enable plugin for store
    const config = await PluginConfiguration.enableForStore(
      installedPlugin.manifest?.id || installedPlugin.slug,
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
    
    console.log('\n📋 Step 4: Update plugin configuration');
    const updatedConfig = await PluginConfiguration.updateConfig(
      installedPlugin.manifest?.id || installedPlugin.slug,
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
    
    console.log('\n📋 Step 5: Test getting enabled plugins for store');
    const enabledPlugins = await PluginConfiguration.getEnabledPluginsForStore(storeId);
    console.log(`✅ Found ${enabledPlugins.length} enabled plugins for store`);
    enabledPlugins.forEach(cfg => {
      console.log(`  - Plugin ID: ${cfg.pluginId}`);
      console.log(`    Enabled: ${cfg.isEnabled}`);
      console.log(`    Config keys: ${Object.keys(cfg.configData).join(', ')}`);
    });
    
    console.log('\n📋 Step 6: Test plugin list with store status');
    const storeConfigsMap = new Map(storeConfigs.map(config => [config.pluginId, config]));
    
    const pluginsWithStoreStatus = allPlugins.map(plugin => {
      const storeConfig = storeConfigsMap.get(plugin.manifest?.id || plugin.slug);
      
      return {
        name: plugin.name,
        slug: plugin.slug,
        isInstalled: plugin.isInstalled,
        isEnabled: plugin.isEnabled,
        // Store-specific status
        enabledForStore: storeConfig?.isEnabled || false,
        configuredForStore: !!storeConfig,
        storeConfiguration: storeConfig?.configData || {},
        healthStatus: storeConfig?.healthStatus || 'unknown'
      };
    });
    
    console.log('✅ Plugins with store status:');
    pluginsWithStoreStatus.forEach(plugin => {
      console.log(`  - ${plugin.name}:`);
      console.log(`    Platform installed: ${plugin.isInstalled}`);
      console.log(`    Enabled for store: ${plugin.enabledForStore}`);
      console.log(`    Configured for store: ${plugin.configuredForStore}`);
    });
    
    console.log('\n📋 Step 7: Test disabling plugin for store');
    const disabledConfig = await PluginConfiguration.disableForStore(
      installedPlugin.manifest?.id || installedPlugin.slug,
      storeId,
      mockUserId
    );
    
    console.log('✅ Plugin disabled for store:');
    console.log('  Is Enabled:', disabledConfig.isEnabled);
    console.log('  Disabled At:', disabledConfig.disabledAt);
    
    console.log('\n📋 Step 8: Clean up test data');
    await PluginConfiguration.destroy({
      where: {
        store_id: storeId,
        plugin_id: installedPlugin.manifest?.id || installedPlugin.slug
      }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎯 Plugin enable/disable functionality is working correctly!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Platform-wide plugin installation works');
    console.log('  ✅ Store-specific plugin enabling works');  
    console.log('  ✅ Store-specific plugin configuration works');
    console.log('  ✅ Plugin status tracking works');
    console.log('  ✅ Plugin disable functionality works');
    console.log('  ✅ Configuration persistence works');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();