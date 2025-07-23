const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SeoSettings = sequelize.define('SeoSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  enable_rich_snippets: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  enable_open_graph: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  enable_twitter_cards: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  default_image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  facebook_app_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitter_site_username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  google_site_verification: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bing_site_verification: {
    type: DataTypes.STRING,
    allowNull: true
  },
  robots_txt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sitemap_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      include_products: true,
      include_categories: true,
      include_cms_pages: true,
      change_frequency: 'weekly',
      priority: 0.5
    }
  },
  schema_settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'seo_settings'
});

module.exports = SeoSettings;