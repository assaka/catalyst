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

    // Get Supabase connection for this store (same method used by all other working routes)
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Get plugins from plugin_registry
    let registryPlugins = [];
    try {
      const { data, error } = await tenantDb
        .from('plugin_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn(`⚠️ plugin_registry query failed:`, error.message);
      } else {
        registryPlugins = data || [];
      }
      console.log(`✅ Found ${registryPlugins.length} plugins in registry`);
    } catch (queryError) {
      console.warn(`⚠️ plugin_registry query failed:`, queryError.message);
      // Continue with empty array - table might not exist
    }

    // Get store-specific configurations from tenant DB
    let storeConfigs = [];
    try {
      const { data, error } = await tenantDb
        .from('plugin_configurations')
        .select('*')
        .eq('store_id', storeId)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        storeConfigs = data;
      }
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

    // Get Supabase connection for this store
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Check plugin_registry
    const { data: registryPlugin, error: pluginError } = await tenantDb
      .from('plugin_registry')
      .select('id, name, status')
      .eq('id', pluginSlug)
      .maybeSingle();

    if (pluginError) {
      console.error('❌ Error checking plugin registry:', pluginError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to check plugin registry'
      });
    }

    if (!registryPlugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found in plugin_registry'
      });
    }

    const pluginId = pluginSlug;

    // Check if configuration already exists
    const { data: existing, error: existingError } = await tenantDb
      .from('plugin_configurations')
      .select('*')
      .eq('plugin_id', pluginId)
      .eq('store_id', storeId)
      .maybeSingle();

    if (existingError) {
      console.error('❌ Error checking existing config:', existingError.message);
    }

    let configResult;
    const now = new Date().toISOString();

    if (!existing) {
      // Create new configuration
      const { data: newConfig, error: insertError } = await tenantDb
        .from('plugin_configurations')
        .insert({
          plugin_id: pluginId,
          store_id: storeId,
          is_enabled: true,
          config_data: configuration,
          last_configured_by: user.id,
          last_configured_at: now,
          enabled_at: now,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating plugin config:', insertError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to enable plugin: ' + insertError.message
        });
      }
      configResult = { isEnabled: true, configData: configuration, enabledAt: now };
    } else if (!existing.is_enabled) {
      // Update existing to enabled
      const { error: updateError } = await tenantDb
        .from('plugin_configurations')
        .update({
          is_enabled: true,
          config_data: configuration,
          last_configured_by: user.id,
          last_configured_at: now,
          enabled_at: now,
          disabled_at: null,
          updated_at: now
        })
        .eq('plugin_id', pluginId)
        .eq('store_id', storeId);

      if (updateError) {
        console.error('❌ Error updating plugin config:', updateError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to enable plugin: ' + updateError.message
        });
      }
      configResult = { isEnabled: true, configData: configuration, enabledAt: now };
    } else {
      configResult = {
        isEnabled: existing.is_enabled,
        configData: existing.config_data,
        enabledAt: existing.enabled_at
      };
    }

    console.log(`✅ Plugin ${pluginSlug} enabled for store ${storeId}`);

    res.json({
      success: true,
      message: `Plugin ${pluginSlug} enabled for store`,
      data: {
        pluginSlug,
        storeId,
        isEnabled: configResult.isEnabled,
        configuration: configResult.configData,
        enabledAt: configResult.enabledAt
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

    // Get Supabase connection for this store
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Check plugin_registry
    const { data: registryPlugin, error: pluginError } = await tenantDb
      .from('plugin_registry')
      .select('id, name, status')
      .eq('id', pluginSlug)
      .maybeSingle();

    if (pluginError) {
      console.error('❌ Error checking plugin registry:', pluginError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to check plugin registry'
      });
    }

    if (!registryPlugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found in plugin_registry'
      });
    }

    const pluginId = pluginSlug;

    // Check if configuration exists
    const { data: existing, error: existingError } = await tenantDb
      .from('plugin_configurations')
      .select('*')
      .eq('plugin_id', pluginId)
      .eq('store_id', storeId)
      .maybeSingle();

    if (existingError) {
      console.error('❌ Error checking existing config:', existingError.message);
    }

    const now = new Date().toISOString();

    if (!existing) {
      // Create a disabled configuration record
      const { error: insertError } = await tenantDb
        .from('plugin_configurations')
        .insert({
          plugin_id: pluginId,
          store_id: storeId,
          is_enabled: false,
          config_data: {},
          disabled_at: now,
          created_at: now,
          updated_at: now
        });

      if (insertError) {
        console.error('❌ Error creating disabled config:', insertError.message);
      }
    } else if (existing.is_enabled) {
      // Update existing to disabled
      const { error: updateError } = await tenantDb
        .from('plugin_configurations')
        .update({
          is_enabled: false,
          disabled_at: now,
          updated_at: now
        })
        .eq('plugin_id', pluginId)
        .eq('store_id', storeId);

      if (updateError) {
        console.error('❌ Error disabling plugin:', updateError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to disable plugin: ' + updateError.message
        });
      }
    }

    console.log(`✅ Plugin ${pluginSlug} disabled for store ${storeId}`);

    res.json({
      success: true,
      message: `Plugin ${pluginSlug} disabled for store`,
      data: {
        pluginSlug,
        storeId,
        isEnabled: false,
        disabledAt: now
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

    // Get Supabase connection for this store
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const pluginId = pluginSlug;

    // Check if configuration exists
    const { data: existing, error: fetchError } = await tenantDb
      .from('plugin_configurations')
      .select('*')
      .eq('plugin_id', pluginId)
      .eq('store_id', storeId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching plugin config:', fetchError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch plugin configuration'
      });
    }

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
    const { error: updateError } = await tenantDb
      .from('plugin_configurations')
      .update({
        config_data: mergedConfig,
        last_configured_by: user.id,
        last_configured_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('plugin_id', pluginId)
      .eq('store_id', storeId);

    if (updateError) {
      console.error('❌ Error updating plugin config:', updateError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to update plugin configuration'
      });
    }

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