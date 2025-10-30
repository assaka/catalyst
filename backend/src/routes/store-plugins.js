const express = require('express');
const router = express.Router();
const pluginManager = require('../core/PluginManager');
const PluginConfiguration = require('../models/PluginConfiguration');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const { sequelize } = require('../database/connection');

// All routes require authentication and store access
// Add defensive checks for production environment issues
if (typeof authMiddleware !== 'function') {
  console.error('❌ CRITICAL: authMiddleware is not a function in production environment');
  console.error('   This indicates a deployment or environment issue, not a code issue');
  console.error('   Type:', typeof authMiddleware, 'Value:', authMiddleware);
  throw new Error('Production environment error: authMiddleware not loaded correctly');
}

if (typeof checkStoreOwnership !== 'function') {
  console.error('❌ CRITICAL: checkStoreOwnership is not a function in production environment');
  console.error('   This indicates a deployment or environment issue, not a code issue');
  console.error('   Type:', typeof checkStoreOwnership, 'Value:', checkStoreOwnership);
  throw new Error('Production environment error: checkStoreOwnership not loaded correctly');
}

router.use(authMiddleware);
router.use(checkStoreOwnership);

/**
 * GET /api/stores/:store_id/plugins
 * Get all available plugins with store-specific configuration status
 */
router.get('/', async (req, res) => {
  try {
    // Temporary auth check since middleware might not be loaded
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const storeId = req.params.store_id;
    
    console.log(`🔍 Getting plugins for store: ${storeId}`);
    
    // Ensure plugin manager is initialized
    if (!pluginManager.isInitialized) {
      await pluginManager.initialize();
    }
    
    // Get all available plugins (platform-wide)
    const allPlugins = pluginManager.getAllPlugins();
    
    // Get store-specific configurations
    const storeConfigs = await PluginConfiguration.findByStore(storeId);
    const configMap = new Map(storeConfigs.map(config => [config.pluginId, config]));
    
    // Merge plugin info with store-specific status
    const pluginsWithStoreStatus = allPlugins.map(plugin => {
      const storeConfig = configMap.get(plugin.manifest?.id || plugin.slug);
      
      return {
        ...plugin,
        // Store-specific status
        enabledForStore: storeConfig?.isEnabled || false,
        configuredForStore: !!storeConfig,
        storeConfiguration: storeConfig?.configData || {},
        lastConfiguredAt: storeConfig?.lastConfiguredAt || null,
        healthStatus: storeConfig?.healthStatus || 'unknown'
      };
    });
    
    console.log(`📊 Returning ${pluginsWithStoreStatus.length} plugins with store status`);
    
    res.json({
      success: true,
      data: {
        plugins: pluginsWithStoreStatus,
        storeId,
        summary: {
          totalAvailable: allPlugins.length,
          enabledForStore: storeConfigs.filter(c => c.isEnabled).length,
          configuredForStore: storeConfigs.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Store plugins API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/plugins/:pluginSlug/enable
 * Enable a plugin for this store with configuration
 */
router.post('/:pluginSlug/enable', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { user } = req;
    const { pluginSlug } = req.params;
    const { configuration = {} } = req.body;

    console.log(`🚀 Enabling plugin ${pluginSlug} for store ${storeId}`);

    // Check plugin_registry first (new system)
    const [registryPlugin] = await sequelize.query(
      'SELECT id, name, status FROM plugin_registry WHERE id = :pluginSlug',
      {
        replacements: { pluginSlug },
        type: sequelize.QueryTypes.SELECT
      }
    );

    let pluginId = pluginSlug;

    if (!registryPlugin) {
      // Fallback to old plugin manager system
      const plugin = pluginManager.getPlugin(pluginSlug);
      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      if (!plugin.isInstalled) {
        return res.status(400).json({
          success: false,
          error: 'Plugin must be installed before it can be enabled for a store'
        });
      }

      pluginId = plugin.manifest?.id || pluginSlug;
    }

    // Enable plugin for this store
    const config = await PluginConfiguration.enableForStore(
      pluginId,
      storeId,
      configuration,
      user.id
    );

    console.log(`✅ Plugin ${pluginSlug} enabled for store ${storeId}`);

    res.json({
      success: true,
      message: `Plugin ${pluginSlug} enabled for store`,
      data: {
        pluginSlug,
        storeId,
        isEnabled: config.isEnabled,
        configuration: config.configData,
        enabledAt: config.enabledAt
      }
    });
  } catch (error) {
    console.error('❌ Enable plugin for store error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/plugins/:pluginSlug/disable
 * Disable a plugin for this store
 */
router.post('/:pluginSlug/disable', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { user } = req;
    const { pluginSlug } = req.params;

    console.log(`🛑 Disabling plugin ${pluginSlug} for store ${storeId}`);

    // Check plugin_registry first (new system)
    const [registryPlugin] = await sequelize.query(
      'SELECT id, name, status FROM plugin_registry WHERE id = :pluginSlug',
      {
        replacements: { pluginSlug },
        type: sequelize.QueryTypes.SELECT
      }
    );

    let pluginId = pluginSlug;

    if (!registryPlugin) {
      // Fallback to old plugin manager system
      const plugin = pluginManager.getPlugin(pluginSlug);
      if (!plugin) {
        return res.status(404).json({
          success: false,
          error: 'Plugin not found'
        });
      }

      pluginId = plugin.manifest?.id || pluginSlug;
    }

    // Disable plugin for this store
    const config = await PluginConfiguration.disableForStore(
      pluginId,
      storeId
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Plugin is not configured for this store'
      });
    }

    console.log(`✅ Plugin ${pluginSlug} disabled for store ${storeId}`);

    res.json({
      success: true,
      message: `Plugin ${pluginSlug} disabled for store`,
      data: {
        pluginSlug,
        storeId,
        isEnabled: config.isEnabled,
        disabledAt: config.disabledAt
      }
    });
  } catch (error) {
    console.error('❌ Disable plugin for store error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/stores/:store_id/plugins/:pluginSlug/configure
 * Update plugin configuration for this store
 */
router.put('/:pluginSlug/configure', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { user } = req;
    const { pluginSlug } = req.params;
    const { configuration } = req.body;
    
    if (!configuration || typeof configuration !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Configuration object is required'
      });
    }
    
    console.log(`⚙️ Updating configuration for plugin ${pluginSlug} in store ${storeId}`);
    
    const config = await PluginConfiguration.updateConfig(
      pluginSlug,
      storeId,
      configuration,
      user.id
    );
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Plugin configuration not found for this store'
      });
    }
    
    // Validate configuration if schema exists
    const validation = config.validateConfig();
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        validationErrors: validation.errors
      });
    }
    
    res.json({
      success: true,
      message: `Plugin ${pluginSlug} configuration updated`,
      data: {
        pluginSlug,
        storeId,
        configuration: config.configData,
        lastConfiguredAt: config.lastConfiguredAt,
        validation
      }
    });
  } catch (error) {
    console.error('❌ Configure plugin for store error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;