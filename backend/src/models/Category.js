const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Category = sequelize.define('Category', {
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
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  hide_in_menu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  // Hierarchy fields
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Counts
  product_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Multilingual translations
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Multilingual translations: {"en": {"name": "...", "description": "..."}, "es": {...}}'
  }
}, {
  tableName: 'categories',
  hooks: {
    beforeCreate: (category) => {
      // Only generate slug on creation if not provided
      if (!category.slug && category.translations && category.translations.en && category.translations.en.name) {
        category.slug = category.translations.en.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }
    // URL key (slug) is preserved when updating translations
    // It can only be changed by explicitly updating the slug field
  }
});

module.exports = Category;