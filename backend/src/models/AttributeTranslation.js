const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AttributeTranslation = sequelize.define('AttributeTranslation', {
  attribute_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'attributes',
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
  label: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'attribute_translations',
  underscored: true
});

module.exports = AttributeTranslation;
