// backend/src/routes/plugin-api.js
const express = require('express');
const router = express.Router();
const PluginExecutor = require('../core/PluginExecutor');
const PluginPurchaseService = require('../services/PluginPurchaseService');
const { sequelize } = require('../database/connection');

/**
 * GET /api/plugins
 * Get ALL plugins (installed + available) from plugins table
 */
router.get('/', async (req, res) => {
  try {
    const plugins = await sequelize.query(`
      SELECT * FROM plugins
      ORDER BY created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      plugins
    });
  } catch (error) {
    console.error('Failed to get plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
 * GET /api/plugins/active
 * Get active plugins from normalized tables (for App.jsx initialization)
 * This endpoint loads plugins with their events from the new normalized structure
 */
router.get('/active', async (req, res) => {
  try {
    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    console.log('🔌 Loading active plugins from normalized tables...');

    // Get active plugins from plugin_registry table
    const plugins = await sequelize.query(`
      SELECT
        id, name, version, description, author, category, status, type,
        manifest, created_at, updated_at
      FROM plugin_registry
      WHERE status = 'active'
      ORDER BY created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📦 Found ${plugins.length} active plugins`);

    // Load hooks and events for each plugin from normalized tables
    const pluginsWithData = await Promise.all(plugins.map(async (plugin) => {
      // Load hooks from plugin_hooks table (normalized structure)
      let hooks = [];
      try {
        const hooksResult = await sequelize.query(`
          SELECT hook_name, handler_function, priority, is_enabled
          FROM plugin_hooks
          WHERE plugin_id = $1 AND is_enabled = true
          ORDER BY priority ASC
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.SELECT
        });

        hooks = hooksResult.map(h => ({
          hook_name: h.hook_name,
          handler_code: h.handler_function,
          priority: h.priority || 10,
          enabled: h.is_enabled !== false
        }));

        console.log(`  ✅ ${plugin.name}: loaded ${hooks.length} hooks from plugin_hooks table`);
      } catch (hookError) {
        console.log(`  ⚠️ ${plugin.name}: plugin_hooks table error`);
      }

      // Load events from normalized plugin_events table
      let events = [];
      try {
        const eventsResult = await sequelize.query(`
          SELECT event_name, listener_function, priority, is_enabled
          FROM plugin_events
          WHERE plugin_id = $1 AND is_enabled = true
          ORDER BY priority ASC
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.SELECT
        });

        events = eventsResult.map(e => ({
          event_name: e.event_name,
          listener_code: e.listener_function,
          priority: e.priority || 10,
          enabled: e.is_enabled !== false
        }));

        console.log(`  ✅ ${plugin.name}: loaded ${events.length} events from plugin_events table`);
      } catch (eventError) {
        console.log(`  ⚠️ ${plugin.name}: plugin_events table error`);
      }

      // Parse manifest
      const manifest = typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest;

      return {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        category: plugin.category,
        status: plugin.status,
        type: plugin.type,
        generated_by_ai: manifest?.generated_by_ai || plugin.type === 'ai-generated',
        hooks: hooks,
        events: events
      };
    }));

    console.log('✅ All plugins loaded with hooks and events');

    res.json({
      success: true,
      data: pluginsWithData
    });
  } catch (error) {
    console.error('❌ Failed to get active plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/registry
 * Get all active plugins with their hooks and events (for App.jsx initialization)
 * LEGACY ENDPOINT - kept for backward compatibility, now uses normalized tables
 */
router.get('/registry', async (req, res) => {
  try {
    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { status } = req.query;

    // Get plugins from plugin_registry table (removed config column - doesn't exist in normalized structure)
    const whereClause = status === 'active' ? `WHERE status = 'active'` : '';
    const plugins = await sequelize.query(`
      SELECT
        id, name, version, description, author, category, status, type,
        manifest, created_at, updated_at
      FROM plugin_registry
      ${whereClause}
      ORDER BY created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📦 [LEGACY] Found ${plugins.length} plugins`);

    // Load hooks and events from normalized tables (same as /active endpoint)
    const pluginsWithData = await Promise.all(plugins.map(async (plugin) => {
      // Load hooks from plugin_hooks table
      let hooks = [];
      try {
        const hooksResult = await sequelize.query(`
          SELECT hook_name, handler_function, priority, is_enabled
          FROM plugin_hooks
          WHERE plugin_id = $1 AND is_enabled = true
          ORDER BY priority ASC
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.SELECT
        });

        hooks = hooksResult.map(h => ({
          hook_name: h.hook_name,
          handler_code: h.handler_function,
          priority: h.priority || 10,
          enabled: h.is_enabled !== false
        }));
      } catch (hookError) {
      }

      // Load events from plugin_events table
      let events = [];
      try {
        const eventsResult = await sequelize.query(`
          SELECT event_name, listener_function, priority, is_enabled
          FROM plugin_events
          WHERE plugin_id = $1 AND is_enabled = true
          ORDER BY priority ASC
        `, {
          bind: [plugin.id],
          type: sequelize.QueryTypes.SELECT
        });

        events = eventsResult.map(e => ({
          event_name: e.event_name,
          listener_code: e.listener_function,
          priority: e.priority || 10,
          enabled: e.is_enabled !== false
        }));
      } catch (eventError) {
      }

      const manifest = typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest;

      return {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        category: plugin.category,
        status: plugin.status,
        type: plugin.type,
        generated_by_ai: manifest?.generated_by_ai || plugin.type === 'ai-generated',
        hooks: hooks,
        events: events
      };
    }));

    console.log('✅ [LEGACY] All plugins loaded with hooks and events');

    res.json({
      success: true,
      data: pluginsWithData
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
 * GET /api/plugins/active/:pluginId
 * Get a specific active plugin from normalized tables (for App.jsx initialization)
 */
router.get('/active/:pluginId', async (req, res) => {
  try {
    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { pluginId } = req.params;

    console.log(`🔍 Loading plugin ${pluginId} from normalized tables...`);

    // Get plugin details from plugin_registry
    const plugin = await sequelize.query(`
      SELECT * FROM plugin_registry WHERE id = $1 AND status = 'active'
    `, {
      bind: [pluginId],
      type: sequelize.QueryTypes.SELECT
    });

    if (!plugin[0]) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found or not active'
      });
    }

    // Load hooks from plugin_hooks table (normalized structure)
    let hooks = [];
    try {
      const hooksResult = await sequelize.query(`
        SELECT hook_name, handler_function, priority, is_enabled
        FROM plugin_hooks
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY priority ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      hooks = hooksResult.map(h => ({
        hook_name: h.hook_name,
        handler_code: h.handler_function,
        priority: h.priority || 10,
        enabled: h.is_enabled !== false
      }));

      console.log(`  ✅ Loaded ${hooks.length} hooks from plugin_hooks table`);
    } catch (hookError) {
      console.log(`  ⚠️ plugin_hooks table error:`, hookError.message);
    }

    // Load events from plugin_events table (normalized structure)
    let events = [];
    try {
      const eventsResult = await sequelize.query(`
        SELECT event_name, listener_function, priority, is_enabled
        FROM plugin_events
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY priority ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      events = eventsResult.map(e => ({
        event_name: e.event_name,
        listener_code: e.listener_function,
        priority: e.priority || 10,
        enabled: e.is_enabled !== false
      }));

      console.log(`  ✅ Loaded ${events.length} events from plugin_events table`);
    } catch (eventError) {
      console.log(`  ⚠️ plugin_events table error:`, eventError.message);
    }

    // Parse JSON fields
    const manifest = typeof plugin[0].manifest === 'string' ? JSON.parse(plugin[0].manifest) : plugin[0].manifest;

    res.json({
      success: true,
      data: {
        id: plugin[0].id,
        name: plugin[0].name,
        version: plugin[0].version,
        description: plugin[0].description,
        author: plugin[0].author,
        category: plugin[0].category,
        status: plugin[0].status,
        type: plugin[0].type,
        generated_by_ai: manifest?.generated_by_ai || plugin[0].type === 'ai-generated',
        hooks: hooks,
        events: events,
        manifest: manifest
      }
    });
  } catch (error) {
    console.error('❌ Failed to get plugin details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/registry/:pluginId
 * Get a specific plugin with its hooks and events (for UnifiedPluginManager)
 * LEGACY ENDPOINT - updated to use normalized tables
 */
router.get('/registry/:pluginId', async (req, res) => {
  try {
    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { pluginId } = req.params;

    console.log(`🔍 [LEGACY DETAIL] Loading plugin ${pluginId}...`);

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

    // Load hooks from plugin_hooks table (normalized structure)
    let hooks = [];
    try {
      const hooksResult = await sequelize.query(`
        SELECT hook_name, handler_function, priority, is_enabled
        FROM plugin_hooks
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY priority ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      hooks = hooksResult.map(h => ({
        hook_name: h.hook_name,
        handler_code: h.handler_function,
        priority: h.priority || 10,
        enabled: h.is_enabled !== false
      }));

      console.log(`  ✅ Loaded ${hooks.length} hooks from plugin_hooks table`);
    } catch (hookError) {
      console.log(`  ⚠️ plugin_hooks table error:`, hookError.message);
    }

    // Load event listeners from junction table (file-based event listeners)
    let eventListeners = [];
    try {
      const listenersResult = await sequelize.query(`
        SELECT file_name, file_path, event_name, listener_function, priority, is_enabled, description
        FROM plugin_event_listeners
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY file_name ASC, priority ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      eventListeners = listenersResult.map(l => ({
        file_name: l.file_name,
        file_path: l.file_path,
        event_name: l.event_name,
        listener_code: l.listener_function,
        priority: l.priority || 10,
        enabled: l.is_enabled !== false,
        description: l.description
      }));

      console.log(`  ✅ Loaded ${eventListeners.length} event listeners from plugin_event_listeners table`);
    } catch (listenerError) {
      console.log(`  ⚠️ plugin_event_listeners table error:`, listenerError.message);
    }

    // Parse JSON fields
    const manifest = typeof plugin[0].manifest === 'string' ? JSON.parse(plugin[0].manifest) : plugin[0].manifest;
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
        hooks: hooks,
        eventListeners: eventListeners, // File-based event listeners via junction table
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

    // Event files are now handled via plugin_event_listeners junction table only
    // No automatic filename-to-event conversion
    if (normalizedRequestPath.startsWith('events/')) {
      console.log(`⚠️ Event files must be created via plugin_event_listeners junction table`);
      return res.status(400).json({
        success: false,
        error: 'Event files must be created with event mapping. Use POST /api/plugins/:id/event-listeners instead.'
      });
    }

    // Special handling for hook files - update plugin_hooks table (normalized structure)
    if (normalizedRequestPath.startsWith('hooks/')) {
      const hookName = normalizedRequestPath.replace('hooks/', '').replace('.js', '').replace(/_/g, '.');

      console.log(`🔄 Upserting hook ${hookName} in plugin_hooks table...`);

      try {
        // Check if hook exists
        const existing = await sequelize.query(`
          SELECT id FROM plugin_hooks
          WHERE plugin_id = $1 AND hook_name = $2
        `, {
          bind: [id, hookName],
          type: sequelize.QueryTypes.SELECT
        });

        if (existing.length > 0) {
          // Update existing hook
          await sequelize.query(`
            UPDATE plugin_hooks
            SET handler_function = $1, updated_at = NOW()
            WHERE plugin_id = $2 AND hook_name = $3
          `, {
            bind: [content, id, hookName],
            type: sequelize.QueryTypes.UPDATE
          });
          console.log(`✅ Hook ${hookName} updated in plugin_hooks table`);
        } else {
          // Insert new hook
          await sequelize.query(`
            INSERT INTO plugin_hooks (plugin_id, hook_name, handler_function, priority, is_enabled, created_at, updated_at)
            VALUES ($1, $2, $3, 10, true, NOW(), NOW())
          `, {
            bind: [id, hookName, content],
            type: sequelize.QueryTypes.INSERT
          });
          console.log(`✅ Hook ${hookName} created in plugin_hooks table`);
        }

        return res.json({
          success: true,
          message: 'Hook file saved successfully in plugin_hooks table'
        });
      } catch (hookError) {
        console.error(`❌ Error upserting plugin_hooks table:`, hookError);
        return res.status(500).json({
          success: false,
          error: `Failed to save hook in plugin_hooks table: ${hookError.message}`
        });
      }
    }

    // For other files, update source_code and manifest fields
    await sequelize.query(`
      UPDATE plugin_registry
      SET source_code = $1, manifest = $2, updated_at = NOW()
      WHERE id = $3
    `, {
      bind: [JSON.stringify(updatedFiles), JSON.stringify(manifest), id],
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

/**
 * GET /api/plugins/:pluginId/scripts
 * Get all scripts for a plugin from plugin_scripts table
 */
router.get('/:pluginId/scripts', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { scope } = req.query; // 'frontend', 'backend', 'admin'

    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    console.log(`📄 Loading scripts for plugin ${pluginId}${scope ? ` (scope: ${scope})` : ''}...`);

    // Build query
    let query = `
      SELECT file_name, file_content, script_type, scope, load_priority
      FROM plugin_scripts
      WHERE plugin_id = $1 AND is_enabled = true
    `;

    const params = [pluginId];

    if (scope) {
      query += ` AND scope = $2`;
      params.push(scope);
    }

    query += ` ORDER BY load_priority ASC`;

    const scripts = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`  ✅ Found ${scripts.length} scripts`);

    res.json({
      success: true,
      data: scripts.map(s => ({
        name: s.file_name,
        content: s.file_content,
        type: s.script_type,
        scope: s.scope,
        priority: s.load_priority
      }))
    });
  } catch (error) {
    console.error('❌ Failed to get plugin scripts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:pluginId/event-listeners
 * Create or update an event listener mapping
 */
router.post('/:pluginId/event-listeners', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { file_name, file_path, event_name, listener_function, priority = 10, description } = req.body;

    if (!file_name || !file_path || !event_name || !listener_function) {
      return res.status(400).json({
        success: false,
        error: 'file_name, file_path, event_name, and listener_function are required'
      });
    }

    console.log(`📡 Creating event listener: ${file_name} → ${event_name}`);

    // Check if mapping already exists
    const existing = await sequelize.query(`
      SELECT id FROM plugin_event_listeners
      WHERE plugin_id = $1 AND file_name = $2 AND event_name = $3
    `, {
      bind: [pluginId, file_name, event_name],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      // Update existing
      await sequelize.query(`
        UPDATE plugin_event_listeners
        SET listener_function = $1, priority = $2, description = $3, updated_at = NOW()
        WHERE plugin_id = $4 AND file_name = $5 AND event_name = $6
      `, {
        bind: [listener_function, priority, description, pluginId, file_name, event_name],
        type: sequelize.QueryTypes.UPDATE
      });

      console.log(`✅ Updated event listener: ${file_name} → ${event_name}`);
    } else {
      // Insert new
      await sequelize.query(`
        INSERT INTO plugin_event_listeners
        (plugin_id, file_name, file_path, event_name, listener_function, priority, description, is_enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      `, {
        bind: [pluginId, file_name, file_path, event_name, listener_function, priority, description],
        type: sequelize.QueryTypes.INSERT
      });

      console.log(`✅ Created event listener: ${file_name} → ${event_name}`);
    }

    res.json({
      success: true,
      message: 'Event listener saved successfully'
    });
  } catch (error) {
    console.error('❌ Failed to save event listener:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/plugins/:pluginId/event-listeners/:fileName/event
 * Update the event name for a specific file
 */
router.put('/:pluginId/event-listeners/:fileName/event', async (req, res) => {
  try {
    const { pluginId, fileName } = req.params;
    const { old_event_name, new_event_name, priority, description } = req.body;

    if (!old_event_name || !new_event_name) {
      return res.status(400).json({
        success: false,
        error: 'old_event_name and new_event_name are required'
      });
    }

    console.log(`📡 Updating event mapping: ${fileName} from ${old_event_name} → ${new_event_name}`);

    // Update the event name
    const updateFields = ['event_name = $1', 'updated_at = NOW()'];
    const binds = [new_event_name];
    let bindIndex = 2;

    if (priority !== undefined) {
      updateFields.push(`priority = $${bindIndex}`);
      binds.push(priority);
      bindIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${bindIndex}`);
      binds.push(description);
      bindIndex++;
    }

    binds.push(pluginId, fileName, old_event_name);

    await sequelize.query(`
      UPDATE plugin_event_listeners
      SET ${updateFields.join(', ')}
      WHERE plugin_id = $${bindIndex} AND file_name = $${bindIndex + 1} AND event_name = $${bindIndex + 2}
    `, {
      bind: binds,
      type: sequelize.QueryTypes.UPDATE
    });

    console.log(`✅ Updated event mapping successfully`);

    res.json({
      success: true,
      message: 'Event mapping updated successfully'
    });
  } catch (error) {
    console.error('❌ Failed to update event mapping:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/plugins/:pluginId/event-listeners/:fileName/:eventName
 * Delete an event listener mapping
 */
router.delete('/:pluginId/event-listeners/:fileName/:eventName', async (req, res) => {
  try {
    const { pluginId, fileName, eventName } = req.params;

    console.log(`📡 Deleting event listener: ${fileName} → ${eventName}`);

    await sequelize.query(`
      DELETE FROM plugin_event_listeners
      WHERE plugin_id = $1 AND file_name = $2 AND event_name = $3
    `, {
      bind: [pluginId, fileName, eventName],
      type: sequelize.QueryTypes.DELETE
    });

    console.log(`✅ Deleted event listener successfully`);

    res.json({
      success: true,
      message: 'Event listener deleted successfully'
    });
  } catch (error) {
    console.error('❌ Failed to delete event listener:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
