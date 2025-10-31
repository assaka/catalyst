const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const EmailTemplate = sequelize.define('EmailTemplate', {
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
  identifier: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Unique identifier (signup_email, credit_purchase_email, order_success_email)'
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'template',
    validate: {
      isIn: [['template', 'html', 'both']]
    }
  },
  template_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Content with variables like {{customer_name}}'
  },
  html_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full HTML content for advanced users'
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Available variables for this template type'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attachment_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attachment_config: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Attachment settings (e.g., invoice PDF generation)'
  }
}, {
  tableName: 'email_templates',
  indexes: [
    {
      unique: true,
      fields: ['identifier', 'store_id']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = EmailTemplate;
