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
  auto_canonical_filtered_pages: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Complex settings as JSON
  hreflang_settings: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Consolidated social media and rich snippets settings
  social_media_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      open_graph: {
        enabled: true,
        default_title: '',
        default_description: '',
        default_image_url: '',
        facebook_app_id: '',
        facebook_page_url: ''
      },
      twitter: {
        enabled: true,
        card_type: 'summary_large_image',
        site_username: '',
        creator_username: ''
      },
      social_profiles: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        pinterest: '',
        tiktok: '',
        other: []
      },
      schema: {
        enable_product_schema: true,
        enable_organization_schema: true,
        enable_breadcrumb_schema: true,
        organization_name: '',
        organization_logo_url: '',
        organization_description: '',
        contact_type: 'customer service',
        contact_telephone: '',
        contact_email: '',
        price_range: '',
        founded_year: '',
        founder_name: ''
      }
    }
  },
  // XML Sitemap settings
  xml_sitemap_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      include_products: true,
      include_categories: true,
      include_pages: true,
      include_images: false,
      include_videos: false,
      enable_news: false,
      enable_index: false,
      max_urls: 50000,
      google_search_console_api_key: '',
      auto_submit: false
    }
  },
  // HTML Sitemap settings
  html_sitemap_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      include_products: true,
      include_categories: true,
      include_pages: true,
      max_products: 20,
      product_sort: '-updated_date'
    }
  }
}, {
  tableName: 'seo_settings'
});

module.exports = SeoSettings;