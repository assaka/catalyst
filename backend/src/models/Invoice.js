const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sales_orders',
      key: 'id'
    }
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  customer_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  pdf_generated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pdf_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email_status: {
    type: DataTypes.ENUM('sent', 'failed', 'bounced', 'delivered'),
    defaultValue: 'sent'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'sales_invoices',
  hooks: {
    beforeCreate: (invoice) => {
      if (!invoice.invoice_number) {
        invoice.invoice_number = 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      }
    }
  }
});

module.exports = Invoice;
