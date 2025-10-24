const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ProductTranslation = sequelize.define('ProductTranslation', {
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'products',
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'product_translations',
  underscored: true,
  indexes: [
    {
      type: 'FULLTEXT',
      name: 'product_translations_name_search_idx',
      fields: ['name']
    }
  ]
});

module.exports = ProductTranslation;
