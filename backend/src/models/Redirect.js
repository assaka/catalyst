const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Redirect = sequelize.define('Redirect', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  from_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  to_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('301', '302', '307', '308'),
    allowNull: false,
    defaultValue: '301'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  entity_type: {
    type: DataTypes.ENUM('category', 'product', 'cms_page'),
    allowNull: true,
    comment: 'Type of entity that created this redirect'
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the entity that created this redirect'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional notes about why this redirect was created'
  },
  hit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Number of times this redirect has been used'
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this redirect was last used'
  }
}, {
  tableName: 'redirects',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'from_url']
    },
    {
      fields: ['entity_type', 'entity_id']
    }
  ]
});

// Define associations
Redirect.associate = (models) => {
  Redirect.belongsTo(models.Store, {
    foreignKey: 'store_id',
    as: 'store'
  });
  
  Redirect.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = Redirect;