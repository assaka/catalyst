const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { sanitizeNumericFields } = require('../utils/dataValidation');

const Product = sequelize.define('Product', {
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
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'External system ID (e.g., Shopify product ID, Akeneo product ID)'
  },
  external_source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Source of external_id (e.g., shopify, akeneo, woocommerce)'
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  compare_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  type: {
    type: DataTypes.ENUM('simple', 'configurable', 'bundle', 'grouped', 'virtual', 'downloadable'),
    defaultValue: 'simple',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'inactive'),
    defaultValue: 'draft'
  },
  visibility: {
    type: DataTypes.ENUM('visible', 'hidden'),
    defaultValue: 'visible'
  },
  manage_stock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  allow_backorders: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  low_stock_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  infinite_stock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_custom_option: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_coupon_eligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
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
  attribute_set_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'attribute_sets',
      key: 'id'
    }
  },
  // Configurable product fields
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  configurable_attributes: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of attribute IDs used for configuration (only for configurable products)'
  },
  // Relationships stored as JSON arrays
  category_ids: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  related_product_ids: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Sorting and organization
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Metrics
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  purchase_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Translations now stored in normalized product_translations table
  // Removed translations JSON column - using normalized table for better search performance
}, {
  tableName: 'products',
  hooks: {
    beforeCreate: (product) => {
      // Slug must be provided when creating products (no longer auto-generated from translations)
      // Apply data validation using utility function
      const sanitizedData = sanitizeNumericFields(product, ['price', 'compare_price', 'cost_price', 'weight']);
      Object.assign(product, sanitizedData);
    },
    beforeUpdate: (product) => {
      // Apply data validation using utility function
      const sanitizedData = sanitizeNumericFields(product, ['price', 'compare_price', 'cost_price', 'weight']);
      Object.assign(product, sanitizedData);
    }
  }
});

module.exports = Product;