const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  // Product information (snapshot at time of order)
  product_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  product_sku: {
    type: DataTypes.STRING,
    allowNull: false
  },
  product_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  product_attributes: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  // Foreign keys
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  }
}, {
  tableName: 'order_items'
});

module.exports = OrderItem;