const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const StoreDataMigration = sequelize.define('StoreDataMigration', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  migration_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  source_system: {
    type: DataTypes.STRING(50),
    defaultValue: 'catalyst'
  },
  target_system: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  supabase_project_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supabase_anon_key: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supabase_service_key: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  migration_status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'paused'),
    defaultValue: 'pending'
  },
  migration_config: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  migrated_tables: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  migration_progress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_log: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'store_data_migrations',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'migration_type', 'target_system']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['migration_status']
    },
    {
      fields: ['migration_type']
    }
  ]
});

// Instance methods
StoreDataMigration.prototype.start = async function() {
  return this.update({
    migration_status: 'in_progress',
    migration_progress: 0.00,
    updated_at: new Date()
  });
};

StoreDataMigration.prototype.complete = async function() {
  return this.update({
    migration_status: 'completed',
    migration_progress: 100.00,
    last_sync_at: new Date(),
    updated_at: new Date()
  });
};

StoreDataMigration.prototype.fail = async function(errorMessage) {
  const errors = [...(this.error_log || [])];
  errors.push({
    timestamp: new Date().toISOString(),
    error: errorMessage
  });
  
  return this.update({
    migration_status: 'failed',
    error_log: errors,
    updated_at: new Date()
  });
};

StoreDataMigration.prototype.pause = async function(reason = null) {
  const errors = [...(this.error_log || [])];
  if (reason) {
    errors.push({
      timestamp: new Date().toISOString(),
      reason: reason,
      type: 'pause'
    });
  }
  
  return this.update({
    migration_status: 'paused',
    error_log: errors,
    updated_at: new Date()
  });
};

StoreDataMigration.prototype.updateProgress = async function(progress, completedTable = null) {
  const updates = {
    migration_progress: Math.min(progress, 100),
    last_sync_at: new Date(),
    updated_at: new Date()
  };
  
  if (completedTable && !this.migrated_tables.includes(completedTable)) {
    updates.migrated_tables = [...this.migrated_tables, completedTable];
  }
  
  return this.update(updates);
};

StoreDataMigration.prototype.addError = async function(errorMessage, context = {}) {
  const errors = [...(this.error_log || [])];
  errors.push({
    timestamp: new Date().toISOString(),
    error: errorMessage,
    context: context
  });
  
  return this.update({
    error_log: errors,
    updated_at: new Date()
  });
};

StoreDataMigration.prototype.resetMigration = async function() {
  return this.update({
    migration_status: 'pending',
    migration_progress: 0.00,
    migrated_tables: [],
    error_log: [],
    last_sync_at: null,
    updated_at: new Date()
  });
};

// Static methods
StoreDataMigration.findByStore = function(storeId) {
  return this.findAll({
    where: { store_id: storeId },
    order: [['created_at', 'DESC']]
  });
};

StoreDataMigration.findByStoreAndType = function(storeId, migrationType) {
  return this.findOne({
    where: { 
      store_id: storeId,
      migration_type: migrationType
    }
  });
};

StoreDataMigration.findActiveByStore = function(storeId) {
  return this.findAll({
    where: { 
      store_id: storeId,
      migration_status: ['in_progress', 'pending']
    },
    order: [['created_at', 'ASC']]
  });
};

StoreDataMigration.createOrUpdate = async function(storeId, migrationData) {
  const { migration_type, target_system, supabase_project_url, supabase_anon_key, supabase_service_key, migration_config = {} } = migrationData;
  
  const existing = await this.findOne({
    where: {
      store_id: storeId,
      migration_type: migration_type,
      target_system: target_system
    }
  });

  const dataToUpdate = {
    supabase_project_url,
    supabase_anon_key,
    supabase_service_key,
    migration_config,
    updated_at: new Date()
  };

  if (existing) {
    return existing.update(dataToUpdate);
  } else {
    return this.create({
      store_id: storeId,
      migration_type,
      target_system,
      ...dataToUpdate
    });
  }
};

StoreDataMigration.getMigrationStats = async function(storeId) {
  const migrations = await this.findAll({
    where: { store_id: storeId },
    attributes: ['migration_type', 'migration_status', 'migration_progress', 'last_sync_at', 'created_at']
  });

  const stats = {
    total: migrations.length,
    pending: migrations.filter(m => m.migration_status === 'pending').length,
    inProgress: migrations.filter(m => m.migration_status === 'in_progress').length,
    completed: migrations.filter(m => m.migration_status === 'completed').length,
    failed: migrations.filter(m => m.migration_status === 'failed').length,
    paused: migrations.filter(m => m.migration_status === 'paused').length,
    averageProgress: migrations.length > 0 
      ? migrations.reduce((sum, m) => sum + parseFloat(m.migration_progress), 0) / migrations.length 
      : 0,
    migrations: migrations.map(m => ({
      type: m.migration_type,
      status: m.migration_status,
      progress: m.migration_progress,
      lastSync: m.last_sync_at,
      createdAt: m.created_at
    }))
  };

  return stats;
};

// Get available migration types
StoreDataMigration.getMigrationTypes = function() {
  return [
    {
      type: 'catalog',
      name: 'Product Catalog',
      description: 'Migrate products, categories, attributes, and inventory',
      tables: ['products', 'categories', 'attributes', 'product_attributes', 'inventory']
    },
    {
      type: 'sales',
      name: 'Sales Data',
      description: 'Migrate orders, customers, and transaction history',
      tables: ['orders', 'customers', 'order_items', 'payments', 'shipping']
    },
    {
      type: 'content',
      name: 'Content & Media',
      description: 'Migrate CMS pages, blogs, and media assets',
      tables: ['cms_pages', 'blog_posts', 'media_assets', 'cms_blocks']
    },
    {
      type: 'analytics',
      name: 'Analytics Data',
      description: 'Migrate visitor tracking and analytics data',
      tables: ['customer_activities', 'page_views', 'conversion_events']
    }
  ];
};

// Hook to update timestamp on save
StoreDataMigration.beforeUpdate((migration) => {
  migration.updated_at = new Date();
});

module.exports = StoreDataMigration;