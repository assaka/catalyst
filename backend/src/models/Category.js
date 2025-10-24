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
  // SEO fields - ALL SEO data in single JSON column
  seo: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'All SEO fields: meta_title, meta_description, og_title, twitter_title, canonical_url, etc.'
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
  }
  // Translations now stored in normalized category_translations table
  // Removed translations JSON column - using normalized table for better search performance
}, {
  tableName: 'categories'
  // Removed hooks that referenced category.translations
  // Slug must be provided when creating categories (no longer auto-generated from translations)
});

module.exports = Category;