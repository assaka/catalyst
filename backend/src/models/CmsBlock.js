const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CmsBlock = sequelize.define('CmsBlock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  identifier: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  placement: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: ['content']  // Default placement locations as array
  },
  // SEO fields
  meta_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Foreign key
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  // Multilingual translations
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Multilingual translations: {"en": {"title": "...", "content": "..."}, "es": {...}}'
  }
}, {
  tableName: 'cms_blocks',
  indexes: [
    {
      unique: true,
      fields: ['identifier', 'store_id']  // Unique identifier per store
    }
  ],
  hooks: {
    beforeCreate: (block) => {
      if (!block.identifier && block.translations && block.translations.en && block.translations.en.title) {
        block.identifier = block.translations.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    },
    beforeUpdate: (block) => {
      if (block.changed('translations') && !block.changed('identifier')) {
        if (block.translations && block.translations.en && block.translations.en.title) {
          block.identifier = block.translations.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
      }
    }
  }
});

module.exports = CmsBlock;