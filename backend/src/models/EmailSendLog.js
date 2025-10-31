const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const EmailSendLog = sequelize.define('EmailSendLog', {
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
  email_template_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'email_templates',
      key: 'id'
    }
  },
  recipient_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked']]
    }
  },
  brevo_message_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Brevo API message ID for tracking delivery status'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional data like order_id, customer_id, transaction_id'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'email_send_logs',
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['email_template_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['recipient_email']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['brevo_message_id']
    }
  ]
});

module.exports = EmailSendLog;
