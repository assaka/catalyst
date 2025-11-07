const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Translation = sequelize.define('Translation', {
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
    },
    comment: 'Store that owns this translation'
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
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'system',
    comment: 'Type: system (built-in) or custom (user-created)'
  }
}, {
  tableName: 'translations',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'key', 'language_code'],
      name: 'translations_store_key_language_unique'
    },
    {
      fields: ['store_id'],
      name: 'translations_store_id_index'
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
