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
  // GDPR and compliance settings
  gdpr_mode: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  auto_detect_country: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  audit_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  consent_expiry_days: {
    type: DataTypes.INTEGER,
    defaultValue: 365
  },
  show_close_button: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  privacy_policy_text: {
    type: DataTypes.STRING,
    defaultValue: 'Privacy Policy'
  },
  // Button colors
  accept_button_bg_color: {
    type: DataTypes.STRING,
    defaultValue: '#2563eb'
  },
  accept_button_text_color: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  reject_button_bg_color: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  reject_button_text_color: {
    type: DataTypes.STRING,
    defaultValue: '#374151'
  },
  save_preferences_button_bg_color: {
    type: DataTypes.STRING,
    defaultValue: '#16a34a'
  },
  save_preferences_button_text_color: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  // JSON fields for complex data
  categories: {
    type: DataTypes.JSON,
    allowNull: true
  },
  gdpr_countries: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // Integration settings
  google_analytics_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  google_tag_manager_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  custom_css: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Foreign key
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  // Multilingual translations
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Multilingual translations: {"en": {"banner_text": "...", "accept_button_text": "...", "reject_button_text": "...", "settings_button_text": "..."}, "nl": {...}}'
  }
}, {
  tableName: 'cookie_consent_settings'
});

module.exports = CookieConsentSettings;