const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SlotConfiguration = sequelize.define('SlotConfiguration', {
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
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  configuration: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Complete slot configuration JSON including slots, components, and metadata'
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Configuration schema version'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this configuration is currently active'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'slot_configurations',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'store_id'],
      unique: true,
      name: 'unique_user_store_config'
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
SlotConfiguration.prototype.getSlotConfig = function(slotId) {
  return this.configuration?.slots?.[slotId] || null;
};

SlotConfiguration.prototype.updateSlotConfig = function(slotId, config) {
  if (!this.configuration.slots) {
    this.configuration.slots = {};
  }
  this.configuration.slots[slotId] = config;
  this.changed('configuration', true); // Mark as changed for Sequelize
};

SlotConfiguration.prototype.removeSlot = function(slotId) {
  if (this.configuration?.slots?.[slotId]) {
    delete this.configuration.slots[slotId];
    this.changed('configuration', true);
  }
};

// Class methods
SlotConfiguration.findActiveByUserStore = async function(userId, storeId) {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      is_active: true
    }
  });
};

SlotConfiguration.findByMigrationSource = async function(source, limit = 100) {
  return this.findAll({
    where: {
      migration_source: source
    },
    limit,
    order: [['created_at', 'DESC']]
  });
};

module.exports = SlotConfiguration;