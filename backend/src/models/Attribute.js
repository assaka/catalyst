const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Attribute = sequelize.define('Attribute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('text', 'number', 'select', 'multiselect', 'boolean', 'date', 'file', 'image'),
    allowNull: false,
    defaultValue: 'text'
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_filterable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_searchable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_usable_in_conditions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_configurable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this attribute can be used for product configuration (e.g., size, color)'
  },
  filter_type: {
    type: DataTypes.ENUM('multiselect', 'slider', 'select'),
    allowNull: true
  },
  file_settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Foreign keys
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  }
}, {
  tableName: 'attributes'
});

module.exports = Attribute;