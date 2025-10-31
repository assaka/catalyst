const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const EmailTemplateTranslation = sequelize.define('EmailTemplateTranslation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email_template_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'email_templates',
      key: 'id'
    }
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Language code (en, es, fr, etc.)'
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  template_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Translated template content with variables'
  },
  html_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Translated HTML content'
  }
}, {
  tableName: 'email_template_translations',
  indexes: [
    {
      unique: true,
      fields: ['email_template_id', 'language_code']
    },
    {
      fields: ['email_template_id']
    },
    {
      fields: ['language_code']
    }
  ]
});

module.exports = EmailTemplateTranslation;
