// backend/src/routes/plugin-api.js
const express = require('express');
const router = express.Router();
const PluginExecutor = require('../core/PluginExecutor');
const PluginPurchaseService = require('../services/PluginPurchaseService');
const { sequelize } = require('../database/connection');

/**
 * GET /api/plugins/widgets
 * Get all available plugin widgets for slot editor
 */
router.get('/widgets', async (req, res) => {
  try {
    // TODO: Get tenantId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';

    const widgets = await PluginExecutor.getAvailableWidgets(tenantId);

    res.json({
      success: true,
      widgets
    });
  } catch (error) {
    console.error('Failed to get widgets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/widgets/:widgetId
 * Get a specific widget by ID
 */
router.get('/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    // TODO: Get tenantId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';

    const widget = await PluginExecutor.loadWidget(widgetId, tenantId);

    res.json({
      success: true,
      widget
    });
  } catch (error) {
    console.error('Failed to get widget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/marketplace
 * Get all marketplace plugins
 */
router.get('/marketplace', async (req, res) => {
  try {
    const plugins = await sequelize.query(`
      SELECT
        id, name, slug, version, description, author_id, category,
        pricing_model, base_price, monthly_price, yearly_price, currency,
        license_type, downloads, active_installations, rating, reviews_count,
        icon_url, screenshots
      FROM plugin_marketplace
      WHERE status = 'approved'
      ORDER BY downloads DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      plugins
    });
  } catch (error) {
    console.error('Failed to get marketplace plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/purchase
 * Purchase a plugin from marketplace
 */
router.post('/purchase', async (req, res) => {
  try {
    const { pluginId, selectedPlan } = req.body;
    // TODO: Get tenantId and userId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';
    const userId = req.user?.id || 'default-user';

    const result = await PluginPurchaseService.purchasePlugin(
      pluginId,
      tenantId,
      selectedPlan,
      userId
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Failed to purchase plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/installed
 * Get all installed plugins for current tenant
 */
router.get('/installed', async (req, res) => {
  try {
    // TODO: Get tenantId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';

    const plugins = await sequelize.query(`
      SELECT * FROM plugins
      WHERE status = 'active'
      ORDER BY installed_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      plugins
    });
  } catch (error) {
    console.error('Failed to get installed plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/registry
 * Get all active plugins with their hooks and events (for App.jsx initialization)
 */
router.get('/registry', async (req, res) => {
  try {
    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { status } = req.query;

    // Get plugins from plugin_registry table
    const whereClause = status === 'active' ? `WHERE status = 'active'` : '';
    const plugins = await sequelize.query(`
      SELECT
        id, name, version, description, author, category, status, type,
        manifest, config, created_at, updated_at
      FROM plugin_registry
      ${whereClause}
      ORDER BY created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Parse JSON fields and add generated_by_ai flag
    const parsedPlugins = plugins.map(plugin => {
      const manifest = typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest;
      const config = typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config;

      return {
        ...plugin,
        generated_by_ai: manifest?.generated_by_ai || plugin.type === 'ai-generated',
        hooks: config?.hooks || [],
        events: config?.events || []
      };
    });

    res.json({
      success: true,
      data: parsedPlugins
    });
  } catch (error) {
    console.error('Failed to get plugin registry:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/registry/:pluginId
 * Get a specific plugin with its hooks and events (for App.jsx initialization)
 */
router.get('/registry/:pluginId', async (req, res) => {
  try {
    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { pluginId } = req.params;

    // Get plugin details from plugin_registry
    const plugin = await sequelize.query(`
      SELECT * FROM plugin_registry WHERE id = $1
    `, {
      bind: [pluginId],
      type: sequelize.QueryTypes.SELECT
    });

    if (!plugin[0]) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    // Parse JSON fields
    const manifest = typeof plugin[0].manifest === 'string' ? JSON.parse(plugin[0].manifest) : plugin[0].manifest;
    const config = typeof plugin[0].config === 'string' ? JSON.parse(plugin[0].config) : plugin[0].config;
    const sourceCode = typeof plugin[0].source_code === 'string' ? JSON.parse(plugin[0].source_code) : plugin[0].source_code;

    // Extract files from manifest or source_code
    const generatedFiles = manifest?.generatedFiles || sourceCode || [];

    // Organize files by type for DeveloperPluginEditor
    const controllers = [];
    const models = [];
    const components = [];

    generatedFiles.forEach(file => {
      const fileName = file.name || '';
      const code = file.code || '';

      // Handle both "models/File.js" and "src/models/File.js" patterns
      const normalizedPath = fileName.replace(/^src\//, '');

      if (normalizedPath.includes('controllers/') || normalizedPath.endsWith('Controller.js')) {
        controllers.push({
          name: normalizedPath.split('/').pop().replace('.js', ''),
          code,
          path: fileName
        });
      } else if (normalizedPath.includes('models/') || normalizedPath.includes('Model.js')) {
        models.push({
          name: normalizedPath.split('/').pop().replace('.js', ''),
          code,
          path: fileName
        });
      } else if (normalizedPath.includes('components/') || normalizedPath.match(/\.(jsx|tsx)$/)) {
        components.push({
          name: normalizedPath.split('/').pop().replace(/\.(jsx?|tsx?)$/, ''),
          code,
          path: fileName
        });
      }
    });

    res.json({
      success: true,
      data: {
        ...plugin[0],
        generated_by_ai: manifest?.generated_by_ai || plugin[0].type === 'ai-generated',
        hooks: config?.hooks || [],
        events: config?.events || [],
        controllers,
        models,
        components,
        manifest,
        readme: manifest?.readme || '# Plugin Documentation'
      }
    });
  } catch (error) {
    console.error('Failed to get plugin details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/plugins/registry/:id/files
 * Update a specific file in a plugin
 */
router.put('/registry/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const { path, content } = req.body;

    // Get current plugin
    const plugin = await sequelize.query(`
      SELECT * FROM plugin_registry WHERE id = $1
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    if (!plugin[0]) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    // Normalize paths for comparison
    const normalizePath = (p) => p.replace(/^\/+/, '').replace(/^src\//, '');
    const normalizedRequestPath = normalizePath(path);

    // Special handling for manifest.json - update the manifest field directly
    if (normalizedRequestPath === 'manifest.json') {
      try {
        const updatedManifest = JSON.parse(content);

        await sequelize.query(`
          UPDATE plugin_registry
          SET manifest = $1, updated_at = NOW()
          WHERE id = $2
        `, {
          bind: [JSON.stringify(updatedManifest), id],
          type: sequelize.QueryTypes.UPDATE
        });

        return res.json({
          success: true,
          message: 'Manifest updated successfully'
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in manifest.json: ' + error.message
        });
      }
    }

    // Parse source_code for regular files
    const sourceCode = typeof plugin[0].source_code === 'string'
      ? JSON.parse(plugin[0].source_code)
      : plugin[0].source_code || [];

    // Find and update the file
    let fileFound = false;
    const updatedFiles = sourceCode.map(file => {
      const normalizedFilePath = normalizePath(file.name);
      if (normalizedFilePath === normalizedRequestPath) {
        fileFound = true;
        return { ...file, code: content };
      }
      return file;
    });

    // If file not found, add it
    if (!fileFound) {
      updatedFiles.push({
        name: normalizedRequestPath,
        code: content
      });
    }

    // Also update manifest.generatedFiles if it exists
    const manifest = typeof plugin[0].manifest === 'string'
      ? JSON.parse(plugin[0].manifest)
      : plugin[0].manifest || {};

    if (manifest.generatedFiles) {
      manifest.generatedFiles = updatedFiles;
    }

    // Special handling for event files - also update config.events
    const config = typeof plugin[0].config === 'string'
      ? JSON.parse(plugin[0].config)
      : plugin[0].config || { hooks: [], events: [] };

    // Check if this is an event file (e.g., events/cart.viewed.js)
    if (normalizedRequestPath.startsWith('events/')) {
      const eventName = normalizedRequestPath.replace('events/', '').replace('.js', '');

      // Update the corresponding event in config
      if (config.events && Array.isArray(config.events)) {
        const eventIndex = config.events.findIndex(e => e.event_name === eventName);
        if (eventIndex !== -1) {
          config.events[eventIndex].listener_code = content;
        }
      }
    }

    // Update database with both source_code, manifest, and config
    await sequelize.query(`
      UPDATE plugin_registry
      SET source_code = $1, manifest = $2, config = $3, updated_at = NOW()
      WHERE id = $4
    `, {
      bind: [JSON.stringify(updatedFiles), JSON.stringify(manifest), JSON.stringify(config), id],
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: 'File updated successfully'
    });
  } catch (error) {
    console.error('Failed to update file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/plugins/registry/:id/status
 * Toggle plugin status
 */
router.patch('/registry/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await sequelize.query(`
      UPDATE plugin_registry
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, {
      bind: [status, id],
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: `Plugin ${status === 'active' ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Failed to update plugin status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/plugins/registry/:id
 * Delete a plugin
 */
router.delete('/registry/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(`
      DELETE FROM plugin_registry WHERE id = $1
    `, {
      bind: [id],
      type: sequelize.QueryTypes.DELETE
    });

    res.json({
      success: true,
      message: 'Plugin deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/registry
 * Create a new plugin
 */
router.post('/registry', async (req, res) => {
  try {
    const pluginData = req.body;
    const id = `${Date.now()}-${pluginData.name.toLowerCase().replace(/\s+/g, '-')}`;

    // Build manifest and config
    const manifest = {
      name: pluginData.name,
      version: pluginData.version || '1.0.0',
      generated_by_ai: pluginData.generated_by_ai || false,
      ...pluginData
    };

    const config = {
      hooks: pluginData.hooks || [],
      events: pluginData.events || []
    };

    await sequelize.query(`
      INSERT INTO plugin_registry (
        id, name, version, description, author, category, status, type, framework,
        manifest, config, source_code, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      )
    `, {
      bind: [
        id,
        pluginData.name,
        pluginData.version || '1.0.0',
        pluginData.description,
        pluginData.author || 'Unknown',
        pluginData.category || 'utility',
        pluginData.status || 'active',
        pluginData.generated_by_ai ? 'ai-generated' : 'custom',
        'react',
        JSON.stringify(manifest),
        JSON.stringify(config),
        JSON.stringify(pluginData.generatedFiles || [])
      ],
      type: sequelize.QueryTypes.INSERT
    });

    res.json({
      success: true,
      message: 'Plugin created successfully',
      id
    });
  } catch (error) {
    console.error('Failed to create plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
