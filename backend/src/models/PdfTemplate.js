const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const PdfTemplate = sequelize.define('PdfTemplate', {
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
    comment: 'Unique identifier (invoice_pdf, shipment_pdf, etc.)'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  template_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['invoice', 'shipment', 'packing_slip', 'receipt']]
    }
  },
  default_html_template: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Original default template for restore functionality'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System templates cannot be deleted'
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Available variables for this template type'
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      page_size: 'A4',
      orientation: 'portrait',
      margins: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    },
    comment: 'PDF generation settings'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'pdf_templates',
  indexes: [
    {
      unique: true,
      fields: ['identifier', 'store_id']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['template_type']
    }
  ]
});

module.exports = PdfTemplate;
