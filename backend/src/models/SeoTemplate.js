const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SeoTemplate = sequelize.define('SeoTemplate', {
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
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('product', 'category', 'cms_page', 'homepage', 'brand', 'blog_post'),
    allowNull: false,
    comment: 'Page type: product, category, cms_page, homepage, brand, blog_post'
  },
  // Template fields - ALL template fields in single JSON column
  template: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Template fields: meta_title, meta_description, og_title, twitter_title, etc.'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conditions: {
    type: DataTypes.JSON,
    defaultValue: {
      categories: [],
      attribute_sets: []
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'seo_templates',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'name']
    }
  ]
});

module.exports = SeoTemplate;