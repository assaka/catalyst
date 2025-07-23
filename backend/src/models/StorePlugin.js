const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const StorePlugin = sequelize.define('StorePlugin', {
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
  plugin_slug: {
    type: DataTypes.STRING,
    allowNull: false
  },
  plugin_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  version: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'store_plugins',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'plugin_slug']
    }
  ]
});

module.exports = StorePlugin;