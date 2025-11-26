const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to parent route params
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const ConnectionManager = require('../services/database/ConnectionManager');

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

    // Get connection for this store (use getConnection which returns Sequelize instance)
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    // Get plugins from plugin_registry
    const registryPlugins = await sequelize.query(
      'SELECT * FROM plugin_registry ORDER BY created_at DESC',
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Get store-specific configurations from tenant DB
    let storeConfigs = [];
    try {
      const configResults = await sequelize.query(
        'SELECT * FROM plugin_configurations WHERE store_id = :storeId ORDER BY updated_at DESC',
        {
          replacements: { storeId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      storeConfigs = configResults || [];
    } catch (configError) {
      console.warn('⚠️ Could not fetch plugin configurations:', configError.message);
    }
    const configMap = new Map(storeConfigs.map(config => [config.plugin_id, config]));

    // Transform plugin_registry plugins with store-specific status
    const pluginsWithStoreStatus = registryPlugins.map(plugin => {
      const storeConfig = configMap.get(plugin.id);

      return {
        id: plugin.id,
        name: plugin.name,
        slug: plugin.id, // Use id as slug for routing
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        category: plugin.category,
        status: plugin.status,
        manifest: plugin.manifest,
        creator_id: plugin.creator_id,
        is_public: plugin.is_public,
        deprecated_at: plugin.deprecated_at,
        deprecation_reason: plugin.deprecation_reason,
        source: 'registry',
        // Store-specific status (using snake_case from raw query)
        enabledForStore: storeConfig?.is_enabled || false,
        configuredForStore: !!storeConfig,
        storeConfiguration: storeConfig?.config_data || {},
        lastConfiguredAt: storeConfig?.last_configured_at || null,
        healthStatus: storeConfig?.health_status || 'unknown'
      };
    });

    console.log(`📊 Returning ${pluginsWithStoreStatus.length} plugins from plugin_registry with store status`);

    res.json({
      success: true,
      data: {
        plugins: pluginsWithStoreStatus,
        storeId,
        summary: {
          totalAvailable: pluginsWithStoreStatus.length,
          enabledForStore: storeConfigs.filter(c => c.is_enabled).length,
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

    // Get connection for this store (use getConnection which returns Sequelize instance)
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    // Check plugin_registry
    const [registryPlugin] = await sequelize.query(
      'SELECT id, name, status FROM plugin_registry WHERE id = :pluginSlug',
      {
        replacements: { pluginSlug },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!registryPlugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found in plugin_registry'
      });
    }

    const pluginId = pluginSlug;

    // Enable plugin for this store - use raw SQL to avoid UUID casting
    const [existing] = await sequelize.query(
      'SELECT * FROM plugin_configurations WHERE plugin_id = :pluginId AND store_id = :storeId',
      {
        replacements: { pluginId, storeId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    let configResult;
    if (!existing) {
      // Create new configuration
      await sequelize.query(
        `INSERT INTO plugin_configurations (id, plugin_id, store_id, is_enabled, config_data, last_configured_by, last_configured_at, enabled_at, created_at, updated_at)
         VALUES (gen_random_uuid(), :pluginId, :storeId, true, :configData, :userId, NOW(), NOW(), NOW(), NOW())`,
        {
          replacements: {
            pluginId,
            storeId,
            configData: JSON.stringify(configuration),
            userId: user.id
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
      configResult = { isEnabled: true, configData: configuration, enabledAt: new Date() };
    } else if (!existing.is_enabled) {
      // Update existing to enabled
      await sequelize.query(
        `UPDATE plugin_configurations
         SET is_enabled = true, config_data = :configData, last_configured_by = :userId,
             last_configured_at = NOW(), enabled_at = NOW(), disabled_at = NULL, updated_at = NOW()
         WHERE plugin_id = :pluginId AND store_id = :storeId`,
        {
          replacements: { pluginId, storeId, configData: JSON.stringify(configuration), userId: user.id },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      configResult = { isEnabled: true, configData: configuration, enabledAt: new Date() };
    } else {
      configResult = existing;
    }

    console.log(`✅ Plugin ${pluginSlug} enabled for store ${storeId}`);

    res.json({
      success: true,
      message: `Plugin ${pluginSlug} enabled for store`,
      data: {
        pluginSlug,
        storeId,
        isEnabled: configResult.isEnabled,
        configuration: configResult.config_data || configResult.configData,
        enabledAt: configResult.enabled_at || configResult.enabledAt
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

    // Get connection for this store (use getConnection which returns Sequelize instance)
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    // Check plugin_registry
    const [registryPlugin] = await sequelize.query(
      'SELECT id, name, status FROM plugin_registry WHERE id = :pluginSlug',
      {
        replacements: { pluginSlug },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!registryPlugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found in plugin_registry'
      });
    }

    const pluginId = pluginSlug;

    // Disable plugin for this store - use raw SQL to avoid UUID casting
    const [existing] = await sequelize.query(
      'SELECT * FROM plugin_configurations WHERE plugin_id = :pluginId AND store_id = :storeId',
      {
        replacements: { pluginId, storeId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Plugin is not configured for this store'
      });
    }

    if (existing.is_enabled) {
      await sequelize.query(
        `UPDATE plugin_configurations
         SET is_enabled = false, disabled_at = NOW(), updated_at = NOW()
         WHERE plugin_id = :pluginId AND store_id = :storeId`,
        {
          replacements: { pluginId, storeId },
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }

    console.log(`✅ Plugin ${pluginSlug} disabled for store ${storeId}`);

    res.json({
      success: true,
      message: `Plugin ${pluginSlug} disabled for store`,
      data: {
        pluginSlug,
        storeId,
        isEnabled: false,
        disabledAt: new Date()
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

    // Get connection for this store
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    const pluginId = pluginSlug;

    // Check if configuration exists
    const [existing] = await sequelize.query(
      'SELECT * FROM plugin_configurations WHERE plugin_id = :pluginId AND store_id = :storeId',
      {
        replacements: { pluginId, storeId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Plugin configuration not found for this store'
      });
    }

    // Merge existing config with new config
    const existingConfig = existing.config_data || {};
    const mergedConfig = { ...existingConfig, ...configuration };

    // Update configuration
    await sequelize.query(
      `UPDATE plugin_configurations
       SET config_data = :configData, last_configured_by = :userId,
           last_configured_at = NOW(), updated_at = NOW()
       WHERE plugin_id = :pluginId AND store_id = :storeId`,
      {
        replacements: {
          pluginId,
          storeId,
          configData: JSON.stringify(mergedConfig),
          userId: user.id
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    res.json({
      success: true,
      message: `Plugin ${pluginSlug} configuration updated`,
      data: {
        pluginSlug,
        storeId,
        configuration: mergedConfig,
        lastConfiguredAt: new Date(),
        validation: { valid: true, errors: [] }
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