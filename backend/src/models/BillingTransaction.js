const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const BillingTransaction = sequelize.define('BillingTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subscriptions',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'completed', 'failed', 'refunded', 'disputed']]
    }
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_provider: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_provider_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  payment_provider_response: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  invoice_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  invoice_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  invoice_pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  line_items: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'billing_transactions',
  indexes: [
    { fields: ['store_id'] },
    { fields: ['subscription_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

// Instance methods
BillingTransaction.prototype.markCompleted = async function() {
  this.status = 'completed';
  this.processed_at = new Date();
  await this.save();
};

BillingTransaction.prototype.markFailed = async function(reason) {
  this.status = 'failed';
  this.metadata = { ...this.metadata, failure_reason: reason };
  await this.save();
};

BillingTransaction.prototype.refund = async function(reason) {
  this.status = 'refunded';
  this.refunded_at = new Date();
  this.refund_reason = reason;
  await this.save();
};

// Static methods
BillingTransaction.generateInvoiceNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
};

module.exports = BillingTransaction;
