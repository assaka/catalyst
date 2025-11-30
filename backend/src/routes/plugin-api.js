// backend/src/routes/plugin-api.js
const express = require('express');
const router = express.Router();
const PluginExecutor = require('../core/PluginExecutor');
const PluginPurchaseService = require('../services/PluginPurchaseService');
const ConnectionManager = require('../services/database/ConnectionManager');
const { storeResolver } = require('../middleware/storeResolver');
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');

/**
 * Helper function to get tenant database connection from request
 * Extracts store_id from multiple sources (headers, query, body, user context)
 */
async function getTenantConnection(req) {
  // Try multiple sources for store_id
  const store_id =
    req.headers['x-store-id'] ||
    req.query.store_id ||
    req.body?.store_id ||
    req.storeId ||  // From storeResolver middleware
    req.user?.store_id ||
    req.user?.storeId;

  if (!store_id) {
    throw new Error('store_id is required (header X-Store-Id, query param, body, or user context)');
  }
  return await ConnectionManager.getStoreConnection(store_id);
}

/**
 * GET /api/plugins
 * Get ALL plugins (installed + available) from plugin_registry table
 */
router.get('/', async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;

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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;

    // Query plugin_widgets table (exclude starter templates)
    const widgets = await sequelize.query(`
      SELECT w.widget_id, w.widget_name, w.description, w.category, w.icon,
             p.name as plugin_name, p.id as plugin_id
      FROM plugin_widgets w
      JOIN plugin_registry p ON w.plugin_id = p.id
      WHERE w.is_enabled = true
        AND p.status = 'active'
        AND (p.is_starter_template = false OR p.is_starter_template IS NULL)
      ORDER BY w.widget_name ASC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { widgetId } = req.params;

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
    const tenantDb = await getTenantConnection(req);

    const { data: starters, error } = await tenantDb
      .from('plugin_registry')
      .select('id, name, slug, version, description, starter_icon, starter_description, starter_prompt, starter_order')
      .eq('is_starter_template', true)
      .eq('status', 'active')
      .order('starter_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      starters: (starters || []).map(s => ({
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;

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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
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
 * This endpoint loads plugins with their hooks, events, AND frontend scripts
 * OPTIMIZED: Now includes all plugin data in one call
 *
 * Only returns plugins that are:
 * 1. Active in plugin_registry (status = 'active')
 * 2. Enabled for this store in plugin_configurations (is_enabled = true)
 */
router.get('/active', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get active plugins from plugin_registry table (exclude starter templates)
    const { data: allPlugins, error: pluginsError } = await tenantDb
      .from('plugin_registry')
      .select('id, name, version, description, author, category, status, type, manifest, created_at, updated_at')
      .eq('status', 'active')
      .or('is_starter_template.eq.false,is_starter_template.is.null')
      .order('created_at', { ascending: false });

    if (pluginsError) {
      throw new Error(pluginsError.message);
    }

    // Get store-specific plugin configurations to check which are enabled
    const { data: storeConfigs, error: configError } = await tenantDb
      .from('plugin_configurations')
      .select('plugin_id, is_enabled')
      .eq('store_id', store_id);

    if (configError) {
      console.warn('Could not fetch plugin configurations:', configError.message);
    }

    // Create a map of plugin_id -> is_enabled for quick lookup
    const configMap = new Map((storeConfigs || []).map(c => [c.plugin_id, c.is_enabled]));

    // Filter plugins: only include those that are enabled for this store
    // If no configuration exists for a plugin, include it (default enabled)
    // If configuration exists and is_enabled = false, exclude it
    const plugins = (allPlugins || []).filter(plugin => {
      const isEnabled = configMap.get(plugin.id);
      // If explicitly disabled (is_enabled === false), exclude
      if (isEnabled === false) {
        console.log(`Plugin "${plugin.name}" (${plugin.id}) is disabled for store ${store_id}`);
        return false;
      }
      return true;
    });

    // Load hooks and events for each plugin from normalized tables
    const pluginsWithData = await Promise.all(plugins.map(async (plugin) => {
      // Load hooks from plugin_hooks table (normalized structure)
      let hooks = [];
      try {
        const { data: hooksResult, error: hooksError } = await tenantDb
          .from('plugin_hooks')
          .select('hook_name, handler_function, priority, is_enabled')
          .eq('plugin_id', plugin.id)
          .eq('is_enabled', true)
          .order('priority', { ascending: true });

        if (hooksError) throw hooksError;

        hooks = (hooksResult || []).map(h => ({
          hook_name: h.hook_name,
          handler_code: h.handler_function,
          priority: h.priority || 10,
          enabled: h.is_enabled !== false
        }));
      } catch (hookError) {
        //
      }

      // Load events from normalized plugin_events table
      let events = [];
      try {
        const { data: eventsResult, error: eventsError } = await tenantDb
          .from('plugin_events')
          .select('event_name, listener_function, priority, is_enabled')
          .eq('plugin_id', plugin.id)
          .eq('is_enabled', true)
          .order('priority', { ascending: true });

        if (eventsError) throw eventsError;

        events = (eventsResult || []).map(e => ({
          event_name: e.event_name,
          listener_code: e.listener_function,
          priority: e.priority || 10,
          enabled: e.is_enabled !== false
        }));
      } catch (eventError) {
        // Events are optional
      }

      // Load frontend scripts from plugin_scripts table
      let frontendScripts = [];
      try {
        const { data: scriptsResult, error: scriptsError } = await tenantDb
          .from('plugin_scripts')
          .select('name, content, type, load_order')
          .eq('plugin_id', plugin.id)
          .eq('scope', 'frontend')
          .eq('is_enabled', true)
          .order('load_order', { ascending: true });

        if (scriptsError) throw scriptsError;

        frontendScripts = scriptsResult || [];
      } catch (scriptError) {
        // Scripts are optional
      }

      // Parse manifest
      const manifest = typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest;

      return {
        id: plugin.id,
        name: plugin.name,
        slug: plugin.slug,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        category: plugin.category,
        status: plugin.status,
        type: plugin.type,
        generated_by_ai: manifest?.generated_by_ai || plugin.type === 'ai-generated',
        hooks: hooks,
        events: events,
        frontendScripts: frontendScripts // Include scripts in response!
      };
    }));

    res.json({
      success: true,
      data: pluginsWithData
    });
  } catch (error) {
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;

    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { status } = req.query;

    // Get plugins from plugin_registry table (removed config column - doesn't exist in normalized structure)
    const whereClause = status === 'active' ? `WHERE status = 'active'` : '';
    const plugins = await sequelize.query(`
      SELECT
        id, name, slug, version, description, author, category, status, type,
        manifest, created_at, updated_at
      FROM plugin_registry
      ${whereClause}
      ORDER BY created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

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
        slug: plugin.slug,
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

    res.json({
      success: true,
      data: pluginsWithData
    });
  } catch (error) {
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;

    // Prevent caching - always get fresh plugin data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { pluginId } = req.params;

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
    } catch (hookError) {
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
    } catch (eventError) {
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;

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
    } catch (hookError) {
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
    } catch (scriptsError) {
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
    } catch (eventsError) {
    }

    // Load plugin_entities from normalized table
    let pluginEntities = [];
    try {
      const entitiesResult = await sequelize.query(`
        SELECT id, entity_name, table_name, description, schema_definition,
               migration_status, migration_version, create_table_sql, is_enabled
        FROM plugin_entities
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY entity_name ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      pluginEntities = entitiesResult.map(e => ({
        name: `entities/${e.entity_name}.json`,
        code: JSON.stringify({
          entity_name: e.entity_name,
          table_name: e.table_name,
          description: e.description,
          schema_definition: e.schema_definition,
          migration_status: e.migration_status,
          migration_version: e.migration_version,
          create_table_sql: e.create_table_sql
        }, null, 2),
        entity_name: e.entity_name,
        table_name: e.table_name,
        migration_status: e.migration_status
      }));
    } catch (entitiesError) {
    }

    // Load plugin_controllers from normalized table
    let pluginControllers = [];
    try {
      const controllersResult = await sequelize.query(`
        SELECT id, controller_name, description, method, path, handler_code,
               requires_auth, is_enabled
        FROM plugin_controllers
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY controller_name ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      pluginControllers = controllersResult.map(c => ({
        name: `controllers/${c.controller_name}.js`,
        code: c.handler_code,
        controller_name: c.controller_name,
        method: c.method,
        path: c.path,
        description: c.description,
        requires_auth: c.requires_auth
      }));
    } catch (controllersError) {
    }

    // Load plugin_migrations from normalized table
    let pluginMigrations = [];
    try {
      const migrationsResult = await sequelize.query(`
        SELECT id, migration_name, migration_version, migration_description,
               status, up_sql, down_sql, executed_at
        FROM plugin_migrations
        WHERE plugin_id = $1
        ORDER BY migration_version DESC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      pluginMigrations = migrationsResult.map(m => ({
        name: `migrations/${m.migration_version}_${m.migration_name.replace(/[^a-zA-Z0-9_]/g, '_')}.sql`,
        code: `-- Migration: ${m.migration_description}
-- Version: ${m.migration_version}
-- Status: ${m.status}
-- Executed: ${m.executed_at || 'Not executed'}

-- UP Migration
${m.up_sql || '-- No up SQL'}

-- DOWN Migration (Rollback)
${m.down_sql || '-- No down SQL'}`,
        migration_version: m.migration_version,
        migration_description: m.migration_description,
        migration_status: m.status,
        executed_at: m.executed_at
      }));
    } catch (migrationsError) {
    }

    // Load documentation from plugin_docs table (README only, NOT manifest)
    let pluginDocs = [];
    let readme = '# Plugin Documentation';
    try {
      const docsResult = await sequelize.query(`
        SELECT doc_type, file_name, content, format
        FROM plugin_docs
        WHERE plugin_id = $1 AND is_visible = true AND doc_type != 'manifest'
        ORDER BY display_order ASC, doc_type ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      pluginDocs = docsResult.map(d => ({
        name: d.file_name,
        code: d.content,
        doc_type: d.doc_type,
        format: d.format
      }));

      // Get README content
      const readmeDoc = pluginDocs.find(d => d.doc_type === 'readme');
      if (readmeDoc) {
        readme = readmeDoc.code;
      }
    } catch (docsError) {
    }

    // Parse manifest from plugin_registry.manifest column (NOT from plugin_docs)
    const manifest = typeof plugin[0].manifest === 'string' ? JSON.parse(plugin[0].manifest) : (plugin[0].manifest || {});

    // Load files from NORMALIZED TABLES ONLY (no backward compatibility)
    // Sources:
    // 1. plugin_scripts table
    // 2. plugin_events table
    // 3. plugin_entities table
    // 4. plugin_controllers table
    // 5. plugin_migrations table
    // 6. plugin_docs table
    let allFiles = [];

    // Add files from plugin_scripts table
    allFiles = allFiles.concat(pluginScripts);

    // NOTE: Hooks are NOT added to allFiles/source_code
    // They are sent separately via the 'hooks' property and handled specially by the frontend
    // Adding them here would create duplicates in the FileTree

    // Add files from plugin_events table (as event files)
    const eventFiles = pluginEvents.map(e => ({
      name: `events/${e.name}`,
      code: e.code,
      event_name: e.event_name,  // Preserve event name for Edit Event button
      priority: e.priority        // Preserve priority
    }));
    allFiles = allFiles.concat(eventFiles);

    // Add files from plugin_entities table
    allFiles = allFiles.concat(pluginEntities);

    // Add files from plugin_controllers table
    allFiles = allFiles.concat(pluginControllers);

    // Add files from plugin_migrations table
    allFiles = allFiles.concat(pluginMigrations);

    // Add files from plugin_docs table
    allFiles = allFiles.concat(pluginDocs);

    // Add manifest.json as a file (from plugin_registry.manifest column)
    allFiles.push({
      name: 'manifest.json',
      code: JSON.stringify(manifest, null, 2),
      doc_type: 'manifest',
      format: 'json'
    });

    const generatedFiles = allFiles;

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
    } catch (adminError) {
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
        readme,
        source_code: generatedFiles // All files from normalized tables only for FileTree
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
 * GET /api/plugins/:id/export
 * Export plugin as downloadable package
 */
router.get('/:id/export', async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { id } = req.params;

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

    const pluginInfo = plugin[0];

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

    // Get entities
    const entities = await sequelize.query(`
      SELECT entity_name as name, table_name, model_code as code, schema_definition, description
      FROM plugin_entities
      WHERE plugin_id = $1
      ORDER BY entity_name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get migrations
    const migrations = await sequelize.query(`
      SELECT migration_name as name, plugin_name, migration_version, up_sql as code
      FROM plugin_migrations
      WHERE plugin_id = $1
      ORDER BY migration_name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get controllers
    const controllers = await sequelize.query(`
      SELECT controller_name as name, method, path, handler_code as code, description
      FROM plugin_controllers
      WHERE plugin_id = $1
      ORDER BY controller_name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get plugin data (key-value storage)
    const pluginDataKV = await sequelize.query(`
      SELECT data_key, data_value
      FROM plugin_data
      WHERE plugin_id = $1
      ORDER BY data_key ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get plugin dependencies
    const pluginDependencies = await sequelize.query(`
      SELECT package_name, version, bundled_code
      FROM plugin_dependencies
      WHERE plugin_id = $1
      ORDER BY package_name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get plugin docs
    const pluginDocs = await sequelize.query(`
      SELECT title, content, doc_type as category, display_order as order_position, file_name
      FROM plugin_docs
      WHERE plugin_id = $1
      ORDER BY display_order ASC, title ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get admin pages
    const adminPages = await sequelize.query(`
      SELECT page_key, page_name, route, component_code, description, icon, category, order_position
      FROM plugin_admin_pages
      WHERE plugin_id = $1
      ORDER BY order_position ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get admin scripts
    const adminScripts = await sequelize.query(`
      SELECT script_name, script_code, description, load_order
      FROM plugin_admin_scripts
      WHERE plugin_id = $1
      ORDER BY load_order ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Build package
    const packageData = {
      packageVersion: '1.0.0',
      exportedAt: new Date().toISOString(),

      plugin: {
        name: pluginInfo.name,
        slug: pluginInfo.slug,
        version: pluginInfo.version,
        description: pluginInfo.description,
        author: pluginInfo.author,
        category: pluginInfo.category,
        type: pluginInfo.type,
        framework: pluginInfo.framework,
        manifest: pluginInfo.manifest,
        permissions: pluginInfo.permissions,
        dependencies: pluginInfo.dependencies,
        tags: pluginInfo.tags
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
      })),

      entities: entities.map(e => ({
        name: e.name,
        tableName: e.table_name,
        code: e.code,
        schemaDefinition: e.schema_definition,
        description: e.description
      })),

      migrations: migrations.map(m => ({
        name: m.name,
        pluginName: m.plugin_name,
        migrationVersion: m.migration_version,
        code: m.code
      })),

      controllers: controllers.map(c => ({
        name: c.name,
        method: c.method,
        path: c.path,
        code: c.code,
        description: c.description
      })),

      pluginData: pluginDataKV.map(d => ({
        dataKey: d.data_key,
        dataValue: d.data_value
      })),

      pluginDependencies: pluginDependencies.map(d => ({
        packageName: d.package_name,
        version: d.version,
        bundledCode: d.bundled_code
      })),

      pluginDocs: pluginDocs.map(d => ({
        title: d.title,
        content: d.content,
        category: d.category,
        orderPosition: d.order_position,
        fileName: d.file_name
      })),

      adminPages: adminPages.map(p => ({
        pageKey: p.page_key,
        pageName: p.page_name,
        route: p.route,
        componentCode: p.component_code,
        description: p.description,
        icon: p.icon,
        category: p.category,
        orderPosition: p.order_position
      })),

      adminScripts: adminScripts.map(s => ({
        scriptName: s.script_name,
        scriptCode: s.script_code,
        description: s.description,
        loadOrder: s.load_order
      }))
    };

    res.json(packageData);
  } catch (error) {
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
  let transaction;

  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    transaction = await sequelize.transaction();

    const packageData = req.body;

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
        type: sequelize.QueryTypes.SELECT,
        transaction
      });
      creatorId = firstUser?.id;
    }

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
        type: sequelize.QueryTypes.SELECT,
        transaction
      });

      if (!existing) break; // Name and slug are unique

      // Add/increment counter
      counter++;
      uniqueName = `${packageData.plugin.name} (${counter})`;
      uniqueSlug = `${packageData.plugin.slug}-${counter}`;
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
      type: sequelize.QueryTypes.INSERT,
      transaction
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
        type: sequelize.QueryTypes.INSERT,
        transaction
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
        type: sequelize.QueryTypes.INSERT,
        transaction
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
        type: sequelize.QueryTypes.INSERT,
        transaction
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
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Build table name mapping for migrations
    const tableNameMap = {};
    const uniqueSuffix = counter > 1 ? `_${counter}` : '';

    // Import entities with unique suffixes to avoid conflicts
    for (const entity of packageData.entities || []) {
      // Add counter suffix to entity_name and table_name if this is a clone
      const uniqueEntityName = `${entity.name}${uniqueSuffix}`;
      const baseTableName = entity.tableName || entity.name.toLowerCase().replace(/\s+/g, '_');
      const uniqueTableName = `${baseTableName}${uniqueSuffix}`;

      // Store mapping for migration SQL replacement
      if (uniqueSuffix) {
        tableNameMap[baseTableName] = uniqueTableName;
      }

      await sequelize.query(`
        INSERT INTO plugin_entities (
          plugin_id, entity_name, table_name, model_code, schema_definition, description
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, {
        bind: [
          pluginId,
          uniqueEntityName,
          uniqueTableName,
          entity.code,
          entity.schemaDefinition || {},
          entity.description || null
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Import migrations with updated table names
    for (const migration of packageData.migrations || []) {
      let migrationSql = migration.code;

      // Replace table names in SQL if this is a clone
      if (uniqueSuffix && Object.keys(tableNameMap).length > 0) {
        // Sort by length descending to replace longer names first (avoid partial replacements)
        const sortedTableNames = Object.keys(tableNameMap).sort((a, b) => b.length - a.length);

        for (const originalTable of sortedTableNames) {
          const uniqueTable = tableNameMap[originalTable];
          // Replace table name in various SQL contexts (CREATE TABLE, ALTER TABLE, DROP TABLE, INSERT INTO, etc.)
          // Using word boundaries to avoid partial matches
          const regex = new RegExp(`\\b${originalTable}\\b`, 'gi');
          migrationSql = migrationSql.replace(regex, uniqueTable);
        }
      }

      await sequelize.query(`
        INSERT INTO plugin_migrations (
          plugin_id, plugin_name, migration_name, migration_version, up_sql
        )
        VALUES ($1, $2, $3, $4, $5)
      `, {
        bind: [
          pluginId,
          migration.pluginName || uniqueName,
          migration.name,
          migration.migrationVersion || `v${Date.now()}`,
          migrationSql
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Import controllers
    for (const controller of packageData.controllers || []) {
      await sequelize.query(`
        INSERT INTO plugin_controllers (
          plugin_id, controller_name, method, path, handler_code, description
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, {
        bind: [
          pluginId,
          controller.name,
          controller.method || 'GET',
          controller.path || `/api/plugins/${uniqueSlug}/${controller.name}`,
          controller.code,
          controller.description || null
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Import plugin data (key-value storage)
    for (const data of packageData.pluginData || []) {
      await sequelize.query(`
        INSERT INTO plugin_data (
          plugin_id, data_key, data_value
        )
        VALUES ($1, $2, $3)
      `, {
        bind: [
          pluginId,
          data.dataKey,
          JSON.stringify(data.dataValue)
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Import plugin dependencies
    for (const dependency of packageData.pluginDependencies || []) {
      await sequelize.query(`
        INSERT INTO plugin_dependencies (
          plugin_id, package_name, version, bundled_code
        )
        VALUES ($1, $2, $3, $4)
      `, {
        bind: [
          pluginId,
          dependency.packageName,
          dependency.version,
          dependency.bundledCode
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Import plugin docs
    for (const doc of packageData.pluginDocs || []) {
      // Generate file_name from doc_type if not provided
      const docType = doc.category || 'readme'; // category is actually doc_type from export
      const fileName = doc.fileName || (() => {
        switch(docType) {
          case 'readme': return 'README.md';
          case 'manifest': return 'manifest.json';
          case 'changelog': return 'CHANGELOG.md';
          case 'license': return 'LICENSE';
          case 'contributing': return 'CONTRIBUTING.md';
          default: return `${docType}.md`;
        }
      })();
      const format = docType === 'manifest' ? 'json' : 'markdown';

      await sequelize.query(`
        INSERT INTO plugin_docs (
          plugin_id, doc_type, file_name, title, content, format, display_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, {
        bind: [
          pluginId,
          docType,
          fileName,
          doc.title || docType.toUpperCase(),
          doc.content,
          format,
          doc.orderPosition || 0
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Import admin pages
    for (const page of packageData.adminPages || []) {
      await sequelize.query(`
        INSERT INTO plugin_admin_pages (
          plugin_id, page_key, page_name, route, component_code, description, icon, category, order_position, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      `, {
        bind: [
          pluginId,
          page.pageKey,
          page.pageName,
          page.route,
          page.componentCode,
          page.description,
          page.icon,
          page.category,
          page.orderPosition || 100
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Import admin scripts
    for (const script of packageData.adminScripts || []) {
      await sequelize.query(`
        INSERT INTO plugin_admin_scripts (
          plugin_id, script_name, script_code, description, load_order, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, true)
      `, {
        bind: [
          pluginId,
          script.scriptName,
          script.scriptCode,
          script.description,
          script.loadOrder || 100
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
    }

    // Commit transaction
    await transaction.commit();

    res.json({
      success: true,
      message: 'Plugin imported successfully',
      plugin: {
        id: pluginId,
        name: packageData.plugin.name
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
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

    // Handle manifest.json - save to plugin_registry.manifest column
    if (normalizedRequestPath === 'manifest.json') {
      try {
        const manifestData = JSON.parse(content); // Validate JSON

        await sequelize.query(`
          UPDATE plugin_registry
          SET manifest = $1, updated_at = NOW()
          WHERE id = $2
        `, {
          bind: [JSON.stringify(manifestData), id],
          type: sequelize.QueryTypes.UPDATE
        });

        return res.json({
          success: true,
          message: 'Manifest saved successfully to plugin_registry.manifest'
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to save manifest: ${error.message}`
        });
      }
    }

    // Handle documentation files - save to plugin_docs table
    if (normalizedRequestPath === 'README.md' || normalizedRequestPath === 'CHANGELOG.md' ||
        normalizedRequestPath === 'LICENSE' || normalizedRequestPath === 'CONTRIBUTING.md') {

      const docTypeMap = {
        'README.md': 'readme',
        'CHANGELOG.md': 'changelog',
        'LICENSE': 'license',
        'CONTRIBUTING.md': 'contributing'
      };

      const docType = docTypeMap[normalizedRequestPath];
      const format = 'markdown';

      try {
        // Check if doc exists
        const existing = await sequelize.query(`
          SELECT id FROM plugin_docs
          WHERE plugin_id = $1 AND doc_type = $2
        `, {
          bind: [id, docType],
          type: sequelize.QueryTypes.SELECT
        });

        if (existing.length > 0) {
          // Update existing doc
          await sequelize.query(`
            UPDATE plugin_docs
            SET content = $1, format = $2, updated_at = NOW()
            WHERE plugin_id = $3 AND doc_type = $4
          `, {
            bind: [content, format, id, docType],
            type: sequelize.QueryTypes.UPDATE
          });
        } else {
          // Insert new doc
          await sequelize.query(`
            INSERT INTO plugin_docs (plugin_id, doc_type, file_name, content, format, is_visible)
            VALUES ($1, $2, $3, $4, $5, true)
          `, {
            bind: [id, docType, normalizedRequestPath, content, format],
            type: sequelize.QueryTypes.INSERT
          });
        }

        return res.json({
          success: true,
          message: 'Documentation saved successfully in plugin_docs table'
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to save documentation: ${error.message}`
        });
      }
    }

    // Handle event files - update plugin_events table
    if (normalizedRequestPath.startsWith('events/')) {
      // Extract filename from path
      const fileName = normalizedRequestPath.replace('events/', '');

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
        }

        return res.json({
          success: true,
          message: 'Event file saved successfully in plugin_events table'
        });
      } catch (eventError) {
        return res.status(500).json({
          success: false,
          error: `Failed to save event in plugin_events table: ${eventError.message}`
        });
      }
    }

    // Special handling for hook files - update plugin_hooks table (normalized structure)
    if (normalizedRequestPath.startsWith('hooks/')) {
      const hookName = normalizedRequestPath.replace('hooks/', '').replace('.js', '').replace(/_/g, '.');

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
        } else {
          // Insert new hook
          await sequelize.query(`
            INSERT INTO plugin_hooks (plugin_id, hook_name, handler_function, priority, is_enabled, created_at, updated_at)
            VALUES ($1, $2, $3, 10, true, NOW(), NOW())
          `, {
            bind: [id, hookName, content],
            type: sequelize.QueryTypes.INSERT
          });
        }

        return res.json({
          success: true,
          message: 'Hook file saved successfully in plugin_hooks table'
        });
      } catch (hookError) {
        return res.status(500).json({
          success: false,
          error: `Failed to save hook in plugin_hooks table: ${hookError.message}`
        });
      }
    }

    // Handle entity files - update plugin_entities table
    if (normalizedRequestPath.startsWith('entities/')) {
      const entityFileName = normalizedRequestPath.replace('entities/', '').replace('.json', '');

      try {
        // Parse entity JSON
        const entityData = JSON.parse(content);
        const entityName = entityData.entity_name || entityFileName;
        const tableName = entityData.table_name;

        if (!tableName) {
          return res.status(400).json({
            success: false,
            error: 'Entity JSON must include table_name field'
          });
        }

        // Check if entity exists
        const existing = await sequelize.query(`
          SELECT id FROM plugin_entities
          WHERE plugin_id = $1 AND entity_name = $2
        `, {
          bind: [id, entityName],
          type: sequelize.QueryTypes.SELECT
        });

        if (existing.length > 0) {
          // Update existing entity
          await sequelize.query(`
            UPDATE plugin_entities
            SET schema_definition = $1,
                table_name = $2,
                description = $3,
                updated_at = NOW()
            WHERE plugin_id = $4 AND entity_name = $5
          `, {
            bind: [
              entityData.schema_definition,
              tableName,
              entityData.description || '',
              id,
              entityName
            ],
            type: sequelize.QueryTypes.UPDATE
          });
        } else {
          // Insert new entity
          await sequelize.query(`
            INSERT INTO plugin_entities (
              plugin_id, entity_name, table_name, description,
              schema_definition, migration_status, is_enabled
            ) VALUES ($1, $2, $3, $4, $5, 'pending', true)
          `, {
            bind: [
              id,
              entityName,
              tableName,
              entityData.description || '',
              entityData.schema_definition
            ],
            type: sequelize.QueryTypes.INSERT
          });
        }

        return res.json({
          success: true,
          message: 'Entity saved successfully in plugin_entities table'
        });
      } catch (entityError) {
        return res.status(500).json({
          success: false,
          error: `Failed to save entity: ${entityError.message}`
        });
      }
    }

    // Handle controller files - update plugin_controllers table
    if (normalizedRequestPath.startsWith('controllers/')) {
      const controllerFileName = normalizedRequestPath.replace('controllers/', '').replace('.js', '');

      try {
        // Look up controller by controller_name (filename without extension)
        const existing = await sequelize.query(`
          SELECT controller_name, method, path FROM plugin_controllers
          WHERE plugin_id = $1 AND controller_name = $2
        `, {
          bind: [id, controllerFileName],
          type: sequelize.QueryTypes.SELECT
        });

        if (existing.length > 0) {
          // Update existing controller handler code
          const controller = existing[0];
          await sequelize.query(`
            UPDATE plugin_controllers
            SET handler_code = $1, updated_at = NOW()
            WHERE plugin_id = $2 AND controller_name = $3
          `, {
            bind: [content, id, controllerFileName],
            type: sequelize.QueryTypes.UPDATE
          });
        } else {
          // Controller not found - cannot create without metadata
          return res.status(404).json({
            success: false,
            error: `Controller '${controllerFileName}' not found. Controllers must be created with metadata (method, path, etc.) before they can be edited.`
          });
        }

        return res.json({
          success: true,
          message: 'Controller handler code updated successfully in plugin_controllers table'
        });
      } catch (controllerError) {
        return res.status(500).json({
          success: false,
          error: `Failed to save controller: ${controllerError.message}`
        });
      }
    }

    // Block files that belong in specialized tables
    if (normalizedRequestPath.startsWith('migrations/')) {
      return res.status(400).json({
        success: false,
        error: 'Migrations belong in plugin_migrations table, not plugin_scripts'
      });
    }
    if (normalizedRequestPath.startsWith('hooks/')) {
      return res.status(400).json({
        success: false,
        error: 'Hooks belong in plugin_hooks table, not plugin_scripts'
      });
    }
    if (normalizedRequestPath.startsWith('admin/')) {
      return res.status(400).json({
        success: false,
        error: 'Admin pages have special handling, not saved to plugin_scripts'
      });
    }
    if (normalizedRequestPath.startsWith('models/')) {
      return res.status(400).json({
        success: false,
        error: 'Models/entities belong in plugin_entities table, not plugin_scripts'
      });
    }

    // For executable frontend files ONLY (components, utils, services, styles)

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
      } else {
        // Insert new file
        await sequelize.query(`
          INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled)
          VALUES ($1, $2, $3, 'js', 'frontend', 0, true)
        `, {
          bind: [id, normalizedRequestPath, content],
          type: sequelize.QueryTypes.INSERT
        });
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
      res.status(500).json({
        success: false,
        error: `Failed to save file in plugin_scripts table: ${scriptError.message}`
      });
    }
  } catch (error) {
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { pluginId } = req.params;
    const { scope } = req.query; // 'frontend', 'backend', 'admin'

    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

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
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { pluginId } = req.params;
    const { file_name, old_file_name, file_path, event_name, old_event_name, listener_function, priority = 10, description } = req.body;

    if (!event_name || !listener_function) {
      return res.status(400).json({
        success: false,
        error: 'event_name and listener_function are required'
      });
    }

    // Determine filename - use custom or generate from event_name
    const fileName = file_name || `${event_name.replace(/\./g, '_')}.js`;

    // Use plugin_events table (normalized structure)
    // Lookup by old_file_name or old_event_name (for editing existing events)
    let existing = [];

    if (old_file_name) {
      // Look up by old filename (most reliable for renames)
      existing = await sequelize.query(`
        SELECT id, event_name FROM plugin_events
        WHERE plugin_id = $1 AND file_name = $2
      `, {
        bind: [pluginId, old_file_name],
        type: sequelize.QueryTypes.SELECT
      });
    } else if (old_event_name) {
      // Fall back to old_event_name for backwards compatibility
      existing = await sequelize.query(`
        SELECT id, event_name FROM plugin_events
        WHERE plugin_id = $1 AND event_name = $2
      `, {
        bind: [pluginId, old_event_name],
        type: sequelize.QueryTypes.SELECT
      });
    }
    // else: New event creation - don't check for duplicates
    // Multiple listeners can listen to the same event with different handlers/files

    if (existing.length > 0) {
      // Update existing event (filename, event_name, and code)
      const oldEventName = existing[0].event_name;
      await sequelize.query(`
        UPDATE plugin_events
        SET event_name = $1, file_name = $2, listener_function = $3, priority = $4, updated_at = NOW()
        WHERE plugin_id = $5 AND id = $6
      `, {
        bind: [event_name, fileName, listener_function, priority, pluginId, existing[0].id],
        type: sequelize.QueryTypes.UPDATE
      });

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

/**
 * POST /api/plugins/:pluginId/controllers
 * Create a new controller
 */
router.post('/:pluginId/controllers', async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { pluginId } = req.params;
    const { controller_name, method, path, handler_code, description, requires_auth = false } = req.body;

    if (!controller_name || !method || !path || !handler_code) {
      return res.status(400).json({
        success: false,
        error: 'controller_name, method, path, and handler_code are required'
      });
    }

    // Insert new controller
    await sequelize.query(`
      INSERT INTO plugin_controllers
      (plugin_id, controller_name, method, path, handler_code, description, requires_auth, is_enabled, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
    `, {
      bind: [pluginId, controller_name, method, path, handler_code, description || `${method} ${path}`, requires_auth],
      type: sequelize.QueryTypes.INSERT
    });

    res.json({
      success: true,
      message: 'Controller created successfully'
    });
  } catch (error) {
    console.error('❌ Failed to create controller:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/plugins/:pluginId/controllers/:controllerName
 * Update an existing controller
 */
router.put('/:pluginId/controllers/:controllerName', async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { pluginId, controllerName } = req.params;
    const { controller_name, old_controller_name, method, path, handler_code, description, requires_auth } = req.body;

    // Use old_controller_name for lookup if provided, otherwise use controllerName from params
    const lookupName = old_controller_name || controllerName;

    // Update controller
    await sequelize.query(`
      UPDATE plugin_controllers
      SET controller_name = $1, method = $2, path = $3, handler_code = $4, description = $5, requires_auth = $6, updated_at = NOW()
      WHERE plugin_id = $7 AND controller_name = $8
    `, {
      bind: [
        controller_name || lookupName,
        method,
        path,
        handler_code,
        description || `${method} ${path}`,
        requires_auth !== undefined ? requires_auth : false,
        pluginId,
        lookupName
      ],
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: 'Controller updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Dynamic Controller Execution - 100% Database-Driven
 * Route: /api/plugins/:pluginId/exec/*
 * Executes controllers from plugin_controllers table
 * pluginId can be either UUID or slug
 *
 * Uses optionalAuth to populate req.user if authenticated
 * Uses storeResolver to populate req.storeId from domain/referer
 */
router.all('/:pluginId/exec/*', optionalAuthMiddleware, storeResolver(), async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { pluginId } = req.params;
    const controllerPath = '/' + (req.params[0] || '');
    const method = req.method;

    // Check if pluginId is UUID or slug
    const isUUID = pluginId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Get store_id for plugin configuration check
    const store_id =
      req.headers['x-store-id'] ||
      req.query.store_id ||
      req.body?.store_id ||
      req.storeId ||
      req.user?.store_id ||
      req.user?.storeId;

    // First check if the plugin is enabled for this store
    const [pluginConfig] = await sequelize.query(`
      SELECT pc.is_enabled, pr.status, pr.name
      FROM plugin_registry pr
      LEFT JOIN plugin_configurations pc ON pc.plugin_id = pr.id AND pc.store_id = $2
      WHERE ${isUUID ? 'pr.id = $1' : 'pr.slug = $1'}
    `, {
      bind: [pluginId, store_id],
      type: sequelize.QueryTypes.SELECT
    });

    if (!pluginConfig) {
      return res.status(404).json({
        success: false,
        error: `Plugin not found: ${pluginId}`
      });
    }

    // Check if plugin is active in registry
    if (pluginConfig.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Plugin "${pluginConfig.name || pluginId}" is not active (status: ${pluginConfig.status})`
      });
    }

    // Check if plugin is enabled for this store
    if (pluginConfig.is_enabled === false) {
      return res.status(403).json({
        success: false,
        error: `Plugin "${pluginConfig.name || pluginId}" is disabled for this store`
      });
    }

    // Find matching controller in plugin_controllers table
    // Get all controllers for this plugin and method to do pattern matching
    const controllers = await sequelize.query(`
      SELECT pc.*, pr.slug, pr.id as plugin_uuid
      FROM plugin_controllers pc
      JOIN plugin_registry pr ON pc.plugin_id = pr.id
      WHERE (${isUUID ? 'pc.plugin_id = $1' : 'pr.slug = $1'})
        AND pc.method = $2
        AND pc.is_enabled = true
    `, {
      bind: [pluginId, method],
      type: sequelize.QueryTypes.SELECT
    });

    // Find matching controller by pattern (supports :id, :userId, etc.)
    const matchPath = (pattern, actual) => {
      const patternParts = pattern.split('/').filter(p => p);
      const actualParts = actual.split('/').filter(p => p);

      if (patternParts.length !== actualParts.length) return null;

      const params = {};
      let hasParams = false;

      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          // Capture parameter
          params[patternParts[i].substring(1)] = actualParts[i];
          hasParams = true;
        } else if (patternParts[i] !== actualParts[i]) {
          return null;
        }
      }
      return { params, hasParams };
    };

    // Sort controllers: exact matches first, then parameterized routes
    const sortedControllers = [...controllers].sort((a, b) => {
      const aHasParams = a.path.includes(':');
      const bHasParams = b.path.includes(':');
      if (aHasParams && !bHasParams) return 1;  // b (exact) before a (param)
      if (!aHasParams && bHasParams) return -1; // a (exact) before b (param)
      return 0;
    });

    let controller = null;
    let pathParams = null;

    for (const ctrl of sortedControllers) {
      const match = matchPath(ctrl.path, controllerPath);
      if (match !== null) {
        controller = ctrl;
        pathParams = match.params;
        break;
      }
    }

    if (!controller) {
      return res.status(404).json({
        success: false,
        error: `Controller not found: ${method} ${controllerPath}`,
        pluginId,
        availableControllers: controllers.map(c => `${c.method} ${c.path}`)
      });
    }

    // Create execution context for the controller
    const context = {
      req: {
        body: req.body,
        query: req.query,
        params: { ...req.params, ...pathParams, 0: controllerPath },
        headers: req.headers,
        ip: req.ip,
        user: req.user,
        method: req.method
      },
      res: {
        json: (data) => {
          if (!res.headersSent) {
            res.json(data);
          }
        },
        status: (code) => {
          if (!res.headersSent) {
            res.status(code);
          }
          return {
            json: (data) => {
              if (!res.headersSent) {
                res.json(data);
              }
            }
          };
        }
      },
      sequelize
    };

    // Execute the controller handler code
    const handlerFunc = new Function('req', 'res', 'context', `
      const { sequelize } = context;
      return (${controller.handler_code})(req, res, { sequelize });
    `);

    await handlerFunc(context.req, context.res, context);

    // If handler didn't send a response, send a default success
    if (!res.headersSent) {
      res.json({ success: true, message: 'Controller executed successfully' });
    }

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * DELETE /api/plugins/registry/:id/files
 * Delete a specific file from a plugin
 */
router.delete('/registry/:id/files', async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { id } = req.params;
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    // Normalize paths for comparison
    const normalizePath = (p) => p.replace(/^\/+/, '').replace(/^src\//, '');
    const normalizedPath = normalizePath(path);

    let deleted = false;
    let attemptedTable = null;

    // Handle different file types based on path

    // Delete documentation files from plugin_docs (README, CHANGELOG, LICENSE)
    // NOTE: manifest.json is in plugin_registry.manifest, not plugin_docs
    if (normalizedPath === 'README.md' || normalizedPath === 'CHANGELOG.md' ||
        normalizedPath === 'LICENSE' || normalizedPath === 'CONTRIBUTING.md') {

      const docTypeMap = {
        'README.md': 'readme',
        'CHANGELOG.md': 'changelog',
        'LICENSE': 'license',
        'CONTRIBUTING.md': 'contributing'
      };

      const docType = docTypeMap[normalizedPath];
      attemptedTable = 'plugin_docs';

      try {
        await sequelize.query(`
          DELETE FROM plugin_docs
          WHERE plugin_id = $1 AND doc_type = $2
        `, {
          bind: [id, docType],
          type: sequelize.QueryTypes.DELETE
        });
        deleted = true;
      } catch (err) {
        // Silently fail
      }
    }
    // Prevent deletion of manifest.json (it's in plugin_registry.manifest column)
    else if (normalizedPath === 'manifest.json') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete manifest.json. Edit it to modify plugin metadata.'
      });
    }
    // Delete from plugin_events table
    else if (normalizedPath.startsWith('events/')) {
      const fileName = normalizedPath.replace('events/', '');
      attemptedTable = 'plugin_events';
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_events
          WHERE plugin_id = $1 AND file_name = $2
        `, {
          bind: [id, fileName],
          type: sequelize.QueryTypes.DELETE
        });
        const rowCount = result[1]?.rowCount || result[0]?.affectedRows || 0;
        if (rowCount > 0) {
          deleted = true;
        }
      } catch (err) {
        // Silently fail
      }
    }
    // Delete from plugin_entities table
    else if (normalizedPath.startsWith('entities/')) {
      const fileName = normalizedPath.replace('entities/', '').replace('.json', '');
      attemptedTable = 'plugin_entities';
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_entities
          WHERE plugin_id = $1 AND entity_name = $2
        `, {
          bind: [id, fileName],
          type: sequelize.QueryTypes.DELETE
        });
        const rowCount = result[1]?.rowCount || result[0]?.affectedRows || 0;
        if (rowCount > 0) {
          deleted = true;
        }
      } catch (err) {
        // Silently fail
      }
    }
    // Delete from plugin_controllers table
    else if (normalizedPath.startsWith('controllers/')) {
      const fileName = normalizedPath.replace('controllers/', '').replace('.js', '');
      attemptedTable = 'plugin_controllers';
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_controllers
          WHERE plugin_id = $1 AND controller_name = $2
        `, {
          bind: [id, fileName],
          type: sequelize.QueryTypes.DELETE
        });
        const rowCount = result[1]?.rowCount || result[0]?.affectedRows || 0;
        if (rowCount > 0) {
          deleted = true;
        }
      } catch (err) {
        // Silently fail
      }
    }
    // Delete from plugin_scripts table
    else {
      attemptedTable = 'plugin_scripts';

      // Try multiple path variations to match the file
      const pathVariations = [
        normalizedPath,
        path,
        `/${normalizedPath}`,
        normalizedPath.replace(/^\/+/, ''),
        path.replace(/^\/+/, ''),
        path.replace(/^src\//, ''),
      ];

      // Remove duplicates
      const uniquePathVariations = [...new Set(pathVariations)];

      for (const pathVariation of uniquePathVariations) {
        try {
          const result = await sequelize.query(`
            DELETE FROM plugin_scripts
            WHERE plugin_id = $1 AND file_name = $2
          `, {
            bind: [id, pathVariation],
            type: sequelize.QueryTypes.DELETE
          });

          // Check if any rows were actually deleted
          const rowCount = result[1]?.rowCount || result[0]?.affectedRows || 0;

          if (rowCount > 0) {
            deleted = true;
            break;
          }
        } catch (err) {
          // Continue to next variation
        }
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `File not found or could not be deleted. Attempted table: ${attemptedTable}`
      });
    }

    // ALSO delete from JSON fields (manifest.generatedFiles and source_code)
    // This ensures files don't reappear after deletion from normalized tables
    try {
      const plugin = await sequelize.query(`
        SELECT manifest, source_code FROM plugin_registry WHERE id = $1
      `, {
        bind: [id],
        type: sequelize.QueryTypes.SELECT
      });

      if (plugin.length > 0) {
        let manifest = plugin[0].manifest || {};
        let sourceCode = plugin[0].source_code || [];

        // Remove from manifest.generatedFiles
        if (manifest.generatedFiles && Array.isArray(manifest.generatedFiles)) {
          manifest.generatedFiles = manifest.generatedFiles.filter(f => {
            const fName = f.name || f.filename || '';
            return fName !== normalizedPath && fName !== `/${normalizedPath}` && fName !== path;
          });
        }

        // Remove from source_code array
        if (Array.isArray(sourceCode)) {
          sourceCode = sourceCode.filter(f => {
            const fName = f.name || f.filename || '';
            return fName !== normalizedPath && fName !== `/${normalizedPath}` && fName !== path;
          });
        }

        // Update plugin_registry
        await sequelize.query(`
          UPDATE plugin_registry
          SET manifest = $1, source_code = $2, updated_at = NOW()
          WHERE id = $3
        `, {
          bind: [JSON.stringify(manifest), JSON.stringify(sourceCode), id],
          type: sequelize.QueryTypes.UPDATE
        });
      }
    } catch (jsonError) {
      // Don't fail the request if JSON cleanup fails
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:id/run-migration
 * Execute an existing migration for a plugin
 */
router.post('/:id/run-migration', async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { id } = req.params;
    const { migration_version, migration_name } = req.body;

    const startTime = Date.now();

    // Get migration from database
    const migrations = await sequelize.query(`
      SELECT id, up_sql, migration_description, status
      FROM plugin_migrations
      WHERE plugin_id = $1 AND migration_version = $2
    `, {
      bind: [id, migration_version],
      type: sequelize.QueryTypes.SELECT
    });

    if (migrations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found'
      });
    }

    const migration = migrations[0];

    if (migration.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Migration already executed'
      });
    }

    // Detect risky operations in migration SQL
    const warnings = [];
    const upSQL = migration.up_sql.toLowerCase();
    if (upSQL.includes('drop column')) {
      const dropCount = (upSQL.match(/drop column/g) || []).length;
      warnings.push(`⚠️ DROPS ${dropCount} COLUMN(S) - Data will be permanently deleted!`);
    }
    if (upSQL.includes('alter column') && upSQL.includes('type')) {
      const typeChangeCount = (upSQL.match(/alter column.*type/g) || []).length;
      warnings.push(`⚠️ CHANGES ${typeChangeCount} COLUMN TYPE(S) - May cause data loss or conversion errors!`);
    }
    if (upSQL.includes('drop table')) {
      warnings.push(`⚠️ DROPS TABLE - All data will be permanently deleted!`);
    }

    // Execute migration
    await sequelize.query(migration.up_sql);

    // Update status
    await sequelize.query(`
      UPDATE plugin_migrations
      SET status = 'completed', completed_at = NOW(), execution_time_ms = $1
      WHERE id = $2
    `, {
      bind: [Date.now() - startTime, migration.id]
    });

    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      migrationVersion: migration_version,
      description: migration.migration_description,
      executionTime,
      warnings: warnings.length > 0 ? warnings : undefined
    });

  } catch (error) {
    console.error('Failed to run migration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:id/generate-entity-migration
 * Generate a pending migration for an entity (CREATE or ALTER TABLE)
 */
router.post('/:id/generate-entity-migration', async (req, res) => {
  try {
    const connection = await getTenantConnection(req);
    const sequelize = connection.sequelize;
    const { id } = req.params;
    const { entity_name, table_name, schema_definition, is_update } = req.body;

    // Get plugin name from database
    const pluginData = await sequelize.query(`
      SELECT name FROM plugin_registry WHERE id = $1
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    if (pluginData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    const pluginName = pluginData[0].name;
    const migrationVersion = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // Check if table actually exists in database
    const tableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      )
    `, {
      bind: [table_name],
      type: sequelize.QueryTypes.SELECT
    });

    const tableExistsInDB = tableExists[0].exists;

    // Generate SQL based on whether table exists in database
    let upSQL, downSQL, migrationDescription;
    let warnings = []; // Track risky operations for warnings

    if (tableExistsInDB) {

      // Get existing entity schema from database to compare
      const existingEntity = await sequelize.query(`
        SELECT schema_definition FROM plugin_entities
        WHERE plugin_id = $1 AND entity_name = $2
      `, {
        bind: [id, entity_name],
        type: sequelize.QueryTypes.SELECT
      });

      if (existingEntity.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found in database. Cannot generate ALTER TABLE migration. Use CREATE TABLE instead.'
        });
      }

      const oldSchema = existingEntity[0].schema_definition;
      const oldColumns = oldSchema.columns || [];
      const newColumns = schema_definition.columns || [];

      // Detect changes
      const oldColumnNames = oldColumns.map(c => c.name);
      const newColumnNames = newColumns.map(c => c.name);

      const addedColumns = newColumns.filter(c => !oldColumnNames.includes(c.name));
      const removedColumns = oldColumns.filter(c => !newColumnNames.includes(c.name));
      const modifiedColumns = newColumns.filter(newCol => {
        const oldCol = oldColumns.find(c => c.name === newCol.name);
        if (!oldCol) return false;
        return JSON.stringify(oldCol) !== JSON.stringify(newCol);
      });

      // Detect risky operations for warnings
      if (removedColumns.length > 0) {
        warnings.push(`⚠️ DROPS ${removedColumns.length} COLUMN(S) - Data will be permanently deleted!`);
      }
      if (modifiedColumns.length > 0) {
        const typeChanges = modifiedColumns.filter(col => {
          const oldCol = oldColumns.find(c => c.name === col.name);
          return oldCol.type !== col.type;
        });
        if (typeChanges.length > 0) {
          warnings.push(`⚠️ CHANGES ${typeChanges.length} COLUMN TYPE(S) - May cause data loss or conversion errors!`);
        }
      }

      // Generate ALTER TABLE migration (all uncommented)
      upSQL = `-- =====================================================\n`;
      upSQL += `-- ALTER TABLE migration for ${table_name}\n`;
      upSQL += `-- Generated from entity: ${entity_name}\n`;
      upSQL += `-- =====================================================\n\n`;

      if (warnings.length > 0) {
        upSQL += `-- ⚠️ WARNING: This migration contains risky operations!\n`;
        warnings.forEach(w => {
          upSQL += `-- ${w}\n`;
        });
        upSQL += `--\n-- Please review carefully before executing.\n`;
        upSQL += `-- Consider backing up your database first.\n`;
        upSQL += `-- =====================================================\n\n`;
      }

      if (addedColumns.length === 0 && removedColumns.length === 0 && modifiedColumns.length === 0) {
        upSQL += `-- No schema changes detected\n`;
        upSQL += `-- This migration was generated but no changes are needed\n`;
      } else {
        // Add new columns
        if (addedColumns.length > 0) {
          upSQL += `-- Added Columns (${addedColumns.length})\n`;
          upSQL += `-- =====================================================\n\n`;
          addedColumns.forEach(col => {
            upSQL += `ALTER TABLE ${table_name} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
            if (col.default) upSQL += ` DEFAULT ${col.default}`;
            if (col.nullable === false) upSQL += ' NOT NULL';
            if (col.comment) upSQL += `;\nCOMMENT ON COLUMN ${table_name}.${col.name} IS '${col.comment}'`;
            upSQL += ';\n\n';
          });
        }

        // Modified columns (ALL UNCOMMENTED - user will see warnings)
        if (modifiedColumns.length > 0) {
          upSQL += `-- Modified Columns (${modifiedColumns.length})\n`;
          upSQL += `-- =====================================================\n\n`;
          modifiedColumns.forEach(col => {
            const oldCol = oldColumns.find(c => c.name === col.name);
            upSQL += `-- Column: ${col.name}\n`;
            upSQL += `--   Old: ${oldCol.type}${oldCol.nullable === false ? ' NOT NULL' : ''}${oldCol.default ? ` DEFAULT ${oldCol.default}` : ''}\n`;
            upSQL += `--   New: ${col.type}${col.nullable === false ? ' NOT NULL' : ''}${col.default ? ` DEFAULT ${col.default}` : ''}\n\n`;

            if (oldCol.type !== col.type) {
              upSQL += `ALTER TABLE ${table_name} ALTER COLUMN ${col.name} TYPE ${col.type};\n`;
            }
            if (col.nullable !== oldCol.nullable) {
              upSQL += `ALTER TABLE ${table_name} ALTER COLUMN ${col.name} ${col.nullable === false ? 'SET NOT NULL' : 'DROP NOT NULL'};\n`;
            }
            if (col.default !== oldCol.default) {
              upSQL += `ALTER TABLE ${table_name} ALTER COLUMN ${col.name} ${col.default ? `SET DEFAULT ${col.default}` : 'DROP DEFAULT'};\n`;
            }
            upSQL += '\n';
          });
        }

        // Removed columns (UNCOMMENTED - user will see warnings)
        if (removedColumns.length > 0) {
          upSQL += `-- Removed Columns (${removedColumns.length})\n`;
          upSQL += `-- =====================================================\n\n`;
          removedColumns.forEach(col => {
            upSQL += `-- Dropping ${col.name} (${col.type})\n`;
            upSQL += `ALTER TABLE ${table_name} DROP COLUMN IF EXISTS ${col.name};\n\n`;
          });
        }

        // New indexes
        const oldIndexes = oldSchema.indexes || [];
        const newIndexes = schema_definition.indexes || [];
        const addedIndexes = newIndexes.filter(newIdx =>
          !oldIndexes.some(oldIdx => oldIdx.name === newIdx.name)
        );

        if (addedIndexes.length > 0) {
          upSQL += `-- New Indexes (${addedIndexes.length})\n`;
          upSQL += `-- =====================================================\n\n`;
          addedIndexes.forEach(idx => {
            const columns = idx.columns.join(', ');
            const order = idx.order ? ` ${idx.order}` : '';
            upSQL += `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${table_name}(${columns}${order});\n`;
          });
          upSQL += '\n';
        }
      }

      downSQL = `-- =====================================================\n`;
      downSQL += `-- ROLLBACK for ALTER TABLE migration\n`;
      downSQL += `-- =====================================================\n`;
      downSQL += `-- ⚠️ Manual rollback required for ALTER TABLE changes\n`;
      downSQL += `-- Review the changes above and write appropriate rollback SQL\n\n`;

      if (addedColumns.length > 0) {
        downSQL += `-- Drop added columns:\n`;
        addedColumns.forEach(col => {
          downSQL += `-- ALTER TABLE ${table_name} DROP COLUMN IF EXISTS ${col.name};\n`;
        });
        downSQL += '\n';
      }

      migrationDescription = `Update ${table_name} table schema for ${entity_name} entity`;

    } else {
      // Generate CREATE TABLE migration
      upSQL = `CREATE TABLE IF NOT EXISTS ${table_name} (\n`;

      const columnDefs = schema_definition.columns.map(col => {
        let def = `  ${col.name} ${col.type}`;
        if (col.primaryKey) def += ' PRIMARY KEY';
        if (col.default) def += ` DEFAULT ${col.default}`;
        if (col.nullable === false) def += ' NOT NULL';
        return def;
      });

      upSQL += columnDefs.join(',\n');
      upSQL += '\n);\n\n';

      // Add indexes
      if (schema_definition.indexes && schema_definition.indexes.length > 0) {
        schema_definition.indexes.forEach(idx => {
          const columns = idx.columns.join(', ');
          const order = idx.order ? ` ${idx.order}` : '';
          upSQL += `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${table_name}(${columns}${order});\n`;
        });
        upSQL += '\n';
      }

      // Add comment
      upSQL += `COMMENT ON TABLE ${table_name} IS 'Entity table for ${entity_name}';`;

      downSQL = `DROP TABLE IF EXISTS ${table_name} CASCADE;`;
      migrationDescription = `Create ${table_name} table for ${entity_name} entity`;
    }

    // Determine migration file name
    let migrationFileName;
    if (tableExistsInDB) {
      // Generate descriptive name for ALTER TABLE based on changes
      let migrationNameParts = ['alter', table_name, 'table'];

      const oldSchema = await sequelize.query(`
        SELECT schema_definition FROM plugin_entities
        WHERE plugin_id = $1 AND entity_name = $2
      `, {
        bind: [id, entity_name],
        type: sequelize.QueryTypes.SELECT
      });

      if (oldSchema.length > 0) {
        const oldColumns = (oldSchema[0].schema_definition.columns || []).map(c => c.name);
        const newColumns = (schema_definition.columns || []).map(c => c.name);
        const addedCols = newColumns.filter(c => !oldColumns.includes(c));
        const removedCols = oldColumns.filter(c => !newColumns.includes(c));

        if (addedCols.length > 0 && addedCols.length <= 3) {
          migrationNameParts.push('add', ...addedCols);
        } else if (addedCols.length > 3) {
          migrationNameParts.push('add', `${addedCols.length}_columns`);
        }

        if (removedCols.length > 0 && removedCols.length <= 3) {
          migrationNameParts.push('drop', ...removedCols);
        } else if (removedCols.length > 3) {
          migrationNameParts.push('drop', `${removedCols.length}_columns`);
        }
      }

      migrationFileName = migrationNameParts.join('_') + '.sql';
    } else {
      // Simple name for CREATE TABLE
      migrationFileName = `create_${table_name}_table.sql`;
    }

    // Create PENDING migration (don't execute)
    await sequelize.query(`
      INSERT INTO plugin_migrations (
        plugin_id, plugin_name, migration_name, migration_version,
        migration_description, status, up_sql, down_sql
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
    `, {
      bind: [
        id,
        pluginName,
        migrationFileName,
        migrationVersion,
        migrationDescription,
        upSQL,
        downSQL
      ]
    });

    res.json({
      success: true,
      migrationVersion,
      entityName: entity_name,
      tableName: table_name,
      status: 'pending',
      warnings: warnings.length > 0 ? warnings : undefined,
      message: 'Migration generated successfully. Review and run from migrations folder.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
