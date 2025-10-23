/**
 * Translation Utilities
 *
 * Helper functions for accessing translated content from entities
 */

/**
 * Get translated field from an entity (category, product, CMS page, etc.)
 *
 * @param {Object} entity - The entity with translations
 * @param {String} field - The field name (e.g., 'name', 'description')
 * @param {String} lang - Language code (default: 'en')
 * @param {String} fallbackLang - Fallback language code (default: 'en')
 * @returns {String} Translated value or fallback
 */
export function getTranslatedField(entity, field, lang = 'en', fallbackLang = 'en') {
  if (!entity) return '';

  // Try translations object first
  if (entity.translations && entity.translations[lang] && entity.translations[lang][field]) {
    return entity.translations[lang][field];
  }

  // Try fallback language
  if (lang !== fallbackLang && entity.translations && entity.translations[fallbackLang] && entity.translations[fallbackLang][field]) {
    return entity.translations[fallbackLang][field];
  }

  // Fallback to direct property if translations are not available
  // This ensures backward compatibility and handles cases where translations haven't been populated yet
  if (entity[field]) {
    return entity[field];
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
