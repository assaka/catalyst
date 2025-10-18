// backend/src/core/PluginExecutor.js
const { sequelize } = require('../database/connection');

/**
 * Backend Plugin Executor
 * Handles plugin data loading and widget management
 * Note: Hook/Event execution happens on the frontend via HookSystem/EventSystem
 */
class PluginExecutor {

  /**
   * Load widget component code for rendering
   */
  async loadWidget(widgetId, tenantId) {
    try {
      const widget = await sequelize.query(`
        SELECT * FROM plugin_widgets WHERE id = $1 AND is_enabled = true
      `, {
        bind: [widgetId],
        type: sequelize.QueryTypes.SELECT
      });

      if (!widget[0]) {
        throw new Error('Widget not found');
      }

      // Return compiled component
      return {
        id: widget[0].id,
        name: widget[0].widget_name,
        displayName: widget[0].widget_name,
        componentCode: widget[0].component_code,
        defaultConfig: widget[0].default_config
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
      const widgets = await sequelize.query(`
        SELECT w.*, p.name as plugin_name
        FROM plugin_widgets w
        JOIN plugins p ON w.plugin_id = p.id
        WHERE w.is_enabled = true AND p.status = 'active'
        ORDER BY w.category, w.widget_name
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return widgets.map(w => ({
        id: w.id,
        name: w.widget_id,
        displayName: w.widget_name,
        icon: w.icon,
        category: w.category,
        description: w.description,
        pluginName: w.plugin_name,
        defaultConfig: w.default_config,
        previewImage: w.preview_image
      }));

    } catch (error) {
      console.error('Failed to get widgets:', error);
      throw error;
    }
  }

  /**
   * Get plugin hooks from database
   */
  async getPluginHooks(pluginId) {
    try {
      const hooks = await sequelize.query(`
        SELECT
          id,
          hook_name,
          hook_type,
          handler_function,
          priority,
          is_enabled
        FROM plugin_hooks
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY priority ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      return hooks;
    } catch (error) {
      console.error('Failed to get plugin hooks:', error);
      throw error;
    }
  }

  /**
   * Get plugin events from database
   */
  async getPluginEvents(pluginId) {
    try {
      const events = await sequelize.query(`
        SELECT
          id,
          event_name,
          listener_function,
          priority,
          is_enabled
        FROM plugin_events
        WHERE plugin_id = $1 AND is_enabled = true
        ORDER BY priority ASC
      `, {
        bind: [pluginId],
        type: sequelize.QueryTypes.SELECT
      });

      return events;
    } catch (error) {
      console.error('Failed to get plugin events:', error);
      throw error;
    }
  }
}

module.exports = new PluginExecutor();
