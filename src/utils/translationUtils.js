/**
 * Translation Utilities
 *
 * Helper functions for accessing translated content from entities
 */

/**
 * Get translated field from an entity (category, product, CMS page, etc.)
 *
 * The backend returns entities with translated fields directly on the object,
 * fetched from normalized translation tables based on the X-Language header.
 *
 * @param {Object} entity - The entity with translated fields
 * @param {String} field - The field name (e.g., 'name', 'description')
 * @param {String} lang - Language code (not used, kept for API compatibility)
 * @param {String} fallbackLang - Fallback language code (not used, kept for API compatibility)
 * @returns {String} Translated value
 */
export function getTranslatedField(entity, field, lang = 'en', fallbackLang = 'en') {
  if (!entity) return '';

  // Return field directly from entity (from normalized translations)
  if (entity[field] !== undefined && entity[field] !== null) {
    return entity[field];
  }

  // For title field, fallback to slug if available (useful for CMS pages)
  if (field === 'title' && entity.slug) {
    return entity.slug;
  }

  return '';
}

/**
 * Get translated category name
 *
 * @param {Object} category - Category object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated category name
 */
export function getCategoryName(category, lang = 'en') {
  return getTranslatedField(category, 'name', lang);
}

/**
 * Get translated category description
 *
 * @param {Object} category - Category object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated category description
 */
export function getCategoryDescription(category, lang = 'en') {
  return getTranslatedField(category, 'description', lang);
}

/**
 * Get translated product name
 *
 * @param {Object} product - Product object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated product name
 */
export function getProductName(product, lang = 'en') {
  return getTranslatedField(product, 'name', lang);
}

/**
 * Get translated product description
 *
 * @param {Object} product - Product object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated product description
 */
export function getProductDescription(product, lang = 'en') {
  return getTranslatedField(product, 'description', lang);
}

/**
 * Get translated product short description
 *
 * @param {Object} product - Product object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated product short description
 */
export function getProductShortDescription(product, lang = 'en') {
  return getTranslatedField(product, 'short_description', lang);
}

/**
 * Get translated CMS page title
 *
 * @param {Object} page - CMS page object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated page title
 */
export function getPageTitle(page, lang = 'en') {
  return getTranslatedField(page, 'title', lang);
}

/**
 * Get translated CMS page content
 *
 * @param {Object} page - CMS page object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated page content
 */
export function getPageContent(page, lang = 'en') {
  return getTranslatedField(page, 'content', lang);
}

/**
 * Get translated CMS block title
 *
 * @param {Object} block - CMS block object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated block title
 */
export function getBlockTitle(block, lang = 'en') {
  return getTranslatedField(block, 'title', lang);
}

/**
 * Get translated CMS block content
 *
 * @param {Object} block - CMS block object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated block content
 */
export function getBlockContent(block, lang = 'en') {
  return getTranslatedField(block, 'content', lang);
}

/**
 * Get translated shipping method name
 *
 * @param {Object} shippingMethod - Shipping method object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated shipping method name
 */
export function getShippingMethodName(shippingMethod, lang = 'en') {
  return getTranslatedField(shippingMethod, 'name', lang);
}

/**
 * Get translated shipping method description
 *
 * @param {Object} shippingMethod - Shipping method object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated shipping method description
 */
export function getShippingMethodDescription(shippingMethod, lang = 'en') {
  return getTranslatedField(shippingMethod, 'description', lang);
}

/**
 * Get translated payment method name
 *
 * @param {Object} paymentMethod - Payment method object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated payment method name
 */
export function getPaymentMethodName(paymentMethod, lang = 'en') {
  return getTranslatedField(paymentMethod, 'name', lang);
}

/**
 * Get translated payment method description
 *
 * @param {Object} paymentMethod - Payment method object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated payment method description
 */
export function getPaymentMethodDescription(paymentMethod, lang = 'en') {
  return getTranslatedField(paymentMethod, 'description', lang);
}

/**
 * Get translated product label text
 *
 * @param {Object} label - Product label object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated label text
 */
export function getProductLabelText(label, lang = 'en') {
  return getTranslatedField(label, 'text', lang) || label.text || '';
}

/**
 * Get translated product label name
 *
 * @param {Object} label - Product label object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated label name
 */
export function getProductLabelName(label, lang = 'en') {
  return getTranslatedField(label, 'name', lang) || label.name || '';
}

/**
 * Get translated product tab name
 *
 * @param {Object} tab - Product tab object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated tab name
 */
export function getProductTabName(tab, lang = 'en') {
  return getTranslatedField(tab, 'name', lang) || tab.name || '';
}

/**
 * Get translated product tab content
 *
 * @param {Object} tab - Product tab object
 * @param {String} lang - Language code (default: 'en')
 * @returns {String} Translated tab content
 */
export function getProductTabContent(tab, lang = 'en') {
  return getTranslatedField(tab, 'content', lang) || tab.content || '';
}

/**
 * Get current language from localStorage or browser
 *
 * @returns {String} Current language code
 */
export function getCurrentLanguage() {
  // Try localStorage first
  const savedLang = localStorage.getItem('catalyst_language');
  if (savedLang) return savedLang;

  // Try browser language
  const browserLang = navigator.language?.split('-')[0];
  if (browserLang) return browserLang;

  // Default to English
  return 'en';
}
