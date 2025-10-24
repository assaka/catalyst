/**
 * Product Helpers for Normalized Translations
 *
 * These helpers fetch translations from the normalized product_translations table
 * and merge them with Sequelize product data.
 */

const { sequelize } = require('../database/connection');

/**
 * Get product translation from normalized table
 *
 * @param {string} productId - Product ID
 * @param {string} lang - Language code
 * @returns {Promise<Object|null>} Translation data
 */
async function getProductTranslation(productId, lang = 'en') {
  const query = `
    SELECT name, description, short_description
    FROM product_translations
    WHERE product_id = :productId AND language_code = :lang
  `;

  const results = await sequelize.query(query, {
    replacements: { productId, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

/**
 * Apply translations to product data
 * Fetches from normalized table and merges with product JSON
 *
 * @param {Object} product - Product object (from Sequelize)
 * @param {string} lang - Language code
 * @returns {Promise<Object>} Product with applied translations
 */
async function applyProductTranslations(product, lang = 'en') {
  if (!product) return null;

  const productData = product.toJSON ? product.toJSON() : product;

  // Fetch translation from normalized table
  const translation = await getProductTranslation(productData.id, lang);

  if (translation) {
    // Use normalized translation
    productData.name = translation.name;
    productData.description = translation.description;
    productData.short_description = translation.short_description;
  } else if (productData.translations) {
    // Fallback to JSON column
    const fallbackLang = productData.translations[lang] || productData.translations.en || {};
    productData.name = fallbackLang.name;
    productData.description = fallbackLang.description;
    productData.short_description = fallbackLang.short_description;
  }

  return productData;
}

/**
 * Apply translations to multiple products
 *
 * @param {Array} products - Array of product objects
 * @param {string} lang - Language code
 * @returns {Promise<Array>} Products with applied translations
 */
async function applyProductTranslationsToMany(products, lang = 'en') {
  if (!products || products.length === 0) return [];

  // Fetch all translations in one query
  const productIds = products.map(p => p.id || (p.toJSON ? p.toJSON().id : null)).filter(Boolean);

  const query = `
    SELECT product_id, name, description, short_description
    FROM product_translations
    WHERE product_id = ANY(:productIds) AND language_code = :lang
  `;

  const translations = await sequelize.query(query, {
    replacements: { productIds, lang },
    type: sequelize.QueryTypes.SELECT
  });

  // Create a map for quick lookup
  const translationMap = {};
  translations.forEach(t => {
    translationMap[t.product_id] = t;
  });

  // Apply translations to each product
  return products.map(product => {
    const productData = product.toJSON ? product.toJSON() : product;
    const translation = translationMap[productData.id];

    if (translation) {
      productData.name = translation.name;
      productData.description = translation.description;
      productData.short_description = translation.short_description;
    } else if (productData.translations) {
      // Fallback to JSON column
      const fallbackLang = productData.translations[lang] || productData.translations.en || {};
      productData.name = fallbackLang.name;
      productData.description = fallbackLang.description;
      productData.short_description = fallbackLang.short_description;
    }

    return productData;
  });
}

module.exports = {
  getProductTranslation,
  applyProductTranslations,
  applyProductTranslationsToMany
};
