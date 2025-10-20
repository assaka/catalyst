/**
 * Dynamic Plugin API Handler
 * Replaces unified-plugins.js with database-driven plugin execution
 */

const express = require('express');
const router = express.Router();
const PluginRegistry = require('../core/PluginRegistry');
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');

let pluginRegistry = null;

// Initialize plugin registry
const initializePluginRegistry = async (db) => {
  if (!pluginRegistry) {
    pluginRegistry = new PluginRegistry(db);
    await pluginRegistry.initialize();
  }
  return pluginRegistry;
};

// Generic plugin endpoint handler - routes to database-stored plugin code
router.all('/dynamic/:pluginId/*', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { pluginId } = req.params;
    const path = req.params[0]; // Everything after /dynamic/:pluginId/
    const method = req.method;
    
    console.log(`🔌 Dynamic plugin request: ${method} ${pluginId}/${path}`);
    
    // Get plugin endpoints from database
    const endpoints = await pluginRegistry.getPluginEndpoints(pluginId);
    const endpoint = endpoints.find(ep => 
      ep.method === method && 
      matchPath(ep.path, `/${path}`) &&
      ep.enabled
    );
    
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        error: `Plugin endpoint not found: ${method} /${path}`,
        pluginId
      });
    }
    
    // Execute the plugin endpoint code
    const context = {
      req: {
        method: req.method,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers,
        user: req.user,
        storeId: req.storeId
      },
      res: {
        json: (data) => res.json(data),
        status: (code) => res.status(code),
        send: (data) => res.send(data)
      },
      db: req.db || null // Database connection would be injected
    };
    
    // Execute plugin code in sandbox
    const execution = await pluginRegistry.executePluginCode(
      pluginId,
      'api',
      endpoint.handler_code,
      context
    );
    
    if (!execution.success) {
      return res.status(500).json({
        success: false,
        error: 'Plugin execution failed',
        details: execution.result?.error
      });
    }
    
    // If the plugin code didn't send a response, send the result
    if (!res.headersSent) {
      res.json({
        success: true,
        data: execution.result,
        executionTime: execution.executionTime
      });
    }
    
  } catch (error) {
    console.error('Error in dynamic plugin handler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint for debugging - no auth required
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Plugin registry is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Plugin management endpoints
router.get('/registry', authMiddleware, async (req, res) => {
  try {
    const { category, type, status } = req.query;
    let query = 'SELECT * FROM plugin_registry WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }
    
    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }
    
    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }
    
    const result = await req.db.query(query + ' ORDER BY name ASC', params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error getting plugin registry:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register new plugin
router.post('/registry', authMiddleware, async (req, res) => {
  try {
    const result = await pluginRegistry.registerPlugin(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Plugin registered successfully',
        pluginId: result.pluginId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error registering plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get plugin details
router.get('/registry/:pluginId', authMiddleware, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    const pluginResult = await req.db.query(
      'SELECT * FROM plugin_registry WHERE id = $1',
      [pluginId]
    );
    
    if (pluginResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }
    
    const plugin = pluginResult.rows[0];
    
    // Get hooks, events, endpoints, and admin pages
    const [hooks, events, endpoints, adminPages] = await Promise.all([
      pluginRegistry.getPluginHooks(pluginId),
      req.db.query('SELECT * FROM plugin_events WHERE plugin_id = $1', [pluginId]),
      pluginRegistry.getPluginEndpoints(pluginId),
      req.db.query('SELECT * FROM plugin_admin_pages WHERE plugin_id = $1 ORDER BY order_position ASC', [pluginId])
    ]);

    res.json({
      success: true,
      data: {
        ...plugin,
        hooks: hooks,
        events: events.rows,
        endpoints: endpoints,
        adminPages: adminPages.rows
      }
    });
  } catch (error) {
    console.error('Error getting plugin details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update plugin status
router.patch('/registry/:pluginId/status', authMiddleware, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'error'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: active, inactive, or error'
      });
    }
    
    await req.db.query(
      'UPDATE plugin_registry SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, pluginId]
    );
    
    res.json({
      success: true,
      message: `Plugin status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating plugin status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete plugin
router.delete('/registry/:pluginId', authMiddleware, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    const result = await req.db.query(
      'DELETE FROM plugin_registry WHERE id = $1',
      [pluginId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Plugin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get plugin execution logs
router.get('/registry/:pluginId/logs', authMiddleware, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await req.db.query(`
      SELECT * FROM plugin_execution_logs
      WHERE plugin_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [pluginId, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error getting plugin logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get plugin admin pages
router.get('/admin-pages/:pluginId', authMiddleware, async (req, res) => {
  try {
    const { pluginId } = req.params;

    const result = await req.db.query(`
      SELECT
        id,
        plugin_id,
        page_key,
        page_name,
        route,
        description,
        icon,
        category,
        order_position,
        is_enabled,
        created_at,
        updated_at
      FROM plugin_admin_pages
      WHERE plugin_id = $1
      ORDER BY order_position ASC
    `, [pluginId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting plugin admin pages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Plugin hooks execution endpoint
router.post('/hooks/:hookName', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { hookName } = req.params;
    const { input, context = {} } = req.body;
    
    // Get all active hooks for this hook name
    const hooks = await req.db.query(`
      SELECT h.*, p.security_level 
      FROM plugin_hooks h
      JOIN plugin_registry p ON h.plugin_id = p.id
      WHERE h.hook_name = $1 AND h.enabled = true AND p.status = 'active'
      ORDER BY h.priority ASC
    `, [hookName]);
    
    let result = input;
    const executionResults = [];
    
    for (const hook of hooks.rows) {
      try {
        const execution = await pluginRegistry.executePluginCode(
          hook.plugin_id,
          'hook',
          hook.handler_code,
          { input: result, context, hookName }
        );
        
        if (execution.success) {
          result = execution.result;
          executionResults.push({
            pluginId: hook.plugin_id,
            success: true,
            executionTime: execution.executionTime
          });
        } else {
          executionResults.push({
            pluginId: hook.plugin_id,
            success: false,
            error: execution.result?.error
          });
        }
      } catch (error) {
        console.error(`Error executing hook ${hookName} for plugin ${hook.plugin_id}:`, error);
        executionResults.push({
          pluginId: hook.plugin_id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: result,
      hookExecutions: executionResults,
      hooksExecuted: hooks.rows.length
    });
  } catch (error) {
    console.error('Error executing hooks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Plugin events trigger endpoint
router.post('/events/:eventName', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { eventName } = req.params;
    const { data, context = {} } = req.body;
    
    // Get all active event listeners
    const events = await req.db.query(`
      SELECT e.*, p.security_level 
      FROM plugin_events e
      JOIN plugin_registry p ON e.plugin_id = p.id
      WHERE e.event_name = $1 AND e.enabled = true AND p.status = 'active'
      ORDER BY e.priority ASC
    `, [eventName]);
    
    const executionResults = [];
    
    // Execute all event listeners in parallel
    const executions = events.rows.map(async (event) => {
      try {
        const execution = await pluginRegistry.executePluginCode(
          event.plugin_id,
          'event',
          event.listener_code,
          { data, context, eventName }
        );
        
        return {
          pluginId: event.plugin_id,
          success: execution.success,
          executionTime: execution.executionTime,
          error: execution.success ? null : execution.result?.error
        };
      } catch (error) {
        console.error(`Error executing event ${eventName} for plugin ${event.plugin_id}:`, error);
        return {
          pluginId: event.plugin_id,
          success: false,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(executions);
    
    res.json({
      success: true,
      message: `Event ${eventName} triggered`,
      eventExecutions: results,
      listenersExecuted: events.rows.length
    });
  } catch (error) {
    console.error('Error triggering events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to match paths with parameters
function matchPath(pattern, actual) {
  // Simple path matching - could be enhanced with proper regex
  const patternParts = pattern.split('/').filter(p => p);
  const actualParts = actual.split('/').filter(p => p);
  
  if (patternParts.length !== actualParts.length) {
    return false;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const actualPart = actualParts[i];
    
    // Skip parameter parts (start with :)
    if (patternPart.startsWith(':')) {
      continue;
    }
    
    if (patternPart !== actualPart) {
      return false;
    }
  }
  
  return true;
}

// Export initialization function
module.exports = {
  router,
  initializePluginRegistry
};