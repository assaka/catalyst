// backend/src/core/PluginExecutor.js
const hookSystem = require('../../core/HookSystem');
const eventSystem = require('../../core/EventSystem');
const db = require('../database/db');

class PluginExecutor {

  /**
   * Execute a hook - delegates to HookSystem
   */
  executeHook(hookName, data, context = {}) {
    return hookSystem.apply(hookName, data, context);
  }

  /**
   * Execute async hook
   */
  async executeHookAsync(hookName, data, context = {}) {
    return hookSystem.applyAsync(hookName, data, context);
  }

  /**
   * Execute action hook (no return value)
   */
  doHook(hookName, ...args) {
    return hookSystem.do(hookName, ...args);
  }

  /**
   * Execute async action hook
   */
  async doHookAsync(hookName, ...args) {
    return hookSystem.doAsync(hookName, ...args);
  }

  /**
   * Dispatch event - delegates to EventSystem
   */
  dispatchEvent(eventName, payload) {
    return eventSystem.emit(eventName, payload);
  }

  /**
   * Dispatch async event
   */
  async dispatchEventAsync(eventName, payload) {
    return eventSystem.emitAsync(eventName, payload);
  }

  /**
   * Load widget component code for rendering
   */
  async loadWidget(widgetId, tenantId) {
    try {
      const widget = await db.query(`
        SELECT * FROM plugin_widgets WHERE id = $1 AND is_active = true
      `, [widgetId]);

      if (!widget.rows[0]) {
        throw new Error('Widget not found');
      }

      // Return compiled component
      return {
        id: widget.rows[0].id,
        name: widget.rows[0].widget_name,
        displayName: widget.rows[0].display_name,
        componentCode: widget.rows[0].component_code,
        configSchema: widget.rows[0].config_schema,
        defaultConfig: widget.rows[0].default_config
      };

    } catch (error) {
      console.error('Failed to load widget:', error);
      throw error;
    }
  }

  /**
   * Get all available widgets for slot editor
   */
  async getAvailableWidgets(tenantId) {
    try {
      const widgets = await db.query(`
        SELECT w.*, p.name as plugin_name
        FROM plugin_widgets w
        JOIN plugins p ON w.plugin_id = p.id
        WHERE w.is_active = true AND p.status = 'active'
        ORDER BY w.category, w.display_name
      `);

      return widgets.rows.map(w => ({
        id: w.id,
        name: w.widget_name,
        displayName: w.display_name,
        icon: w.icon,
        category: w.category,
        description: w.description,
        pluginName: w.plugin_name,
        configSchema: w.config_schema,
        previewImage: w.preview_image_url
      }));

    } catch (error) {
      console.error('Failed to get widgets:', error);
      throw error;
    }
  }
}

module.exports = new PluginExecutor();
