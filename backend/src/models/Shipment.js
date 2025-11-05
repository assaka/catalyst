const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  shipment_number: {
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
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tracking_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  carrier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipping_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estimated_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_delivery_date: {
    type: DataTypes.DATE,
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
  tableName: 'sales_shipments',
  hooks: {
    beforeCreate: (shipment) => {
      if (!shipment.shipment_number) {
        shipment.shipment_number = 'SHIP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      }
    }
  }
});

module.exports = Shipment;
