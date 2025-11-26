const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../database/connection');

// Use TEXT for JSON fields when SQLite is used (stub connection)
// PostgreSQL would use JSONB, but SQLite doesn't support it
const isSQLite = sequelize.getDialect() === 'sqlite';
const JSON_TYPE = isSQLite ? DataTypes.TEXT : DataTypes.JSONB;

/**
 * Plugin Model
 * Tracks installed and available plugins with their configuration and status
 *
 * NOTE: This model uses the stub connection (SQLite in-memory) for schema definition only.
 * Actual queries should go through ConnectionManager for proper tenant database access.
 */
const Plugin = sequelize.define('Plugin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Human-readable plugin name'
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Unique plugin identifier/slug'
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Plugin version (semver)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Plugin description'
  },
  author: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Plugin author/creator'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Plugin category (integration, analytics, etc.)'
  },
  type: {
    type: DataTypes.STRING(50),
    defaultValue: 'plugin',
    comment: 'Plugin type'
  },
  
  // Installation details
  sourceType: {
    type: DataTypes.STRING(50),
    defaultValue: 'local',
    field: 'source_type',
    comment: 'Installation source: local, github, marketplace'
  },
  sourceUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'source_url',
    comment: 'GitHub URL or marketplace URL'
  },
  installPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'install_path',
    comment: 'Local filesystem path'
  },
  
  // Status
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'available',
    comment: 'Plugin status: available, installing, installed, enabled, disabled, error'
  },
  isInstalled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_installed'
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_enabled'
  },
  
  // Configuration
  configSchema: {
    type: JSON_TYPE,
    allowNull: true,
    field: 'config_schema',
    comment: 'Plugin configuration schema from manifest'
  },
  configData: {
    type: JSON_TYPE,
    defaultValue: isSQLite ? '{}' : {},
    field: 'config_data',
    comment: 'User configuration values'
  },

  // Dependencies and permissions
  dependencies: {
    type: JSON_TYPE,
    defaultValue: isSQLite ? '[]' : [],
    comment: 'Required dependencies'
  },
  permissions: {
    type: JSON_TYPE,
    defaultValue: isSQLite ? '[]' : [],
    comment: 'Required permissions'
  },

  // Metadata
  manifest: {
    type: JSON_TYPE,
    allowNull: true,
    comment: 'Full plugin manifest'
  },
  installationLog: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'installation_log',
    comment: 'Installation/error logs'
  },
  lastHealthCheck: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_health_check'
  },
  healthStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'health_status',
    comment: 'Health status: healthy, unhealthy, unknown'
  },
  
  // Timestamps
  installedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'installed_at'
  },
  enabledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'enabled_at'
  },
  disabledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'disabled_at'
  }
}, {
  tableName: 'plugins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['status'] },
    { fields: ['is_installed'] },
    { fields: ['is_enabled'] },
    { fields: ['category'] },
    { fields: ['source_type'] }
  ]
});

/**
 * Static methods for plugin management
 */

/**
 * Find plugin by slug
 */
Plugin.findBySlug = async function(slug) {
  return await this.findOne({ where: { slug } });
};

/**
 * Find all installed plugins
 */
Plugin.findInstalled = async function() {
  return await this.findAll({ 
    where: { isInstalled: true },
    order: [['name', 'ASC']]
  });
};

/**
 * Find all enabled plugins
 */
Plugin.findEnabled = async function() {
  return await this.findAll({ 
    where: { isEnabled: true },
    order: [['name', 'ASC']]
  });
};

/**
 * Find plugins by category
 */
Plugin.findByCategory = async function(category) {
  return await this.findAll({ 
    where: { category },
    order: [['name', 'ASC']]
  });
};

/**
 * Find plugins by source type
 */
Plugin.findBySourceType = async function(sourceType) {
  return await this.findAll({ 
    where: { sourceType },
    order: [['name', 'ASC']]
  });
};

/**
 * Create or update plugin record
 */
Plugin.createOrUpdate = async function(pluginData) {
  const existingPlugin = await this.findBySlug(pluginData.slug);
  
  if (existingPlugin) {
    return await existingPlugin.update(pluginData);
  } else {
    return await this.create(pluginData);
  }
};

/**
 * Mark plugin as installed
 */
Plugin.prototype.markInstalled = async function() {
  return await this.update({
    status: 'installed',
    isInstalled: true,
    installedAt: new Date()
  });
};

/**
 * Mark plugin as enabled
 */
Plugin.prototype.markEnabled = async function() {
  return await this.update({
    status: 'enabled',
    isEnabled: true,
    enabledAt: new Date()
  });
};

/**
 * Mark plugin as disabled
 */
Plugin.prototype.markDisabled = async function() {
  return await this.update({
    status: 'disabled',
    isEnabled: false,
    disabledAt: new Date()
  });
};

/**
 * Mark plugin as uninstalled
 */
Plugin.prototype.markUninstalled = async function() {
  return await this.update({
    status: 'available',
    isInstalled: false,
    isEnabled: false,
    installedAt: null,
    enabledAt: null,
    disabledAt: new Date()
  });
};

/**
 * Update health status
 */
Plugin.prototype.updateHealthStatus = async function(status, details = null) {
  return await this.update({
    healthStatus: status,
    lastHealthCheck: new Date(),
    installationLog: details ? JSON.stringify(details) : this.installationLog
  });
};

/**
 * Get plugin configuration with schema validation
 */
Plugin.prototype.getConfig = function() {
  return {
    schema: this.configSchema || {},
    data: this.configData || {},
    manifest: this.manifest || {}
  };
};

/**
 * Update plugin configuration
 */
Plugin.prototype.updateConfig = async function(configData) {
  return await this.update({
    configData: {
      ...this.configData,
      ...configData
    }
  });
};

module.exports = Plugin;