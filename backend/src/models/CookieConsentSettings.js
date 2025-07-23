const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CookieConsentSettings = sequelize.define('CookieConsentSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  banner_position: {
    type: DataTypes.ENUM('top', 'bottom', 'center'),
    defaultValue: 'bottom'
  },
  banner_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  privacy_policy_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accept_button_text: {
    type: DataTypes.STRING,
    defaultValue: 'Accept All'
  },
  reject_button_text: {
    type: DataTypes.STRING,
    defaultValue: 'Reject All'
  },
  settings_button_text: {
    type: DataTypes.STRING,
    defaultValue: 'Cookie Settings'
  },
  // Cookie categories
  necessary_cookies: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  analytics_cookies: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  marketing_cookies: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  functional_cookies: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Appearance
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'custom'),
    defaultValue: 'light'
  },
  primary_color: {
    type: DataTypes.STRING,
    defaultValue: '#007bff'
  },
  background_color: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  text_color: {
    type: DataTypes.STRING,
    defaultValue: '#333333'
  },
  // Foreign key
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  }
}, {
  tableName: 'cookie_consent_settings'
});

module.exports = CookieConsentSettings;