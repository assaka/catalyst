/**
 * Model Associations for Normalized Translations & SEO
 *
 * This file defines all associations between entity models and their
 * translation/SEO tables.
 *
 * ASSOCIATION PATTERN:
 * - Each entity hasMany translations (one per language)
 * - Each entity hasMany SEO records (one per language)
 * - Enables querying: Product.findAll({ include: [ProductTranslation, ProductSeo] })
 * - Backend constructs same JSON format via JOIN + json_object_agg()
 */

const Product = require('./Product');
const Category = require('./Category');
const CmsPage = require('./CmsPage');
const Attribute = require('./Attribute');
const AttributeValue = require('./AttributeValue');
const CmsBlock = require('./CmsBlock');
const ProductTab = require('./ProductTab');
const ProductLabel = require('./ProductLabel');
const Coupon = require('./Coupon');
const ShippingMethod = require('./ShippingMethod');
const PaymentMethod = require('./PaymentMethod');
const CookieConsentSettings = require('./CookieConsentSettings');
const EmailTemplate = require('./EmailTemplate');
const Store = require('./Store');

// Import translation models
const EmailTemplateTranslation = require('./EmailTemplateTranslation');
const ProductTranslation = require('./ProductTranslation');
const CategoryTranslation = require('./CategoryTranslation');
const CookieConsentSettingsTranslation = require('./CookieConsentSettingsTranslation');
const AttributeTranslation = require('./AttributeTranslation');
const AttributeValueTranslation = require('./AttributeValueTranslation');
// Note: Other translation models will be created similarly

// Import SEO models
const ProductSeo = require('./ProductSeo');
// Note: Other SEO models will be created similarly

// Import email system models
const BrevoConfiguration = require('./BrevoConfiguration');
const EmailSendLog = require('./EmailSendLog');

/**
 * Setup all associations
 * Call this after all models are loaded
 */
function setupAssociations() {
  // ========================================
  // PRODUCT ASSOCIATIONS
  // ========================================

  Product.hasMany(ProductTranslation, {
    foreignKey: 'product_id',
    as: 'translationsData', // Renamed to avoid conflict with JSON column
    onDelete: 'CASCADE'
  });

  ProductTranslation.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  });

  Product.hasMany(ProductSeo, {
    foreignKey: 'product_id',
    as: 'seoData', // Renamed to avoid conflict with JSON column
    onDelete: 'CASCADE'
  });

  ProductSeo.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  });

  // ========================================
  // CATEGORY ASSOCIATIONS
  // ========================================

  Category.hasMany(CategoryTranslation, {
    foreignKey: 'category_id',
    as: 'translationsData',
    onDelete: 'CASCADE'
  });

  CategoryTranslation.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
  });

  // ========================================
  // COOKIE CONSENT SETTINGS ASSOCIATIONS
  // ========================================

  CookieConsentSettings.hasMany(CookieConsentSettingsTranslation, {
    foreignKey: 'cookie_consent_settings_id',
    as: 'translationsData',
    onDelete: 'CASCADE'
  });

  CookieConsentSettingsTranslation.belongsTo(CookieConsentSettings, {
    foreignKey: 'cookie_consent_settings_id',
    as: 'cookieConsentSettings'
  });

  // ========================================
  // ATTRIBUTE ASSOCIATIONS
  // ========================================

  Attribute.hasMany(AttributeTranslation, {
    foreignKey: 'attribute_id',
    as: 'translationsData',
    onDelete: 'CASCADE'
  });

  AttributeTranslation.belongsTo(Attribute, {
    foreignKey: 'attribute_id',
    as: 'attribute'
  });

  // ========================================
  // ATTRIBUTE VALUE ASSOCIATIONS
  // ========================================

  AttributeValue.hasMany(AttributeValueTranslation, {
    foreignKey: 'attribute_value_id',
    as: 'translationsData',
    onDelete: 'CASCADE'
  });

  AttributeValueTranslation.belongsTo(AttributeValue, {
    foreignKey: 'attribute_value_id',
    as: 'attributeValue'
  });

  // Note: CategorySeo associations would go here
  // Similar pattern for all other entities

  // ========================================
  // EMAIL TEMPLATE ASSOCIATIONS
  // ========================================

  EmailTemplate.hasMany(EmailTemplateTranslation, {
    foreignKey: 'email_template_id',
    as: 'translationsData',
    onDelete: 'CASCADE'
  });

  EmailTemplateTranslation.belongsTo(EmailTemplate, {
    foreignKey: 'email_template_id',
    as: 'emailTemplate'
  });

  EmailTemplate.belongsTo(Store, {
    foreignKey: 'store_id',
    as: 'store'
  });

  Store.hasMany(EmailTemplate, {
    foreignKey: 'store_id',
    as: 'emailTemplates'
  });

  // ========================================
  // BREVO CONFIGURATION ASSOCIATIONS
  // ========================================

  BrevoConfiguration.belongsTo(Store, {
    foreignKey: 'store_id',
    as: 'store'
  });

  Store.hasOne(BrevoConfiguration, {
    foreignKey: 'store_id',
    as: 'brevoConfiguration'
  });

  // ========================================
  // EMAIL SEND LOG ASSOCIATIONS
  // ========================================

  EmailSendLog.belongsTo(Store, {
    foreignKey: 'store_id',
    as: 'store'
  });

  EmailSendLog.belongsTo(EmailTemplate, {
    foreignKey: 'email_template_id',
    as: 'emailTemplate'
  });

  Store.hasMany(EmailSendLog, {
    foreignKey: 'store_id',
    as: 'emailSendLogs'
  });

  EmailTemplate.hasMany(EmailSendLog, {
    foreignKey: 'email_template_id',
    as: 'emailSendLogs'
  });

  console.log('✅ Model associations configured for normalized translations and email system');
}

module.exports = {
  setupAssociations,
  // Export all models for convenience
  Product,
  ProductTranslation,
  ProductSeo,
  Category,
  CategoryTranslation,
  CookieConsentSettings,
  CookieConsentSettingsTranslation,
  Attribute,
  AttributeTranslation,
  AttributeValue,
  AttributeValueTranslation,
  EmailTemplate,
  EmailTemplateTranslation,
  BrevoConfiguration,
  EmailSendLog,
  Store
};
