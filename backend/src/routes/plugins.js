const express = require('express');
const router = express.Router();
const pluginManager = require('../core/PluginManager');
const { authMiddleware } = require('../middleware/auth');

// All plugin routes require authentication
router.use(authMiddleware);

/**
 * GET /api/plugins
 * Get all available plugins and integrations
 */
router.get('/', async (req, res) => {
  try {
    const plugins = pluginManager.getAllPlugins();
    const status = pluginManager.getStatus();
    
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
 * Uninstall a plugin
 */
router.post('/:name/uninstall', async (req, res) => {
  try {
    const { name } = req.params;
    
    await pluginManager.uninstallPlugin(name);
    
    res.json({
      success: true,
      message: `Plugin ${name} uninstalled successfully`
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
 * GET /api/plugins/marketplace
 * Get marketplace plugins
 */
router.get('/marketplace', async (req, res) => {
  try {
    const marketplacePlugins = Array.from(pluginManager.marketplace.values());
    
    res.json({
      success: true,
      data: marketplacePlugins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


module.exports = router;