const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const PdfTemplateTranslation = sequelize.define('PdfTemplateTranslation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  pdf_template_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'pdf_templates',
      key: 'id'
    }
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Language code (en, es, fr, etc.)'
  },
  html_template: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Translated HTML template content'
  }
}, {
  tableName: 'pdf_template_translations',
  indexes: [
    {
      unique: true,
      fields: ['pdf_template_id', 'language_code']
    },
    {
      fields: ['pdf_template_id']
    },
    {
      fields: ['language_code']
    }
  ]
});

module.exports = PdfTemplateTranslation;
