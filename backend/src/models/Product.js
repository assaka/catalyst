const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
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
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.TEXT,
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
  attributes: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  seo: {
    type: DataTypes.JSON,
    defaultValue: {}
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
  }
}, {
  tableName: 'products',
  hooks: {
    beforeCreate: (product) => {
      if (!product.slug && product.name) {
        product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    },
    beforeUpdate: (product) => {
      if (product.changed('name') && !product.changed('slug')) {
        product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }
  }
});

module.exports = Product;