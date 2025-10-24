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

// Import translation models
const ProductTranslation = require('./ProductTranslation');
const CategoryTranslation = require('./CategoryTranslation');
// Note: Other translation models will be created similarly

// Import SEO models
const ProductSeo = require('./ProductSeo');
// Note: Other SEO models will be created similarly

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

  // Note: CategorySeo associations would go here
  // Similar pattern for all other entities

  console.log('✅ Model associations configured for normalized translations');
}

module.exports = {
  setupAssociations,
  // Export all models for convenience
  Product,
  ProductTranslation,
  ProductSeo,
  Category,
  CategoryTranslation
};
