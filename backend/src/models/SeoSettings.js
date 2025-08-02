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
  // Basic meta settings
  default_meta_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  default_meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  default_meta_keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  default_meta_robots: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'index, follow'
  },
  canonical_base_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Rich snippets and social
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
  // Robots and sitemap
  robots_txt_content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  enable_sitemap: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sitemap_include_products: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sitemap_include_categories: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sitemap_include_pages: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  auto_canonical_filtered_pages: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Complex settings as JSON
  hreflang_settings: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  schema_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      enable_product_schema: true,
      enable_organization_schema: true,
      organization_name: '',
      organization_logo_url: '',
      social_profiles: []
    }
  },
  open_graph_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      default_image_url: '',
      facebook_app_id: ''
    }
  },
  twitter_card_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      card_type: 'summary_large_image',
      site_username: ''
    }
  }
}, {
  tableName: 'seo_settings'
});

module.exports = SeoSettings;