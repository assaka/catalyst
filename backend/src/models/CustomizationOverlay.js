const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * CustomizationOverlay Model
 * Represents a code customization with version control and AST diff tracking
 */
const CustomizationOverlay = sequelize.define('CustomizationOverlay', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: true, // Some customizations might be user-level, not store-specific
    references: {
      model: 'stores',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  file_path: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  component_type: {
    type: DataTypes.ENUM('component', 'page', 'service', 'util', 'config'),
    defaultValue: 'component'
  },
  baseline_code: {
    type: DataTypes.TEXT('long'), // Original code before any changes
    allowNull: false
  },
  current_code: {
    type: DataTypes.TEXT('long'), // Current modified code
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'archived', 'published'),
    defaultValue: 'draft'
  },
  change_type: {
    type: DataTypes.ENUM('manual_edit', 'ai_generated', 'merge', 'rollback'),
    defaultValue: 'manual_edit'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'customization_overlays',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['file_path']
    },
    {
      fields: ['status']
    },
    {
      fields: ['user_id', 'file_path'],
      unique: false // Allow multiple customizations per user/file for different versions
    }
  ]
});

// Instance methods
CustomizationOverlay.prototype.publish = async function() {
  this.status = 'published';
  this.published_at = new Date();
  return await this.save();
};

CustomizationOverlay.prototype.archive = async function() {
  this.status = 'archived';
  return await this.save();
};

CustomizationOverlay.prototype.activate = async function() {
  this.status = 'active';
  return await this.save();
};

// Static methods
CustomizationOverlay.findByUser = async function(userId, storeId = null) {
  const where = { user_id: userId };
  if (storeId) {
    where.store_id = storeId;
  }
  
  return await this.findAll({
    where,
    order: [['updated_at', 'DESC']],
    include: [
      {
        association: 'snapshots',
        limit: 5,
        order: [['created_at', 'DESC']]
      }
    ]
  });
};

CustomizationOverlay.findByFilePath = async function(filePath, userId = null) {
  const where = { file_path: filePath };
  if (userId) {
    where.user_id = userId;
  }
  
  return await this.findAll({
    where,
    order: [['updated_at', 'DESC']]
  });
};

CustomizationOverlay.getActiveCustomizations = async function(userId, storeId = null) {
  const where = { 
    user_id: userId,
    status: 'active'
  };
  if (storeId) {
    where.store_id = storeId;
  }
  
  return await this.findAll({
    where,
    order: [['updated_at', 'DESC']]
  });
};

module.exports = CustomizationOverlay;