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
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System pages cannot be deleted from admin panel. Used for critical pages like 404, maintenance, etc.'
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
  }
  // Translations now stored in normalized cms_page_translations table
  // Removed translations JSON column - using normalized table for better search performance
}, {
  tableName: 'cms_pages'
  // Removed hooks that referenced page.translations
  // Slug must be provided when creating pages
});

module.exports = CmsPage;