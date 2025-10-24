const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const PaymentMethod = sequelize.define('PaymentMethod', {
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
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery', 'other'),
    allowNull: false,
    defaultValue: 'credit_card'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Configuration settings stored as JSON
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  // Fees and limits
  fee_type: {
    type: DataTypes.ENUM('fixed', 'percentage', 'none'),
    defaultValue: 'none'
  },
  fee_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  min_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  max_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  // Availability
  availability: {
    type: DataTypes.ENUM('all', 'specific_countries'),
    defaultValue: 'all'
  },
  countries: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  // Foreign key
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  }
  // Translations now stored in normalized payment_method_translations table
  // Removed translations JSON column - using normalized table for better search performance
}, {
  tableName: 'payment_methods',
  hooks: {
    beforeCreate: (method) => {
      if (!method.code && method.name) {
        method.code = method.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      }
    },
    beforeUpdate: (method) => {
      if (method.changed('name') && !method.changed('code')) {
        method.code = method.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      }
    }
  }
});

module.exports = PaymentMethod;