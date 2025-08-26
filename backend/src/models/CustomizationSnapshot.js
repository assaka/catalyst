const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * CustomizationSnapshot Model
 * Represents a version snapshot of a customization with AST diff data
 */
const CustomizationSnapshot = sequelize.define('CustomizationSnapshot', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  customization_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'hybrid_customizations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  version_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  change_summary: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  change_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  change_type: {
    type: DataTypes.ENUM('initial', 'modification', 'merge', 'rollback', 'auto_save'),
    defaultValue: 'modification'
  },
  ast_diff: {
    type: DataTypes.JSON, // Stores the AST difference data
    allowNull: true
  },
  line_diff: {
    type: DataTypes.JSON, // Stores line-by-line diff data for UI display
    allowNull: true
  },
  unified_diff: {
    type: DataTypes.TEXT, // Git-style unified diff format
    allowNull: true
  },
  diff_stats: {
    type: DataTypes.JSON, // Statistics about the diff (lines added/removed, etc.)
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('open', 'finalized', 'archived'),
    defaultValue: 'open'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  finalized_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
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
  tableName: 'customization_snapshots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['customization_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['status']
    },
    {
      fields: ['change_type']
    },
    {
      fields: ['customization_id', 'version_number'],
      unique: true // Ensure version numbers are unique per customization
    }
  ]
});

// Instance methods
CustomizationSnapshot.prototype.finalize = async function() {
  this.status = 'finalized';
  this.finalized_at = new Date();
  return await this.save();
};

CustomizationSnapshot.prototype.archive = async function() {
  this.status = 'archived';
  return await this.save();
};

// Static methods
CustomizationSnapshot.findByCustomization = async function(customizationId, limit = null) {
  const options = {
    where: { customization_id: customizationId },
    order: [['version_number', 'DESC']],
    include: [
      {
        association: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ]
  };
  
  if (limit) {
    options.limit = limit;
  }
  
  return await this.findAll(options);
};

CustomizationSnapshot.getLatestVersion = async function(customizationId) {
  return await this.findOne({
    where: { customization_id: customizationId },
    order: [['version_number', 'DESC']]
  });
};

CustomizationSnapshot.getOpenSnapshots = async function(customizationId) {
  return await this.findAll({
    where: { 
      customization_id: customizationId,
      status: 'open'
    },
    order: [['created_at', 'DESC']]
  });
};

CustomizationSnapshot.getSnapshotsByUser = async function(userId, limit = 50) {
  return await this.findAll({
    where: { created_by: userId },
    order: [['created_at', 'DESC']],
    limit,
    include: [
      {
        association: 'customization',
        attributes: ['id', 'name', 'file_path', 'component_type']
      }
    ]
  });
};

// Calculate next version number for a customization
CustomizationSnapshot.getNextVersionNumber = async function(customizationId) {
  const latest = await this.getLatestVersion(customizationId);
  return latest ? latest.version_number + 1 : 1;
};

module.exports = CustomizationSnapshot;