const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const pluginManager = require('../core/PluginManager');
const PluginSandbox = require('../core/PluginSandbox');
const PluginConfiguration = require('../models/PluginConfiguration');
const Plugin = require('../models/Plugin');
const { authMiddleware } = require('../middleware/auth');

// Plugin sandbox instance
const sandbox = new PluginSandbox({
  timeout: 5000,
  maxOutputLength: 50000
});

/**
 * GET /api/stores/:store_id/plugins/hooks/:hookName
 * Get all plugins enabled for a specific hook
 */
router.get('/hooks/:hookName', async (req, res) => {
  try {
    const { store_id: storeId, hookName } = req.params;

    console.log(`🔌 Getting plugins for hook ${hookName} in store ${storeId}`);

    // Get enabled plugins for this store
    const enabledConfigs = await PluginConfiguration.getEnabledPluginsForStore(storeId);
    
    if (enabledConfigs.length === 0) {
      return res.json({
        success: true,
        data: { plugins: [] }
      });
    }

    // Get plugin details
    const pluginIds = enabledConfigs.map(config => config.pluginId);
    const plugins = await Plugin.findAll({
      where: { id: pluginIds }
    });

    // Filter plugins that support this hook
    const hookPlugins = [];
    
    for (const plugin of plugins) {
      try {
        // Read plugin manifest to check hooks
        const pluginDir = path.join(__dirname, '../../plugins', plugin.slug);
        const manifestPath = path.join(pluginDir, 'manifest.json');
        
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          
          // Check if plugin supports this hook
          if (manifest.hooks && (
            manifest.hooks[hookName] || 
            (Array.isArray(manifest.hooks) && manifest.hooks.includes(hookName))
          )) {
            const config = enabledConfigs.find(c => c.pluginId === plugin.id);
            
            hookPlugins.push({
              id: plugin.id,
              name: plugin.name,
              slug: plugin.slug,
              category: plugin.category,
              version: plugin.version,
              configuration: config?.configData || {},
              priority: config?.priority || 0
            });
          }
        }
      } catch (error) {
        console.error(`Error checking plugin ${plugin.slug} for hook ${hookName}:`, error);
      }
    }

    // Sort by priority
    hookPlugins.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    console.log(`✅ Found ${hookPlugins.length} plugins for hook ${hookName}`);

    res.json({
      success: true,
      data: {
        hookName,
        storeId,
        plugins: hookPlugins
      }
    });

  } catch (error) {
    console.error('Get hook plugins error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/plugins/:pluginSlug/render
 * Render plugin content for a specific hook
 */
router.post('/:pluginSlug/render', async (req, res) => {
  try {
    const { store_id: storeId, pluginSlug } = req.params;
    const { hookName, context = {} } = req.body;

    console.log(`🎨 Rendering plugin ${pluginSlug} for hook ${hookName}`);

    // Get plugin from database
    const plugin = await Plugin.findBySlug(pluginSlug);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    // Get plugin configuration for this store
    const config = await PluginConfiguration.findByPluginAndStore(plugin.id, storeId);
    if (!config || !config.isEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Plugin not enabled for this store'
      });
    }

    // Read plugin code
    const pluginDir = path.join(__dirname, '../../plugins', plugin.slug);
    const pluginFile = path.join(pluginDir, 'index.js');
    
    if (!fs.existsSync(pluginFile)) {
      return res.status(500).json({
        success: false,
        error: 'Plugin code file not found'
      });
    }

    const pluginCode = fs.readFileSync(pluginFile, 'utf8');

    // Validate plugin code
    const codeValidation = sandbox.validatePluginCode(pluginCode);
    if (!codeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Plugin code validation failed',
        details: codeValidation.errors
      });
    }

    // Prepare execution context
    const executionContext = {
      store: {
        id: storeId,
        name: context.storeName || 'Store'
      },
      user: context.user || null,
      page: context.page || {},
      product: context.product || null,
      cart: context.cart || null,
      ...context
    };

    // Execute plugin in sandbox
    const result = await sandbox.executePlugin(
      pluginCode,
      hookName,
      config.configData,
      executionContext
    );

    if (!result.success) {
      console.error(`Plugin execution failed for ${pluginSlug}:`, result.error);
      return res.status(500).json({
        success: false,
        error: 'Plugin execution failed',
        details: result.error,
        logs: result.logs
      });
    }

    console.log(`✅ Plugin ${pluginSlug} rendered successfully (${result.executionTime}ms)`);

    res.json({
      success: true,
      content: result.output,
      executionTime: result.executionTime,
      logs: result.logs
    });

  } catch (error) {
    console.error('Plugin render error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stores/:store_id/plugins/:pluginSlug/assets/:fileName
 * Serve plugin static assets (CSS, images, etc.)
 */
router.get('/:pluginSlug/assets/:fileName', async (req, res) => {
  try {
    const { pluginSlug, fileName } = req.params;

    // Validate file name to prevent path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file name'
      });
    }

    const pluginDir = path.join(__dirname, '../../plugins', pluginSlug);
    const filePath = path.join(pluginDir, fileName);

    // Check if file exists and is in plugin directory
    if (!fs.existsSync(filePath) || !filePath.startsWith(pluginDir)) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Set appropriate content type
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Set caching headers
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Plugin asset serve error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/plugins/render-multiple
 * Render multiple plugins for a hook at once (for performance)
 */
router.post('/render-multiple', async (req, res) => {
  try {
    const { store_id: storeId } = req.params;
    const { hookName, context = {}, pluginSlugs = [] } = req.body;

    console.log(`🎨 Batch rendering ${pluginSlugs.length} plugins for hook ${hookName}`);

    const results = [];

    for (const pluginSlug of pluginSlugs) {
      try {
        // This would ideally be parallelized
        const renderResponse = await router.handle({
          params: { store_id: storeId, pluginSlug },
          body: { hookName, context }
        });

        results.push({
          pluginSlug,
          success: true,
          content: renderResponse.content,
          executionTime: renderResponse.executionTime
        });
      } catch (error) {
        results.push({
          pluginSlug,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        hookName,
        results,
        totalExecutionTime: results.reduce((sum, r) => sum + (r.executionTime || 0), 0)
      }
    });

  } catch (error) {
    console.error('Batch plugin render error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/hooks
 * Get all available hooks (public endpoint)
 */
router.get('/hooks', async (req, res) => {
  try {
    const hooks = {
      homepage: [
        { name: 'homepage_header', display: 'Homepage Header', description: 'Top of homepage' },
        { name: 'homepage_hero', display: 'Homepage Hero', description: 'Main hero section' },
        { name: 'homepage_content', display: 'Homepage Content', description: 'Main content area' },
        { name: 'homepage_footer', display: 'Homepage Footer', description: 'Bottom of homepage' }
      ],
      product: [
        { name: 'product_page_header', display: 'Product Header', description: 'Top of product pages' },
        { name: 'product_page_actions', display: 'Product Actions', description: 'Near add to cart button' },
        { name: 'product_page_footer', display: 'Product Footer', description: 'Bottom of product pages' }
      ],
      cart: [
        { name: 'cart_header', display: 'Cart Header', description: 'Top of cart page' },
        { name: 'cart_sidebar', display: 'Cart Sidebar', description: 'Cart sidebar area' },
        { name: 'cart_footer', display: 'Cart Footer', description: 'Bottom of cart' }
      ],
      checkout: [
        { name: 'checkout_header', display: 'Checkout Header', description: 'Top of checkout' },
        { name: 'checkout_steps', display: 'Checkout Steps', description: 'During checkout process' },
        { name: 'checkout_success', display: 'Checkout Success', description: 'Order confirmation page' }
      ],
      global: [
        { name: 'global_header', display: 'Global Header', description: 'All pages header' },
        { name: 'global_footer', display: 'Global Footer', description: 'All pages footer' }
      ]
    };

    res.json({
      success: true,
      data: hooks
    });
  } catch (error) {
    console.error('Get hooks error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;