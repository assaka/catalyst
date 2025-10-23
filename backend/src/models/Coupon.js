const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discount_type: {
    type: DataTypes.ENUM('fixed', 'percentage', 'buy_x_get_y', 'free_shipping'),
    allowNull: false,
    defaultValue: 'fixed'
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  min_purchase_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // For buy_x_get_y coupons
  buy_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  get_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
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
  // Applicability (stored as JSON arrays)
  applicable_products: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  applicable_categories: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  applicable_skus: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  applicable_attribute_sets: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  applicable_attributes: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Multilingual translations
  translations: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Multilingual translations: {"en": {"name": "...", "description": "..."}, "nl": {...}}'
  }
}, {
  tableName: 'coupons'
});

module.exports = Coupon;