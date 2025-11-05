const express = require('express');
const router = express.Router();
const pluginManager = require('../core/PluginManager');
const { authMiddleware } = require('../middleware/auth');
const { sequelize } = require('../database/connection');

// Create a separate router for store-specific plugin routes
const storePluginRouter = express.Router({ mergeParams: true });

/**
 * GET /api/stores/:store_id/plugins
 * Get all plugins for a specific store with store-specific configuration
 */
storePluginRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.params;
    console.log(`📦 Fetching plugins for store: ${store_id}`);

    // Query plugin_registry for all plugins
    const pluginsQuery = `
      SELECT
        pr.*,
        pc.is_enabled as store_enabled,
        pc.config_data as store_config
      FROM plugin_registry pr
      LEFT JOIN plugin_configurations pc
        ON pr.id = pc.plugin_id AND pc.store_id = $1
      WHERE pr.deprecated_at IS NULL
      ORDER BY pr.created_at DESC
    `;

    const plugins = await sequelize.query(pluginsQuery, {
      bind: [store_id],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`✅ Found ${plugins.length} plugins for store ${store_id}`);

    res.json({
      success: true,
      data: {
        plugins: plugins
      }
    });
  } catch (error) {
    console.error('❌ Error fetching store plugins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store plugins',
      error: error.message
    });
  }
});

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

    // Verify ownership
    const [pluginResult] = await sequelize.query(
      'SELECT id, name, creator_id FROM plugin_registry WHERE id = :id',
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!pluginResult) {
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
    await sequelize.query(
      'UPDATE plugin_registry SET is_public = :is_public, updated_at = CURRENT_TIMESTAMP WHERE id = :id',
      {
        replacements: { is_public, id },
        type: sequelize.QueryTypes.UPDATE
      }
    );

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

    // Verify ownership and public status
    const [pluginResult] = await sequelize.query(
      'SELECT id, creator_id, is_public, name FROM plugin_registry WHERE id = :id',
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!pluginResult) {
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
    await sequelize.query(
      'UPDATE plugin_registry SET deprecated_at = CURRENT_TIMESTAMP, deprecation_reason = :reason, updated_at = CURRENT_TIMESTAMP WHERE id = :id',
      {
        replacements: { reason: reason || 'Plugin deprecated by creator', id },
        type: sequelize.QueryTypes.UPDATE
      }
    );

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

    // Verify ownership and private status
    const [pluginResult] = await sequelize.query(
      'SELECT id, creator_id, is_public, name FROM plugin_registry WHERE id = :id',
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!pluginResult) {
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

    // Delete from all plugin_* tables
    // Note: Most tables have ON DELETE CASCADE, but we explicitly delete to ensure cleanup
    const deletionSteps = [
      // Tables referencing plugin_registry (VARCHAR id)
      'DELETE FROM plugin_docs WHERE plugin_id = :id',
      'DELETE FROM plugin_migrations WHERE plugin_id = :id',
      'DELETE FROM plugin_controllers WHERE plugin_id = :id',
      'DELETE FROM plugin_entities WHERE plugin_id = :id',
      'DELETE FROM plugin_dependencies WHERE plugin_id = :id',
      'DELETE FROM plugin_scripts WHERE plugin_id = :id',

      // Final deletion from plugin_registry
      'DELETE FROM plugin_registry WHERE id = :id'
    ];

    // Execute all deletions
    for (const query of deletionSteps) {
      try {
        await sequelize.query(query, {
          replacements: { id },
          type: sequelize.QueryTypes.DELETE
        });
      } catch (error) {
        console.warn(`Warning during deletion: ${error.message}`);
        // Continue with other deletions even if one fails
      }
    }

    // Also check and delete from UUID-based plugins table if exists
    try {
      const [uuidPlugin] = await sequelize.query(
        'SELECT id FROM plugins WHERE slug = :slug',
        {
          replacements: { slug: id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (uuidPlugin) {
        const uuidDeletionSteps = [
          // Tables referencing plugins (UUID id)
          'DELETE FROM plugin_configurations WHERE plugin_id = :uuid',
          'DELETE FROM plugin_data WHERE plugin_id = :uuid',
          'DELETE FROM plugin_routes WHERE plugin_id = :uuid',
          'DELETE FROM plugin_admin_pages WHERE plugin_id = :uuid',
          'DELETE FROM plugin_widgets WHERE plugin_id = :uuid',
          'DELETE FROM plugin_events WHERE plugin_id = :uuid',
          'DELETE FROM plugin_event_listeners WHERE plugin_id = :uuid',
          'DELETE FROM plugin_hooks WHERE plugin_id = :uuid',

          // Final deletion from plugins table
          'DELETE FROM plugins WHERE id = :uuid'
        ];

        for (const query of uuidDeletionSteps) {
          try {
            await sequelize.query(query, {
              replacements: { uuid: uuidPlugin.id },
              type: sequelize.QueryTypes.DELETE
            });
          } catch (error) {
            console.warn(`Warning during UUID plugin deletion: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not check UUID plugins table: ${error.message}`);
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
module.exports.storePluginRouter = storePluginRouter;