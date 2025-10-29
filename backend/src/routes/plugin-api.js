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

      console.log(`  ✅ Loaded ${pluginEntities.length} entities from plugin_entities table`);
    } catch (entitiesError) {
      console.log(`  ⚠️ plugin_entities table error:`, entitiesError.message);
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

      console.log(`  ✅ Loaded ${pluginControllers.length} controllers from plugin_controllers table`);
    } catch (controllersError) {
      console.log(`  ⚠️ plugin_controllers table error:`, controllersError.message);
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

      console.log(`  ✅ Loaded ${pluginMigrations.length} migrations from plugin_migrations table`);
    } catch (migrationsError) {
      console.log(`  ⚠️ plugin_migrations table error:`, migrationsError.message);
    }

    // Parse JSON fields
    const manifest = typeof plugin[0].manifest === 'string' ? JSON.parse(plugin[0].manifest) : plugin[0].manifest;
    const sourceCode = typeof plugin[0].source_code === 'string' ? JSON.parse(plugin[0].source_code) : plugin[0].source_code;

    // Merge files from multiple sources:
    // 1. manifest.generatedFiles (old format)
    // 2. source_code JSON field (old format)
    // 3. plugin_scripts table (new normalized format)
    // 4. plugin_events table (new normalized format)
    // 5. plugin_entities table (new normalized format)
    // 6. plugin_controllers table (new normalized format)
    // 7. plugin_migrations table (new normalized format)
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

    // Add files from plugin_entities table
    allFiles = allFiles.concat(pluginEntities);

    // Add files from plugin_controllers table
    allFiles = allFiles.concat(pluginControllers);

    // Add files from plugin_migrations table
    allFiles = allFiles.concat(pluginMigrations);

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
    console.log(`  🗄️  Entities from DB: ${pluginEntities.length}`);
    console.log(`  🎮 Controllers from DB: ${pluginControllers.length}`);
    console.log(`  🔄 Migrations from DB: ${pluginMigrations.length}`);
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

    // Get entities
    const entities = await sequelize.query(`
      SELECT name, code
      FROM plugin_entities
      WHERE plugin_id = $1
      ORDER BY name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get migrations
    const migrations = await sequelize.query(`
      SELECT name, code
      FROM plugin_migrations
      WHERE plugin_id = $1
      ORDER BY name ASC
    `, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    // Get controllers
    const controllers = await sequelize.query(`
      SELECT name, code
      FROM plugin_controllers
      WHERE plugin_id = $1
      ORDER BY name ASC
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
      })),

      entities: entities.map(e => ({
        name: e.name,
        code: e.code
      })),

      migrations: migrations.map(m => ({
        name: m.name,
        code: m.code
      })),

      controllers: controllers.map(c => ({
        name: c.name,
        code: c.code
      }))
    };

    console.log(`  ✅ Exported ${scripts.length} files, ${events.length} events, ${hooks.length} hooks, ${widgets.length} widgets, ${entities.length} entities, ${migrations.length} migrations, ${controllers.length} controllers`);

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

    // Import entities
    for (const entity of packageData.entities || []) {
      await sequelize.query(`
        INSERT INTO plugin_entities (
          plugin_id, name, code
        )
        VALUES ($1, $2, $3)
      `, {
        bind: [
          pluginId,
          entity.name,
          entity.code
        ],
        type: sequelize.QueryTypes.INSERT
      });
    }

    // Import migrations
    for (const migration of packageData.migrations || []) {
      await sequelize.query(`
        INSERT INTO plugin_migrations (
          plugin_id, name, code
        )
        VALUES ($1, $2, $3)
      `, {
        bind: [
          pluginId,
          migration.name,
          migration.code
        ],
        type: sequelize.QueryTypes.INSERT
      });
    }

    // Import controllers
    for (const controller of packageData.controllers || []) {
      await sequelize.query(`
        INSERT INTO plugin_controllers (
          plugin_id, name, code
        )
        VALUES ($1, $2, $3)
      `, {
        bind: [
          pluginId,
          controller.name,
          controller.code
        ],
        type: sequelize.QueryTypes.INSERT
      });
    }

    console.log(`  ✅ Imported: ${packageData.files?.length || 0} files, ${packageData.events?.length || 0} events, ${packageData.hooks?.length || 0} hooks, ${packageData.widgets?.length || 0} widgets, ${packageData.entities?.length || 0} entities, ${packageData.migrations?.length || 0} migrations, ${packageData.controllers?.length || 0} controllers`);

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

    // Handle entity files - update plugin_entities table
    if (normalizedRequestPath.startsWith('entities/')) {
      const entityFileName = normalizedRequestPath.replace('entities/', '').replace('.json', '');

      console.log(`🔄 Saving entity file: ${entityFileName}`);

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
          console.log(`✅ Updated entity: ${entityName}`);
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
          console.log(`✅ Created entity: ${entityName}`);
        }

        return res.json({
          success: true,
          message: 'Entity saved successfully in plugin_entities table'
        });
      } catch (entityError) {
        console.error(`❌ Error saving entity:`, entityError);
        return res.status(500).json({
          success: false,
          error: `Failed to save entity: ${entityError.message}`
        });
      }
    }

    // Handle controller files - update plugin_controllers table
    if (normalizedRequestPath.startsWith('controllers/')) {
      const controllerFileName = normalizedRequestPath.replace('controllers/', '').replace('.js', '');

      console.log(`🔄 Saving controller file: ${controllerFileName}`);

      try {
        // Note: For now, just save to plugin_scripts
        // Full controller metadata editing would require parsing the function code
        // or having a separate UI for controller properties
        console.log(`⚠️ Controller files saved to plugin_scripts (full controller editing not yet implemented)`);
      } catch (err) {
        console.log(`⚠️ Controller save error:`, err.message);
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
    const { file_name, old_file_name, file_path, event_name, old_event_name, listener_function, priority = 10, description } = req.body;

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
    // Lookup by old_file_name or old_event_name (for editing existing events)
    let existing = [];

    if (old_file_name) {
      // Look up by old filename (most reliable for renames)
      console.log(`  🔍 Looking for existing event by filename: ${old_file_name}`);
      existing = await sequelize.query(`
        SELECT id, event_name FROM plugin_events
        WHERE plugin_id = $1 AND file_name = $2
      `, {
        bind: [pluginId, old_file_name],
        type: sequelize.QueryTypes.SELECT
      });
    } else if (old_event_name) {
      // Fall back to old_event_name for backwards compatibility
      console.log(`  🔍 Looking for existing event by event name: ${old_event_name}`);
      existing = await sequelize.query(`
        SELECT id, event_name FROM plugin_events
        WHERE plugin_id = $1 AND event_name = $2
      `, {
        bind: [pluginId, old_event_name],
        type: sequelize.QueryTypes.SELECT
      });
    } else {
      // New event - check if event_name already exists
      existing = await sequelize.query(`
        SELECT id, event_name FROM plugin_events
        WHERE plugin_id = $1 AND event_name = $2
      `, {
        bind: [pluginId, event_name],
        type: sequelize.QueryTypes.SELECT
      });
    }

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

      const changes = [];
      if (old_file_name && old_file_name !== fileName) changes.push(`filename: ${old_file_name} → ${fileName}`);
      if (old_event_name && oldEventName !== event_name) changes.push(`event: ${oldEventName} → ${event_name}`);

      console.log(`✅ Updated event${changes.length > 0 ? ' (' + changes.join(', ') + ')' : ''}`);
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

/**
 * POST /api/plugins/cart-hamid/track-visit
 * Track a cart page visit (Cart Hamid Plugin)
 */
router.post('/cart-hamid/track-visit', async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      cart_items_count,
      cart_subtotal,
      cart_total,
      user_agent,
      referrer_url
    } = req.body;

    const result = await sequelize.query(`
      INSERT INTO hamid_cart (
        user_id, session_id, cart_items_count,
        cart_subtotal, cart_total, user_agent,
        ip_address, referrer_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, {
      bind: [
        user_id || null,
        session_id || null,
        cart_items_count || 0,
        cart_subtotal || 0,
        cart_total || 0,
        user_agent || null,
        req.ip || null,
        referrer_url || null
      ],
      type: sequelize.QueryTypes.INSERT
    });

    console.log('✅ Cart visit tracked:', result[0][0].id);

    res.json({
      success: true,
      visit: result[0][0]
    });
  } catch (error) {
    console.error('Failed to track cart visit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/cart-hamid/visits
 * Get all cart visits with pagination (Cart Hamid Plugin)
 */
router.get('/cart-hamid/visits', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const visits = await sequelize.query(`
      SELECT * FROM hamid_cart
      ORDER BY visited_at DESC
      LIMIT $1 OFFSET $2
    `, {
      bind: [limit, offset],
      type: sequelize.QueryTypes.SELECT
    });

    const countResult = await sequelize.query(`
      SELECT COUNT(*) as total FROM hamid_cart
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult[0].total || countResult[0].count || 0);

    console.log(`✅ Fetched ${visits.length} cart visits (total: ${total})`);

    res.json({
      success: true,
      visits,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to get cart visits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/cart-hamid/stats
 * Get cart visit statistics (Cart Hamid Plugin)
 */
router.get('/cart-hamid/stats', async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT
        COUNT(*) as total_visits,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(cart_items_count) as avg_items,
        AVG(cart_total) as avg_total,
        MAX(visited_at) as last_visit
      FROM hamid_cart
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    console.log('✅ Cart visit stats retrieved');

    res.json({
      success: true,
      ...stats[0]
    });
  } catch (error) {
    console.error('Failed to get cart stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/plugins/registry/:id/files
 * Delete a specific file from a plugin
 */
router.delete('/registry/:id/files', async (req, res) => {
  try {
    console.log('🗑️ DELETE /registry/:id/files called');
    console.log('   req.params:', req.params);
    console.log('   req.body:', req.body);

    const { id } = req.params;
    const { path } = req.body;

    if (!path) {
      console.log('❌ No path provided in request body');
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    console.log(`🗑️ Deleting file: ${path} from plugin ${id}`);

    // Normalize paths for comparison
    const normalizePath = (p) => p.replace(/^\/+/, '').replace(/^src\//, '');
    const normalizedPath = normalizePath(path);

    console.log(`📝 Normalized path: ${normalizedPath}`);

    // Prevent deletion of critical files
    if (normalizedPath === 'manifest.json' || normalizedPath === 'README.md') {
      console.log('❌ Attempted to delete critical file');
      return res.status(400).json({
        success: false,
        error: 'Cannot delete critical files (manifest.json, README.md)'
      });
    }

    let deleted = false;
    let attemptedTable = null;

    // Handle different file types based on path

    // Delete from plugin_events table
    if (normalizedPath.startsWith('events/')) {
      const fileName = normalizedPath.replace('events/', '');
      attemptedTable = 'plugin_events';
      console.log(`🎯 Attempting to delete from ${attemptedTable}, fileName: ${fileName}`);
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_events
          WHERE plugin_id = $1 AND file_name = $2
        `, {
          bind: [id, fileName],
          type: sequelize.QueryTypes.DELETE
        });
        console.log(`✅ Deleted event file from plugin_events: ${fileName}`);
        deleted = true;
      } catch (err) {
        console.log(`❌ plugin_events delete error:`, err.message);
        console.log(`   Error details:`, err);
      }
    }
    // Delete from plugin_entities table
    else if (normalizedPath.startsWith('entities/')) {
      const fileName = normalizedPath.replace('entities/', '').replace('.json', '');
      attemptedTable = 'plugin_entities';
      console.log(`🎯 Attempting to delete from ${attemptedTable}, entityName: ${fileName}`);
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_entities
          WHERE plugin_id = $1 AND entity_name = $2
        `, {
          bind: [id, fileName],
          type: sequelize.QueryTypes.DELETE
        });
        console.log(`✅ Deleted entity from plugin_entities: ${fileName}`);
        console.log(`   Delete result:`, result);
        deleted = true;
      } catch (err) {
        console.log(`❌ plugin_entities delete error:`, err.message);
        console.log(`   Error details:`, err);
      }
    }
    // Delete from plugin_controllers table
    else if (normalizedPath.startsWith('controllers/')) {
      const fileName = normalizedPath.replace('controllers/', '').replace('.js', '');
      attemptedTable = 'plugin_controllers';
      console.log(`🎯 Attempting to delete from ${attemptedTable}, controllerName: ${fileName}`);
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_controllers
          WHERE plugin_id = $1 AND controller_name = $2
        `, {
          bind: [id, fileName],
          type: sequelize.QueryTypes.DELETE
        });
        console.log(`✅ Deleted controller from plugin_controllers: ${fileName}`);
        deleted = true;
      } catch (err) {
        console.log(`❌ plugin_controllers delete error:`, err.message);
        console.log(`   Error details:`, err);
      }
    }
    // Delete from plugin_scripts table
    else {
      attemptedTable = 'plugin_scripts';
      console.log(`🎯 Attempting to delete from ${attemptedTable}, fileName: ${normalizedPath}`);
      try {
        const result = await sequelize.query(`
          DELETE FROM plugin_scripts
          WHERE plugin_id = $1 AND file_name = $2
        `, {
          bind: [id, normalizedPath],
          type: sequelize.QueryTypes.DELETE
        });
        console.log(`✅ Deleted script from plugin_scripts: ${normalizedPath}`);
        console.log(`   Delete result:`, result);
        deleted = true;
      } catch (err) {
        console.log(`❌ plugin_scripts delete error:`, err.message);
        console.log(`   Error details:`, err);
      }
    }

    console.log(`📊 Delete operation result:`, {
      deleted,
      attemptedTable,
      pluginId: id,
      normalizedPath
    });

    if (!deleted) {
      console.log(`❌ File not found in any table`);
      return res.status(404).json({
        success: false,
        error: `File not found or could not be deleted. Attempted table: ${attemptedTable}`
      });
    }

    console.log(`✅ File deletion successful`);

    // ALSO delete from JSON fields (manifest.generatedFiles and source_code)
    // This ensures files don't reappear after deletion from normalized tables
    try {
      console.log(`🔄 Also removing from JSON fields...`);

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
          const beforeCount = manifest.generatedFiles.length;
          manifest.generatedFiles = manifest.generatedFiles.filter(f => {
            const fName = f.name || f.filename || '';
            return fName !== normalizedPath && fName !== `/${normalizedPath}` && fName !== path;
          });
          const afterCount = manifest.generatedFiles.length;
          console.log(`   Removed ${beforeCount - afterCount} file(s) from manifest.generatedFiles`);
        }

        // Remove from source_code array
        if (Array.isArray(sourceCode)) {
          const beforeCount = sourceCode.length;
          sourceCode = sourceCode.filter(f => {
            const fName = f.name || f.filename || '';
            return fName !== normalizedPath && fName !== `/${normalizedPath}` && fName !== path;
          });
          const afterCount = sourceCode.length;
          console.log(`   Removed ${beforeCount - afterCount} file(s) from source_code`);
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

        console.log(`✅ Removed from JSON fields as well`);
      }
    } catch (jsonError) {
      console.log(`⚠️ Warning: Could not remove from JSON fields:`, jsonError.message);
      // Don't fail the request if JSON cleanup fails
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete file:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * POST /api/plugins/:id/run-migration
 * Execute an existing migration for a plugin
 */
router.post('/:id/run-migration', async (req, res) => {
  try {
    const { id } = req.params;
    const { migration_version, migration_name } = req.body;

    console.log(`🔄 Running migration ${migration_version} for plugin ${id}`);

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

    if (warnings.length > 0) {
      console.log(`⚠️ Risky operations detected:`, warnings);
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
    const { id } = req.params;
    const { entity_name, table_name, schema_definition, is_update } = req.body;

    console.log(`🔧 Generating ${is_update ? 'ALTER' : 'CREATE'} migration for entity ${entity_name} (${table_name})`);

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

    console.log(`🔍 Migration params:`, {
      is_update,
      entity_name,
      table_name,
      has_schema: !!schema_definition
    });

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
    console.log(`🗄️ Table '${table_name}' exists in database:`, tableExistsInDB ? 'YES' : 'NO');

    // Generate SQL based on whether table exists in database
    let upSQL, downSQL, migrationDescription;
    let warnings = []; // Track risky operations for warnings

    if (tableExistsInDB) {
      console.log(`📊 Generating ALTER TABLE migration (table exists)`);

      // Get existing entity schema from database to compare
      const existingEntity = await sequelize.query(`
        SELECT schema_definition FROM plugin_entities
        WHERE plugin_id = $1 AND entity_name = $2
      `, {
        bind: [id, entity_name],
        type: sequelize.QueryTypes.SELECT
      });

      console.log(`📦 Found existing entity:`, existingEntity.length > 0 ? 'YES' : 'NO');

      if (existingEntity.length === 0) {
        console.log(`❌ Entity not found in database, cannot generate ALTER TABLE`);
        return res.status(404).json({
          success: false,
          error: 'Entity not found in database. Cannot generate ALTER TABLE migration. Use CREATE TABLE instead.'
        });
      }

      const oldSchema = existingEntity[0].schema_definition;
      const oldColumns = oldSchema.columns || [];
      const newColumns = schema_definition.columns || [];

      console.log(`📋 Schema comparison:`, {
        oldColumns: oldColumns.length,
        newColumns: newColumns.length
      });
      console.log(`   Old column names:`, oldColumns.map(c => c.name));
      console.log(`   New column names:`, newColumns.map(c => c.name));

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
      console.log(`📊 Generating CREATE TABLE migration (table does not exist)`);

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

    console.log(`📝 Migration file name: ${migrationVersion}_${migrationFileName}`);

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

    console.log(`✅ Created pending migration: ${migrationVersion}`);
    if (warnings.length > 0) {
      console.log(`⚠️ Warnings:`, warnings);
    }

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
    console.error('Failed to generate and run migration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
