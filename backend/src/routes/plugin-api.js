// backend/src/routes/plugin-api.js
const express = require('express');
const router = express.Router();
const PluginExecutor = require('../core/PluginExecutor');
const PluginPurchaseService = require('../services/PluginPurchaseService');
const { sequelize } = require('../database/connection');

/**
 * GET /api/plugins
 * Get ALL plugins (installed + available) from plugin_registry table
 */
router.get('/', async (req, res) => {
  try {
    const plugins = await sequelize.query(`
      SELECT * FROM plugin_registry
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
    console.log('🎨 Loading all available widgets...');

    // Query plugin_widgets table
    const widgets = await sequelize.query(`
      SELECT w.widget_id, w.widget_name, w.description, w.category, w.icon,
             p.name as plugin_name, p.id as plugin_id
      FROM plugin_widgets w
      JOIN plugin_registry p ON w.plugin_id = p.id
      WHERE w.is_enabled = true AND p.status = 'active'
      ORDER BY w.widget_name ASC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`  ✅ Found ${widgets.length} widgets`);

    res.json({
      success: true,
      widgets: widgets.map(w => ({
        id: w.widget_id,
        name: w.widget_name,
        description: w.description,
        category: w.category || 'functional',
        icon: w.icon || 'Box',
        pluginName: w.plugin_name,
        pluginId: w.plugin_id
      }))
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

    console.log(`🎨 Loading widget: ${widgetId}`);

    // Query plugin_widgets table directly
    const widgets = await sequelize.query(`
      SELECT widget_id, widget_name, description, component_code, default_config, category, icon
      FROM plugin_widgets
      WHERE widget_id = $1 AND is_enabled = true
      LIMIT 1
    `, {
      bind: [widgetId],
      type: sequelize.QueryTypes.SELECT
    });

    if (widgets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }

    const widget = widgets[0];

    console.log(`  ✅ Found widget: ${widget.widget_name}`);

    res.json({
      success: true,
      widget: {
        id: widget.widget_id,
        name: widget.widget_name,
        description: widget.description,
        componentCode: widget.component_code,
        config: widget.default_config,
        category: widget.category,
        icon: widget.icon
      }
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
 * GET /api/plugins/starters
 * Get starter templates for AI Studio
 */
router.get('/starters', async (req, res) => {
  try {
    console.log('🎨 Loading starter templates...');

    const starters = await sequelize.query(`
      SELECT
        id, name, slug, version, description,
        starter_icon, starter_description, starter_prompt, starter_order
      FROM plugin_registry
      WHERE is_starter_template = true AND status = 'active'
      ORDER BY starter_order ASC, name ASC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`  ✅ Found ${starters.length} starter templates`);

    res.json({
      success: true,
      starters: starters.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.starter_description || s.description,
        icon: s.starter_icon || '🔌',
        prompt: s.starter_prompt || `Create a plugin like ${s.name}`,
        order: s.starter_order || 0
      }))
    });
  } catch (error) {
    console.error('Failed to get starter templates:', error);
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

    // Note: plugin_event_listeners table has been dropped - all events now in plugin_events

    // Load plugin_scripts from normalized table
    let pluginScripts = [];
    try {
      const scriptsResult = await sequelize.query(`
        SELECT id, script_type, scope, file_name, file_content, load_priority, is_enabled
        FROM plugin_scripts
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY file_name ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      pluginScripts = scriptsResult.map(s => ({
        name: s.file_name,
        code: s.file_content,
        script_type: s.script_type,
        scope: s.scope,
        load_priority: s.load_priority
      }));

      console.log(`  ✅ Loaded ${pluginScripts.length} scripts from plugin_scripts table`);
    } catch (scriptsError) {
      console.log(`  ⚠️ plugin_scripts table error:`, scriptsError.message);
    }

    // Load plugin_events from normalized table
    let pluginEvents = [];
    try {
      const eventsResult = await sequelize.query(`
        SELECT id, event_name, file_name, listener_function, priority, is_enabled
        FROM plugin_events
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY event_name ASC, priority ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      pluginEvents = eventsResult.map(e => ({
        name: e.file_name || `${e.event_name.replace(/\./g, '_')}.js`,  // Use custom filename or generate
        code: e.listener_function,
        event_name: e.event_name,
        priority: e.priority || 10
      }));

      console.log(`  ✅ Loaded ${pluginEvents.length} events from plugin_events table`);
    } catch (eventsError) {
      console.log(`  ⚠️ plugin_events table error:`, eventsError.message);
    }

    // Parse JSON fields
    const manifest = typeof plugin[0].manifest === 'string' ? JSON.parse(plugin[0].manifest) : plugin[0].manifest;
    const sourceCode = typeof plugin[0].source_code === 'string' ? JSON.parse(plugin[0].source_code) : plugin[0].source_code;

    // Merge files from multiple sources:
    // 1. manifest.generatedFiles (old format)
    // 2. source_code JSON field (old format)
    // 3. plugin_scripts table (new normalized format)
    // 4. plugin_events table (new normalized format)
    let allFiles = [];

    // Add files from JSON fields
    const jsonFiles = manifest?.generatedFiles || sourceCode || [];
    allFiles = allFiles.concat(jsonFiles);

    // Add files from plugin_scripts table
    allFiles = allFiles.concat(pluginScripts);

    // Add files from plugin_events table (as event files)
    const eventFiles = pluginEvents.map(e => ({
      name: `events/${e.name}`,
      code: e.code,
      event_name: e.event_name,  // Preserve event name for Edit Event button
      priority: e.priority        // Preserve priority
    }));
    allFiles = allFiles.concat(eventFiles);

    // Remove duplicates (prefer normalized table data over JSON data)
    const fileMap = new Map();
    allFiles.forEach(file => {
      const fileName = file.name || file.filename || '';
      if (!fileMap.has(fileName) || file.script_type || file.event_name) {
        // Prefer files from normalized tables (they have script_type or event_name)
        fileMap.set(fileName, file);
      }
    });

    const generatedFiles = Array.from(fileMap.values());

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

    // Add admin pages from plugin_admin_pages table if needed
    let adminPages = [];
    try {
      const adminPagesResult = await sequelize.query(`
        SELECT page_key, page_name, route, component_code, icon, category, description
        FROM plugin_admin_pages
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY page_key ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      adminPages = adminPagesResult;
      console.log(`  ✅ Loaded ${adminPages.length} admin pages from plugin_admin_pages table`);
    } catch (adminError) {
      console.log(`  ⚠️ plugin_admin_pages table error:`, adminError.message);
    }

    console.log(`\n📦 Sending response for ${pluginId}:`);
    console.log(`  📄 Generated Files: ${generatedFiles.length}`);
    console.log(`  📜 Scripts from DB: ${pluginScripts.length}`);
    console.log(`  📡 Events from DB: ${pluginEvents.length}`);
    console.log(`  🪝 Hooks: ${hooks.length}`);

    if (generatedFiles.length > 0) {
      console.log(`  📂 Files with metadata:`);
      generatedFiles.forEach(f => {
        console.log(`     - ${f.name}:`, {
          hasEventName: !!f.event_name,
          hasPriority: !!f.priority,
          hasScriptType: !!f.script_type
        });
      });
    }

    res.json({
      success: true,
      data: {
        ...plugin[0],
        generated_by_ai: manifest?.generated_by_ai || plugin[0].type === 'ai-generated',
        hooks: hooks,
        controllers,
        models,
        components,
        adminPages,
        manifest,
        readme: manifest?.readme || '# Plugin Documentation',
        source_code: generatedFiles // All files merged from JSON + normalized tables for FileTree
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
 * GET /api/plugins/:id/export
 * Export plugin as downloadable package
 */
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📦 Exporting plugin: ${id}`);

    // Get plugin metadata
    const plugin = await sequelize.query(`
      SELECT * FROM plugin_registry WHERE id = $1
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    if (plugin.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    const pluginData = plugin[0];

    // Get scripts
    const scripts = await sequelize.query(`
      SELECT file_name, file_content, script_type, scope, load_priority
      FROM plugin_scripts
      WHERE plugin_id = $1
      ORDER BY file_name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get events
    const events = await sequelize.query(`
      SELECT event_name, file_name, listener_function, priority
      FROM plugin_events
      WHERE plugin_id = $1
      ORDER BY event_name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get hooks
    const hooks = await sequelize.query(`
      SELECT hook_name, hook_type, handler_function, priority
      FROM plugin_hooks
      WHERE plugin_id = $1
      ORDER BY hook_name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get widgets
    const widgets = await sequelize.query(`
      SELECT widget_id, widget_name, description, component_code, default_config, category, icon
      FROM plugin_widgets
      WHERE plugin_id = $1
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Build package
    const packageData = {
      packageVersion: '1.0.0',
      exportedAt: new Date().toISOString(),

      plugin: {
        name: pluginData.name,
        slug: pluginData.slug,
        version: pluginData.version,
        description: pluginData.description,
        author: pluginData.author,
        category: pluginData.category,
        type: pluginData.type,
        framework: pluginData.framework,
        manifest: pluginData.manifest,
        permissions: pluginData.permissions,
        dependencies: pluginData.dependencies,
        tags: pluginData.tags
      },

      files: scripts.map(s => ({
        name: s.file_name,
        content: s.file_content,
        type: s.script_type,
        scope: s.scope,
        priority: s.load_priority
      })),

      events: events.map(e => ({
        eventName: e.event_name,
        fileName: e.file_name,  // Include custom filename
        listenerCode: e.listener_function,
        priority: e.priority
      })),

      hooks: hooks.map(h => ({
        hookName: h.hook_name,
        hookType: h.hook_type,
        handlerCode: h.handler_function,
        priority: h.priority
      })),

      widgets: widgets.map(w => ({
        widgetId: w.widget_id,
        widgetName: w.widget_name,
        description: w.description,
        componentCode: w.component_code,
        defaultConfig: w.default_config,
        category: w.category,
        icon: w.icon
      }))
    };

    console.log(`  ✅ Exported ${scripts.length} files, ${events.length} events, ${hooks.length} hooks, ${widgets.length} widgets`);

    res.json(packageData);
  } catch (error) {
    console.error('Failed to export plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/import
 * Import a plugin from package file
 */
router.post('/import', async (req, res) => {
  try {
    const packageData = req.body;

    console.log(`📥 Importing plugin: ${packageData.plugin.name}`);

    // Generate new UUID
    const { randomUUID } = require('crypto');
    const pluginId = randomUUID();

    // Get creator_id from request (sent by frontend) or authenticated user
    let creatorId = packageData.userId || req.user?.id;

    // If still no creator, get first user as fallback
    if (!creatorId) {
      const [firstUser] = await sequelize.query(`
        SELECT id FROM users LIMIT 1
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      creatorId = firstUser?.id;
    }

    console.log(`  📋 Creator ID: ${creatorId}`);

    // Ensure unique name and slug
    let uniqueName = packageData.plugin.name;
    let uniqueSlug = packageData.plugin.slug;
    let counter = 1;

    while (true) {
      // Check if name or slug already exists
      const [existing] = await sequelize.query(`
        SELECT id FROM plugin_registry
        WHERE name = $1 OR slug = $2
        LIMIT 1
      `, {
        bind: [uniqueName, uniqueSlug],
        type: sequelize.QueryTypes.SELECT
      });

      if (!existing) break; // Name and slug are unique

      // Add/increment counter
      counter++;
      uniqueName = `${packageData.plugin.name} (${counter})`;
      uniqueSlug = `${packageData.plugin.slug}-${counter}`;
    }

    if (counter > 1) {
      console.log(`  📝 Made name unique: ${uniqueName}`);
      console.log(`  📝 Made slug unique: ${uniqueSlug}`);
    }

    // Create plugin_registry entry
    await sequelize.query(`
      INSERT INTO plugin_registry (
        id, name, slug, version, description, author, category, type, framework,
        status, creator_id, is_installed, is_enabled,
        manifest, permissions, dependencies, tags,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
    `, {
      bind: [
        pluginId,
        uniqueName,
        uniqueSlug,
        packageData.plugin.version,
        packageData.plugin.description,
        packageData.plugin.author,
        packageData.plugin.category,
        packageData.plugin.type,
        packageData.plugin.framework || 'react',
        'active',
        creatorId,
        true,
        true,
        JSON.stringify(packageData.plugin.manifest),
        JSON.stringify(packageData.plugin.permissions),
        JSON.stringify(packageData.plugin.dependencies),
        JSON.stringify(packageData.plugin.tags)
      ],
      type: sequelize.QueryTypes.INSERT
    });

    // Import files
    for (const file of packageData.files || []) {
      await sequelize.query(`
        INSERT INTO plugin_scripts (
          plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, {
        bind: [
          pluginId,
          file.name,
          file.content,
          file.type || 'js',
          file.scope || 'frontend',
          file.priority || 0
        ],
        type: sequelize.QueryTypes.INSERT
      });
    }

    // Import events
    for (const event of packageData.events || []) {
      // Use custom filename if provided, otherwise generate from event name
      const fileName = event.fileName || `${event.eventName.replace(/\./g, '_')}.js`;

      await sequelize.query(`
        INSERT INTO plugin_events (
          plugin_id, event_name, file_name, listener_function, priority, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, true)
      `, {
        bind: [
          pluginId,
          event.eventName,
          fileName,
          event.listenerCode,
          event.priority || 10
        ],
        type: sequelize.QueryTypes.INSERT
      });
    }

    // Import hooks
    for (const hook of packageData.hooks || []) {
      await sequelize.query(`
        INSERT INTO plugin_hooks (
          plugin_id, hook_name, hook_type, handler_function, priority, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, true)
      `, {
        bind: [
          pluginId,
          hook.hookName,
          hook.hookType || 'filter',
          hook.handlerCode,
          hook.priority || 10
        ],
        type: sequelize.QueryTypes.INSERT
      });
    }

    // Import widgets with unique widget_ids
    for (const widget of packageData.widgets || []) {
      // Generate unique widget_id (append plugin UUID suffix to ensure uniqueness)
      const uniqueWidgetId = `${widget.widgetId}-${pluginId.substring(0, 8)}`;

      await sequelize.query(`
        INSERT INTO plugin_widgets (
          plugin_id, widget_id, widget_name, description, component_code,
          default_config, category, icon, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      `, {
        bind: [
          pluginId,
          uniqueWidgetId,
          widget.widgetName,
          widget.description,
          widget.componentCode,
          JSON.stringify(widget.defaultConfig || {}),
          widget.category || 'functional',
          widget.icon || 'Box'
        ],
        type: sequelize.QueryTypes.INSERT
      });
    }

    console.log(`  ✅ Imported: ${packageData.files?.length || 0} files, ${packageData.events?.length || 0} events, ${packageData.hooks?.length || 0} hooks, ${packageData.widgets?.length || 0} widgets`);

    res.json({
      success: true,
      message: 'Plugin imported successfully',
      plugin: {
        id: pluginId,
        name: packageData.plugin.name
      }
    });
  } catch (error) {
    console.error('Failed to import plugin:', error);
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

    // Handle event files - update plugin_events table
    if (normalizedRequestPath.startsWith('events/')) {
      // Extract filename from path
      const fileName = normalizedRequestPath.replace('events/', '');

      console.log(`🔄 Saving event file: ${fileName}`);

      try {
        // Look up event by filename (supports custom filenames)
        const existing = await sequelize.query(`
          SELECT event_name FROM plugin_events
          WHERE plugin_id = $1 AND file_name = $2
        `, {
          bind: [id, fileName],
          type: sequelize.QueryTypes.SELECT
        });

        if (existing.length > 0) {
          // Update existing event by filename
          const eventName = existing[0].event_name;
          await sequelize.query(`
            UPDATE plugin_events
            SET listener_function = $1, updated_at = NOW()
            WHERE plugin_id = $2 AND file_name = $3
          `, {
            bind: [content, id, fileName],
            type: sequelize.QueryTypes.UPDATE
          });
          console.log(`✅ Updated event: ${eventName} (file: ${fileName})`);
        } else {
          // Fallback: Try to derive event name from filename for legacy files
          const eventName = fileName.replace('.js', '').replace(/_/g, '.');
          await sequelize.query(`
            INSERT INTO plugin_events (plugin_id, event_name, file_name, listener_function, priority, is_enabled)
            VALUES ($1, $2, $3, $4, 10, true)
          `, {
            bind: [id, eventName, fileName, content],
            type: sequelize.QueryTypes.INSERT
          });
          console.log(`✅ Created event: ${eventName} (file: ${fileName})`);
        }

        return res.json({
          success: true,
          message: 'Event file saved successfully in plugin_events table'
        });
      } catch (eventError) {
        console.error(`❌ Error upserting plugin_events table:`, eventError);
        return res.status(500).json({
          success: false,
          error: `Failed to save event in plugin_events table: ${eventError.message}`
        });
      }
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

    // For other files (components, utils, etc.), update plugin_scripts table
    console.log(`🔄 Upserting file ${normalizedRequestPath} in plugin_scripts table...`);

    try {
      // Check if file exists in plugin_scripts
      const existing = await sequelize.query(`
        SELECT id FROM plugin_scripts
        WHERE plugin_id = $1 AND file_name = $2
      `, {
        bind: [id, normalizedRequestPath],
        type: sequelize.QueryTypes.SELECT
      });

      if (existing.length > 0) {
        // Update existing file
        await sequelize.query(`
          UPDATE plugin_scripts
          SET file_content = $1, updated_at = NOW()
          WHERE plugin_id = $2 AND file_name = $3
        `, {
          bind: [content, id, normalizedRequestPath],
          type: sequelize.QueryTypes.UPDATE
        });
        console.log(`✅ Updated file ${normalizedRequestPath}`);
      } else {
        // Insert new file
        await sequelize.query(`
          INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled)
          VALUES ($1, $2, $3, 'js', 'frontend', 0, true)
        `, {
          bind: [id, normalizedRequestPath, content],
          type: sequelize.QueryTypes.INSERT
        });
        console.log(`✅ Created file ${normalizedRequestPath}`);
      }

      // Update plugin_registry timestamp
      await sequelize.query(`
        UPDATE plugin_registry
        SET updated_at = NOW()
        WHERE id = $1
      `, {
        bind: [id],
        type: sequelize.QueryTypes.UPDATE
      });

      res.json({
        success: true,
        message: 'File saved successfully in plugin_scripts table'
      });
    } catch (scriptError) {
      console.error(`❌ Error upserting plugin_scripts table:`, scriptError);
      res.status(500).json({
        success: false,
        error: `Failed to save file in plugin_scripts table: ${scriptError.message}`
      });
    }
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

    // Generate proper UUID for plugin_registry
    const { randomUUID } = require('crypto');
    const id = randomUUID();

    // Generate slug from name
    const slug = pluginData.name.toLowerCase().replace(/\s+/g, '-');

    // Get creator_id from authenticated user (if available)
    const creatorId = req.user?.id || null;

    // Build manifest
    const manifest = {
      name: pluginData.name,
      version: pluginData.version || '1.0.0',
      generated_by_ai: pluginData.generated_by_ai || false,
      generatedFiles: pluginData.generatedFiles || [],
      ...pluginData
    };

    // Insert into plugin_registry
    await sequelize.query(`
      INSERT INTO plugin_registry (
        id, name, slug, version, description, author, category, status, type, framework,
        manifest, creator_id, is_installed, is_enabled,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      )
    `, {
      bind: [
        id,
        pluginData.name,
        slug,
        pluginData.version || '1.0.0',
        pluginData.description,
        pluginData.author || 'Unknown',
        pluginData.category || 'utility',
        pluginData.status || 'active',
        pluginData.generated_by_ai ? 'ai-generated' : 'custom',
        'react',
        JSON.stringify(manifest),
        creatorId,
        true,  // is_installed
        true   // is_enabled
      ],
      type: sequelize.QueryTypes.INSERT
    });

    // If plugin has generated files, store them in plugin_scripts table
    if (pluginData.generatedFiles && pluginData.generatedFiles.length > 0) {
      for (const file of pluginData.generatedFiles) {
        const fileName = file.name || file.filename || '';
        const fileContent = file.code || file.content || '';

        if (fileName && fileContent) {
          await sequelize.query(`
            INSERT INTO plugin_scripts (
              plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, {
            bind: [
              id,
              fileName,
              fileContent,
              'js',
              'frontend',
              0,
              true
            ],
            type: sequelize.QueryTypes.INSERT
          });
        }
      }
    }

    // If plugin has hooks, store them in plugin_hooks table
    if (pluginData.hooks && pluginData.hooks.length > 0) {
      for (const hook of pluginData.hooks) {
        await sequelize.query(`
          INSERT INTO plugin_hooks (
            plugin_id, hook_name, handler_function, priority, is_enabled
          )
          VALUES ($1, $2, $3, $4, $5)
        `, {
          bind: [
            id,
            hook.hook_name || hook.name,
            hook.handler_code || hook.code || hook.handler,
            hook.priority || 10,
            hook.enabled !== false
          ],
          type: sequelize.QueryTypes.INSERT
        });
      }
    }

    // If plugin has events, store them in plugin_events table
    if (pluginData.events && pluginData.events.length > 0) {
      for (const event of pluginData.events) {
        await sequelize.query(`
          INSERT INTO plugin_events (
            plugin_id, event_name, listener_function, priority, is_enabled
          )
          VALUES ($1, $2, $3, $4, $5)
        `, {
          bind: [
            id,
            event.event_name || event.name,
            event.listener_code || event.code || event.handler,
            event.priority || 10,
            event.enabled !== false
          ],
          type: sequelize.QueryTypes.INSERT
        });
      }
    }

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
    const { file_name, file_path, event_name, old_event_name, listener_function, priority = 10, description } = req.body;

    if (!event_name || !listener_function) {
      return res.status(400).json({
        success: false,
        error: 'event_name and listener_function are required'
      });
    }

    // Determine filename - use custom or generate from event_name
    const fileName = file_name || `${event_name.replace(/\./g, '_')}.js`;

    console.log(`📡 Creating/updating event: ${event_name} (file: ${fileName}) for plugin ${pluginId}`);

    // Use plugin_events table (normalized structure)
    // If old_event_name provided, this is a remapping operation
    const lookupEventName = old_event_name || event_name;

    console.log(`  🔍 Looking for existing event: ${lookupEventName}`);

    // Check if event already exists for this plugin
    const existing = await sequelize.query(`
      SELECT id FROM plugin_events
      WHERE plugin_id = $1 AND event_name = $2
    `, {
      bind: [pluginId, lookupEventName],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      // Update existing event (including event_name and filename if remapping)
      await sequelize.query(`
        UPDATE plugin_events
        SET event_name = $1, file_name = $2, listener_function = $3, priority = $4, updated_at = NOW()
        WHERE plugin_id = $5 AND event_name = $6
      `, {
        bind: [event_name, fileName, listener_function, priority, pluginId, lookupEventName],
        type: sequelize.QueryTypes.UPDATE
      });

      if (old_event_name && old_event_name !== event_name) {
        console.log(`✅ Remapped event: ${old_event_name} → ${event_name} (file: ${fileName})`);
      } else {
        console.log(`✅ Updated event: ${event_name} (file: ${fileName})`);
      }
    } else {
      // Insert new event with custom filename
      await sequelize.query(`
        INSERT INTO plugin_events
        (plugin_id, event_name, file_name, listener_function, priority, is_enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, {
        bind: [pluginId, event_name, fileName, listener_function, priority],
        type: sequelize.QueryTypes.INSERT
      });

      console.log(`✅ Created event: ${event_name} (file: ${fileName})`);
    }

    res.json({
      success: true,
      message: 'Event saved successfully'
    });
  } catch (error) {
    console.error('❌ Failed to save event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Note: PUT and DELETE endpoints for plugin_event_listeners removed
// Table dropped - all events now use plugin_events table
// Event remapping handled via POST /api/plugins/:pluginId/event-listeners

module.exports = router;
