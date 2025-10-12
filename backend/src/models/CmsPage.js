const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CmsPage = sequelize.define('CmsPage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  meta_robots_tag: {
    type: DataTypes.STRING,
    defaultValue: 'index, follow'
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
  // Relationships (stored as JSON arrays)
  related_product_ids: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Publishing
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Multilingual translations
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Multilingual translations: {"en": {"title": "...", "content": "..."}, "es": {...}}'
  }
}, {
  tableName: 'cms_pages',
  hooks: {
    beforeCreate: (page) => {
      if (!page.slug && page.translations && page.translations.en && page.translations.en.title) {
        page.slug = page.translations.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    },
    beforeUpdate: (page) => {
      if (page.changed('translations') && !page.changed('slug')) {
        if (page.translations && page.translations.en && page.translations.en.title) {
          page.slug = page.translations.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
      }
    }
  }
});

module.exports = CmsPage;