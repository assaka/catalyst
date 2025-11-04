const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const BlacklistSettings = sequelize.define('BlacklistSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  block_by_ip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  block_by_email: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  block_by_country: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'blacklist_settings',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = BlacklistSettings;
