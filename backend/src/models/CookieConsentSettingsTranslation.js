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
