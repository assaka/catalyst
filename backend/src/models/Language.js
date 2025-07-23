const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Language = sequelize.define('Language', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  native_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_rtl: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  translations: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'languages'
});

module.exports = Language;