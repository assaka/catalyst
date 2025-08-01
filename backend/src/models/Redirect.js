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
    type: DataTypes.ENUM('301', '302'),
    allowNull: false,
    defaultValue: '301'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'redirects',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'from_url']
    }
  ]
});

module.exports = Redirect;