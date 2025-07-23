const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CustomerActivity = sequelize.define('CustomerActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  activity_type: {
    type: DataTypes.ENUM('page_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'checkout_started', 'order_completed', 'search'),
    allowNull: false
  },
  page_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  search_query: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'customer_activities',
  indexes: [
    {
      fields: ['session_id']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = CustomerActivity;