const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CookieConsentSettingsTranslation = sequelize.define('CookieConsentSettingsTranslation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cookie_consent_settings_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cookie_consent_settings',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  banner_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  accept_button_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reject_button_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  settings_button_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  privacy_policy_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  save_preferences_button_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  necessary_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  necessary_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  analytics_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  analytics_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  marketing_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marketing_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  functional_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  functional_description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'cookie_consent_settings_translations',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['cookie_consent_settings_id', 'language_code']
    },
    {
      fields: ['cookie_consent_settings_id']
    },
    {
      fields: ['language_code']
    }
  ]
});

module.exports = CookieConsentSettingsTranslation;
