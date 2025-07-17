const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AttributeSet = sequelize.define('AttributeSet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Foreign keys
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  // Relationships stored as JSON arrays
  attribute_ids: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'attribute_sets'
});

module.exports = AttributeSet;