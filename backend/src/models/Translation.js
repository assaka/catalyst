const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Translation = sequelize.define('Translation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Translation key (e.g. common.button.add_to_cart)'
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Language code (en, es, zh, ar, etc.)'
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Translated text value'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'common',
    comment: 'Category: common, storefront, admin, errors'
  }
}, {
  tableName: 'translations',
  indexes: [
    {
      unique: true,
      fields: ['key', 'language_code'],
      name: 'translations_key_language_unique'
    },
    {
      fields: ['category'],
      name: 'translations_category_index'
    },
    {
      fields: ['language_code'],
      name: 'translations_language_code_index'
    }
  ]
});

module.exports = Translation;
