const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AttributeValue = sequelize.define('AttributeValue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  attribute_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'attributes',
      key: 'id'
    }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'URL-friendly code: samsung, black, etc.'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Extra data like hex colors, images, etc.'
  },
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Value translations: {"en": {"label": "Black"}, "nl": {"label": "Zwart"}}'
  }
}, {
  tableName: 'attribute_values',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['attribute_id', 'code']
    },
    {
      fields: ['attribute_id']
    }
  ]
});

module.exports = AttributeValue;
