const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * PluginConfiguration Model
 * Stores store-specific configuration for plugins
 * This allows one plugin to be installed platform-wide but configured per store
 */
const PluginConfiguration = sequelize.define('PluginConfiguration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Foreign Keys
  pluginId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'plugin_id',
    references: {
      model: 'plugins',
      key: 'id'
    },
    comment: 'Reference to the installed plugin'
  },
  storeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'store_id',
    references: {
      model: 'stores',
      key: 'id'
    },
    comment: 'Reference to the store'
  },
  
  // Configuration Status
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_enabled',
    comment: 'Whether this plugin is enabled for this store'
  },
  
  // Store-specific Configuration
  configData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'config_data',
    comment: 'Store-specific configuration values'
  },
  
  // Settings metadata
  lastConfiguredBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'last_configured_by',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who last configured this plugin for this store'
  },
  lastConfiguredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_configured_at',
    comment: 'When this plugin was last configured for this store'
  },
  
  // Status tracking
  enabledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'enabled_at',
    comment: 'When this plugin was enabled for this store'
  },
  disabledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'disabled_at',
    comment: 'When this plugin was disabled for this store'
  },
  
  // Health and monitoring
  lastHealthCheck: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_health_check'
  },
  healthStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'health_status',
    comment: 'Health status for this store: healthy, unhealthy, unknown'
  },
  errorLog: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_log',
    comment: 'Store-specific plugin errors'
  }
}, {
  tableName: 'plugin_configurations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    // Unique constraint: one configuration per plugin per store
    { 
      fields: ['plugin_id', 'store_id'], 
      unique: true,
      name: 'unique_plugin_store_config'
    },
    { fields: ['store_id'] },
    { fields: ['plugin_id'] },
    { fields: ['is_enabled'] },
    { fields: ['health_status'] }
  ]
});

/**
 * Static methods for plugin configuration management
 */

/**
 * Find configuration for a specific plugin and store
 */
PluginConfiguration.findByPluginAndStore = async function(pluginId, storeId) {
  return await this.findOne({ 
    where: { pluginId, storeId }
  });
};

/**
 * Find all configurations for a store
 */
PluginConfiguration.findByStore = async function(storeId, options = {}) {
  const query = { 
    where: { storeId },
    order: [['updated_at', 'DESC']]
  };
  
  if (options.enabledOnly) {
    query.where.isEnabled = true;
  }
  
  return await this.findAll(query);
};

/**
 * Find all configurations for a plugin across stores
 */
PluginConfiguration.findByPlugin = async function(pluginId, options = {}) {
  const query = { 
    where: { pluginId },
    include: [
      {
        model: sequelize.models.Store,
        as: 'store'
      }
    ],
    order: [['updated_at', 'DESC']]
  };
  
  if (options.enabledOnly) {
    query.where.isEnabled = true;
  }
  
  return await this.findAll(query);
};

/**
 * Enable plugin for a store
 */
PluginConfiguration.enableForStore = async function(pluginId, storeId, configData = {}, userId = null) {
  const [config, created] = await this.findOrCreate({
    where: { pluginId, storeId },
    defaults: {
      isEnabled: true,
      configData,
      lastConfiguredBy: userId,
      lastConfiguredAt: new Date(),
      enabledAt: new Date()
    }
  });
  
  if (!created && !config.isEnabled) {
    await config.update({
      isEnabled: true,
      configData: { ...config.configData, ...configData },
      lastConfiguredBy: userId,
      lastConfiguredAt: new Date(),
      enabledAt: new Date(),
      disabledAt: null
    });
  }
  
  return config;
};

/**
 * Disable plugin for a store
 */
PluginConfiguration.disableForStore = async function(pluginId, storeId, userId = null) {
  const config = await this.findByPluginAndStore(pluginId, storeId);
  
  if (config && config.isEnabled) {
    await config.update({
      isEnabled: false,
      lastConfiguredBy: userId,
      lastConfiguredAt: new Date(),
      disabledAt: new Date()
    });
  }
  
  return config;
};

/**
 * Update configuration for a store
 */
PluginConfiguration.updateConfig = async function(pluginId, storeId, configData, userId = null) {
  const config = await this.findByPluginAndStore(pluginId, storeId);
  
  if (config) {
    await config.update({
      configData: { ...config.configData, ...configData },
      lastConfiguredBy: userId,
      lastConfiguredAt: new Date()
    });
  }
  
  return config;
};

/**
 * Get enabled plugins for a store (for runtime use)
 */
PluginConfiguration.getEnabledPluginsForStore = async function(storeId) {
  return await this.findAll({
    where: { 
      storeId, 
      isEnabled: true 
    }
  });
};

/**
 * Instance methods
 */

/**
 * Get merged configuration (plugin defaults + store overrides)
 */
PluginConfiguration.prototype.getMergedConfig = function() {
  const pluginDefaults = this.plugin?.configSchema?.defaults || {};
  return {
    ...pluginDefaults,
    ...this.configData
  };
};

/**
 * Update health status for this store configuration
 */
PluginConfiguration.prototype.updateHealthStatus = async function(status, error = null) {
  return await this.update({
    healthStatus: status,
    lastHealthCheck: new Date(),
    errorLog: error ? error.message || error : null
  });
};

/**
 * Check if configuration is valid according to plugin schema
 */
PluginConfiguration.prototype.validateConfig = function() {
  if (!this.plugin || !this.plugin.configSchema) {
    return { valid: true, errors: [] };
  }
  
  const schema = this.plugin.configSchema;
  const config = this.configData;
  const errors = [];
  
  // Basic validation - you might want to use a proper JSON schema validator
  if (schema.required) {
    for (const field of schema.required) {
      if (!config[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = PluginConfiguration;