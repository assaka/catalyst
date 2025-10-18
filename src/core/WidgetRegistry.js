// src/core/WidgetRegistry.js

class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
  }

  /**
   * Register a widget for runtime use
   */
  registerWidget(pluginId, widgetDefinition) {
    const widgetId = `${pluginId}:${widgetDefinition.name}`;

    this.widgets.set(widgetId, {
      id: widgetId,
      pluginId,
      name: widgetDefinition.name,
      displayName: widgetDefinition.displayName,
      componentCode: widgetDefinition.code,
      configSchema: widgetDefinition.configSchema,
      defaultConfig: widgetDefinition.defaultConfig,
      icon: widgetDefinition.icon,
      category: widgetDefinition.category
    });

    console.log(`✅ Widget registered: ${widgetId}`);
  }

  /**
   * Get widget by ID
   */
  getWidget(widgetId) {
    return this.widgets.get(widgetId);
  }

  /**
   * Get all registered widgets
   */
  getAllWidgets() {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widgets by plugin
   */
  getWidgetsByPlugin(pluginId) {
    return Array.from(this.widgets.values())
      .filter(w => w.pluginId === pluginId);
  }

  /**
   * Unregister plugin widgets
   */
  unregisterPluginWidgets(pluginId) {
    const toRemove = [];

    for (const [widgetId, widget] of this.widgets) {
      if (widget.pluginId === pluginId) {
        toRemove.push(widgetId);
      }
    }

    toRemove.forEach(id => this.widgets.delete(id));

    console.log(`🗑️ Unregistered ${toRemove.length} widgets from plugin ${pluginId}`);
  }
}

export default new WidgetRegistry();
