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

module.exports = router;