const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ShippingMethod = sequelize.define('ShippingMethod', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  type: {
    type: DataTypes.ENUM('flat_rate', 'free_shipping', 'weight_based', 'price_based'),
    allowNull: false,
    defaultValue: 'flat_rate'
  },
  // Flat rate settings
  flat_rate_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  // Free shipping settings
  free_shipping_min_order: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  // Weight-based settings
  weight_ranges: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Price-based settings
  price_ranges: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Availability
  availability: {
    type: DataTypes.ENUM('all', 'specific_countries'),
    defaultValue: 'all'
  },
  countries: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Delivery time
  min_delivery_days: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  max_delivery_days: {
    type: DataTypes.INTEGER,
    defaultValue: 7
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
  // Sorting
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Multilingual translations
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Multilingual translations: {"en": {"name": "...", "description": "..."}, "nl": {...}}'
  }
}, {
  tableName: 'shipping_methods'
});

module.exports = ShippingMethod;