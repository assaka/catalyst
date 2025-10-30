const express = require('express');
const router = express.Router();
const pluginManager = require('../core/PluginManager');
const { authMiddleware } = require('../middleware/auth');

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

    const db = require('../config/database');

    // Verify ownership
    const pluginResult = await db.query(
      'SELECT id, name, creator_id FROM plugin_registry WHERE id = $1',
      [id]
    );

    if (pluginResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    const plugin = pluginResult.rows[0];
    if (plugin.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this plugin'
      });
    }

    // Update visibility
    await db.query(
      'UPDATE plugin_registry SET is_public = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [is_public, id]
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

    const db = require('../config/database');

    // Verify ownership and public status
    const pluginResult = await db.query(
      'SELECT id, creator_id, is_public, name FROM plugin_registry WHERE id = $1',
      [id]
    );

    if (pluginResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    const plugin = pluginResult.rows[0];
    if (plugin.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to deprecate this plugin'
      });
    }

    if (!plugin.is_public) {
      return res.status(400).json({
        success: false,
        error: 'Only public plugins can be deprecated. Use delete for private plugins.'
      });
    }

    // Deprecate plugin
    await db.query(
      'UPDATE plugin_registry SET deprecated_at = CURRENT_TIMESTAMP, deprecation_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [reason || 'Plugin deprecated by creator', id]
    );

    res.json({
      success: true,
      message: `Plugin "${plugin.name}" has been deprecated. Existing users can still use it.`
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
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = require('../config/database');

    // Verify ownership and private status
    const pluginResult = await db.query(
      'SELECT id, creator_id, is_public, name FROM plugin_registry WHERE id = $1',
      [id]
    );

    if (pluginResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    const plugin = pluginResult.rows[0];
    if (plugin.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this plugin'
      });
    }

    if (plugin.is_public) {
      return res.status(400).json({
        success: false,
        error: 'Public plugins cannot be deleted. Use deprecate instead to maintain compatibility for existing users.'
      });
    }

    // Delete plugin (CASCADE will handle plugin_scripts and plugin_dependencies)
    await db.query('DELETE FROM plugin_registry WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `Plugin "${plugin.name}" has been permanently deleted.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;