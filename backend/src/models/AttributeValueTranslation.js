const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AttributeValueTranslation = sequelize.define('AttributeValueTranslation', {
  attribute_value_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'attribute_values',
      key: 'id'
    }
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'languages',
      key: 'code'
    }
  },
  value: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'attribute_value_translations',
  underscored: true
});

module.exports = AttributeValueTranslation;
