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
  // Geographic data
  country: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  country_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Device and browser data
  device_type: {
    type: DataTypes.ENUM('desktop', 'tablet', 'mobile'),
    allowNull: true
  },
  browser_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  operating_system: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  // UTM tracking
  utm_source: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  utm_medium: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  utm_campaign: {
    type: DataTypes.STRING(255),
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
    },
    {
      fields: ['country']
    },
    {
      fields: ['city']
    },
    {
      fields: ['language']
    },
    {
      fields: ['device_type']
    },
    {
      fields: ['utm_source']
    }
  ]
});

module.exports = CustomerActivity;