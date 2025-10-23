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
  // Default meta settings (consolidated)
  default_meta_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      meta_robots: 'index, follow'
    }
  },
  // Canonical URL settings (consolidated)
  canonical_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      base_url: '',
      auto_canonical_filtered_pages: true
    }
  },
  // Robots and sitemap
  robots_txt_content: {
    type: DataTypes.TEXT,
    allowNull: true
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