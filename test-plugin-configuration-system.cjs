const PluginConfiguration = require('./backend/src/models/PluginConfiguration');
const Plugin = require('./backend/src/models/Plugin');

(async () => {
  try {
    console.log('🧪 Testing store-scoped plugin configuration system...');
    
    // Get the Akeneo plugin
    const akeneoPlugin = await Plugin.findBySlug('akeneo');
    if (!akeneoPlugin) {
      console.log('❌ Akeneo plugin not found in database');
      process.exit(1);
    }
    
    console.log('✅ Found Akeneo plugin:', akeneoPlugin.name);
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const testUserId = null; // Use null for testing (foreign key constraint allows NULL)
    
    // Test enabling plugin for store
    console.log('🚀 Testing enableForStore...');
    const config = await PluginConfiguration.enableForStore(
      akeneoPlugin.id,
      storeId,
      {
        apiUrl: 'https://demo.akeneo.com',
        username: 'demo_user',
        clientId: 'demo_client'
      },
      testUserId
    );
    
    console.log('✅ Plugin enabled for store:', config.id);
    console.log('  Configuration:', config.configData);
    console.log('  Enabled:', config.isEnabled);
    
    // Test finding configurations by store
    console.log('🔍 Testing findByStore...');
    const storeConfigs = await PluginConfiguration.findByStore(storeId);
    console.log('✅ Found', storeConfigs.length, 'configurations for store');
    
    // Test updating configuration
    console.log('⚙️ Testing updateConfig...');
    const updatedConfig = await PluginConfiguration.updateConfig(
      akeneoPlugin.id,
      storeId,
      {
        apiUrl: 'https://updated.akeneo.com',
        timeout: 30000
      },
      testUserId
    );
    
    console.log('✅ Configuration updated');
    console.log('  New config:', updatedConfig.configData);
    
    // Test getting enabled plugins for store
    console.log('📊 Testing getEnabledPluginsForStore...');
    const enabledPlugins = await PluginConfiguration.getEnabledPluginsForStore(storeId);
    console.log('✅ Found', enabledPlugins.length, 'enabled plugins for store');
    
    enabledPlugins.forEach(config => {
      console.log('  - Plugin ID:', config.pluginId, '(enabled at:', config.enabledAt + ')');
    });
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await PluginConfiguration.destroy({
      where: {
        store_id: storeId,
        plugin_id: akeneoPlugin.id
      }
    });
    
    console.log('✅ Store-scoped plugin configuration system is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();