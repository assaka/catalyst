const express = require('express');
const router = express.Router();
const pluginManager = require('../core/PluginManager');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * GET /api/plugins/test
 * Test endpoint without auth to debug plugin manager
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Plugin test endpoint called (no auth)');
    
    // Ensure plugin manager is initialized
    if (!pluginManager.isInitialized) {
      console.log('⚠️ Plugin manager not initialized, initializing now...');
      await pluginManager.initialize();
    }
    
    const plugins = pluginManager.getAllPlugins();
    const status = pluginManager.getStatus();
    
    console.log(`📊 Test endpoint returning ${plugins.length} plugins`);
    
    res.json({
      success: true,
      message: 'Plugin manager test - no auth required',
      data: {
        plugins,
        summary: {
          total: status.totalPlugins,
          installed: status.installedPlugins,
          enabled: status.enabledPlugins
        }
      }
    });
  } catch (error) {
    console.error('❌ Plugin test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// All plugin routes require authentication
router.use(authMiddleware);

/**
 * GET /api/plugins
 * Get all available plugins and integrations
 */
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Plugin API called - getting all plugins');
    
    // Ensure plugin manager is initialized
    if (!pluginManager.isInitialized) {
      console.log('⚠️ Plugin manager not initialized, initializing now...');
      await pluginManager.initialize();
    }
    
    const plugins = pluginManager.getAllPlugins();
    const status = pluginManager.getStatus();
    
    console.log(`📊 Returning ${plugins.length} plugins`);
    
    res.json({
      success: true,
      data: {
        plugins,
        summary: {
          total: status.totalPlugins,
          installed: status.installedPlugins,
          enabled: status.enabledPlugins
        }
      }
    });
  } catch (error) {
    console.error('❌ Plugin API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/marketplace
 * Get marketplace plugins
 */
router.get('/marketplace', async (req, res) => {
  try {
    console.log('🔍 Marketplace API called');
    
    // Ensure plugin manager is initialized
    if (!pluginManager.isInitialized) {
      console.log('⚠️ Plugin manager not initialized, initializing now...');
      await pluginManager.initialize();
    }
    
    const marketplacePlugins = Array.from(pluginManager.marketplace.values());
    console.log(`🏪 Returning ${marketplacePlugins.length} marketplace plugins`);
    
    res.json({
      success: true,
      data: marketplacePlugins
    });
  } catch (error) {
    console.error('❌ Marketplace API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/:name
 * Get specific plugin details
 */
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const plugin = pluginManager.getPlugin(name);
    if (plugin) {
      return res.json({
        success: true,
        data: {
          ...plugin.getStatus(),
          manifest: plugin.manifest
        }
      });
    }
    
    res.status(404).json({
      success: false,
      error: 'Plugin not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:name/install
 * Install a plugin
 */
router.post('/:name/install', async (req, res) => {
  try {
    const { name } = req.params;
    
    const plugin = pluginManager.getPlugin(name);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }
    
    await pluginManager.installPlugin(name);
    
    res.json({
      success: true,
      message: `Plugin ${name} installed successfully`,
      data: plugin.getStatus()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:name/uninstall
 * Uninstall a plugin with enhanced cleanup options
 */
router.post('/:name/uninstall', async (req, res) => {
  try {
    const { name } = req.params;
    const {
      removeCode = false,
      cleanupData = 'ask',
      cleanupTables = 'ask',
      createBackup = true,
      force = false
    } = req.body;
    
    const result = await pluginManager.uninstallPlugin(name, {
      removeCode,
      cleanupData,
      cleanupTables,
      createBackup,
      force
    });
    
    res.json({
      success: true,
      message: result.message,
      data: {
        backupPath: result.backupPath,
        cleanupSummary: result.cleanupSummary
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:name/enable
 * Enable a plugin
 */
router.post('/:name/enable', async (req, res) => {
  try {
    const { name } = req.params;
    
    const plugin = pluginManager.getPlugin(name);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }
    
    await pluginManager.enablePlugin(name);
    
    res.json({
      success: true,
      message: `Plugin ${name} enabled successfully`,
      data: plugin.getStatus()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:name/disable
 * Disable a plugin
 */
router.post('/:name/disable', async (req, res) => {
  try {
    const { name } = req.params;
    
    await pluginManager.disablePlugin(name);
    
    const plugin = pluginManager.getPlugin(name);
    res.json({
      success: true,
      message: `Plugin ${name} disabled successfully`,
      data: plugin ? plugin.getStatus() : null
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/:name/health
 * Check plugin health
 */
router.get('/:name/health', async (req, res) => {
  try {
    const { name } = req.params;
    const { storeId } = req.query;
    
    const plugin = pluginManager.getPlugin(name);
    if (plugin) {
      const health = await pluginManager.checkPluginHealth(name);
      return res.json({
        success: true,
        data: health
      });
    }
    
    res.status(404).json({
      success: false,
      error: 'Plugin not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/install-github
 * Install plugin from GitHub
 */
router.post('/install-github', async (req, res) => {
  try {
    const { githubUrl, options = {} } = req.body;

    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        error: 'GitHub URL is required'
      });
    }

    // Validate GitHub URL format
    if (!githubUrl.includes('github.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub URL format'
      });
    }

    const result = await pluginManager.installFromGitHub(githubUrl, options);

    res.json({
      success: true,
      message: result.message,
      data: result.plugin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/plugins/:id/visibility
 * Update plugin public/private status
 */
router.patch('/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_public } = req.body;
    const userId = req.user.id;
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required (X-Store-Id header or query param)'
      });
    }

    const ConnectionManager = require('../services/database/ConnectionManager');
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Verify ownership
    const { data: pluginResult, error: pluginError } = await tenantDb
      .from('plugin_registry')
      .select('id, name, creator_id')
      .eq('id', id)
      .maybeSingle();

    if (pluginError || !pluginResult) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    if (pluginResult.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this plugin'
      });
    }

    // Update visibility
    await tenantDb
      .from('plugin_registry')
      .update({
        is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({
      success: true,
      message: `Plugin is now ${is_public ? 'public' : 'private'}`,
      data: { is_public }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:id/deprecate
 * Deprecate a public plugin (soft delete)
 */
router.post('/:id/deprecate', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required (X-Store-Id header or query param)'
      });
    }

    const ConnectionManager = require('../services/database/ConnectionManager');
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Verify ownership and public status
    const { data: pluginResult, error: pluginError } = await tenantDb
      .from('plugin_registry')
      .select('id, creator_id, is_public, name')
      .eq('id', id)
      .maybeSingle();

    if (pluginError || !pluginResult) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    if (pluginResult.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to deprecate this plugin'
      });
    }

    if (!pluginResult.is_public) {
      return res.status(400).json({
        success: false,
        error: 'Only public plugins can be deprecated. Use delete for private plugins.'
      });
    }

    // Deprecate plugin
    await tenantDb
      .from('plugin_registry')
      .update({
        deprecated_at: new Date().toISOString(),
        deprecation_reason: reason || 'Plugin deprecated by creator',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({
      success: true,
      message: `Plugin "${pluginResult.name}" has been deprecated. Existing users can still use it.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/plugins/:id
 * Delete a private plugin (hard delete)
 * Clears all records from plugin_* tables
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required (X-Store-Id header or query param)'
      });
    }

    const ConnectionManager = require('../services/database/ConnectionManager');
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Verify ownership and private status
    const { data: pluginResult, error: pluginError } = await tenantDb
      .from('plugin_registry')
      .select('id, creator_id, is_public, name')
      .eq('id', id)
      .maybeSingle();

    if (pluginError || !pluginResult) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    if (pluginResult.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this plugin'
      });
    }

    if (pluginResult.is_public) {
      return res.status(400).json({
        success: false,
        error: 'Public plugins cannot be deleted. Use deprecate instead to maintain compatibility for existing users.'
      });
    }

    // Delete from all plugin_* tables (Supabase should handle CASCADE, but we delete explicitly)
    const tables = [
      'plugin_docs',
      'plugin_migrations',
      'plugin_controllers',
      'plugin_entities',
      'plugin_dependencies',
      'plugin_scripts'
    ];

    for (const table of tables) {
      try {
        await tenantDb.from(table).delete().eq('plugin_id', id);
      } catch (error) {
        console.warn(`Warning during deletion from ${table}:`, error.message);
      }
    }

    // Delete from plugin_registry
    await tenantDb.from('plugin_registry').delete().eq('id', id);

    // Also check and delete from UUID-based plugins table if exists
    try {
      const { data: uuidPlugin } = await tenantDb
        .from('plugins')
        .select('id')
        .eq('slug', id)
        .maybeSingle();

      if (uuidPlugin) {
        const uuidTables = [
          'plugin_configurations',
          'plugin_data',
          'plugin_routes',
          'plugin_admin_pages',
          'plugin_widgets',
          'plugin_events',
          'plugin_event_listeners',
          'plugin_hooks'
        ];

        for (const table of uuidTables) {
          try {
            await tenantDb.from(table).delete().eq('plugin_id', uuidPlugin.id);
          } catch (error) {
            console.warn(`Warning during UUID plugin deletion from ${table}:`, error.message);
          }
        }

        // Delete from plugins table
        await tenantDb.from('plugins').delete().eq('id', uuidPlugin.id);
      }
    } catch (error) {
      console.warn(`Could not check UUID plugins table:`, error.message);
    }

    res.json({
      success: true,
      message: `Plugin "${pluginResult.name}" has been permanently deleted from all plugin_* tables.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;