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

  if (productIds.length === 0) return products;

  const query = `
    SELECT product_id, name, description, short_description
    FROM product_translations
    WHERE product_id IN (:productIds) AND language_code = :lang
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
    // Convert to plain object but preserve all nested data
    const productData = product.toJSON ? product.toJSON() : { ...product };
    const translation = translationMap[productData.id];

    if (translation) {
      // Use normalized translation
      productData.name = translation.name;
      productData.description = translation.description;
      productData.short_description = translation.short_description;
    } else if (productData.translations) {
      // Fallback to JSON column
      const fallbackLang = productData.translations[lang] || productData.translations.en || {};
      productData.name = fallbackLang.name || '';
      productData.description = fallbackLang.description || '';
      productData.short_description = fallbackLang.short_description || '';
    }

    return productData;
  });
}

/**
 * Get products with ALL translations for admin translation management
 *
 * @param {Array} products - Array of product objects from Sequelize
 * @returns {Promise<Array>} Products with all translations nested by language code
 */
async function applyAllProductTranslations(products) {
  if (!products || products.length === 0) return [];

  // Convert products to plain objects
  const productData = products.map(p => p.toJSON ? p.toJSON() : p);
  const productIds = productData.map(p => p.id).filter(Boolean);

  if (productIds.length === 0) return productData;

  // Fetch all translations for these products
  const query = `
    SELECT
      product_id,
      language_code,
      name,
      description,
      short_description
    FROM product_translations
    WHERE product_id IN (:productIds)
  `;

  const translations = await sequelize.query(query, {
    replacements: { productIds },
    type: sequelize.QueryTypes.SELECT
  });

  console.log('📊 applyAllProductTranslations - Fetched translations:', {
    productCount: productData.length,
    translationCount: translations.length,
    sampleTranslations: translations.slice(0, 5),
    productIds: productIds.slice(0, 3)
  });

  // Group translations by product_id and language_code
  const translationsByProduct = {};
  translations.forEach(t => {
    if (!translationsByProduct[t.product_id]) {
      translationsByProduct[t.product_id] = {};
    }
    translationsByProduct[t.product_id][t.language_code] = {
      name: t.name,
      description: t.description,
      short_description: t.short_description
    };
  });

  console.log('📦 applyAllProductTranslations - Grouped translations:', {
    productIdsWithTranslations: Object.keys(translationsByProduct),
    sampleGrouped: Object.entries(translationsByProduct).slice(0, 2).map(([id, trans]) => ({
      productId: id,
      languages: Object.keys(trans)
    }))
  });

  // Attach translations to products
  const result = productData.map(product => ({
    ...product,
    translations: translationsByProduct[product.id] || {}
  }));

  console.log('✅ applyAllProductTranslations - Final result sample:', {
    firstProduct: result[0] ? {
      id: result[0].id,
      name: result[0].name,
      translationKeys: Object.keys(result[0].translations || {})
    } : null
  });

  return result;
}

/**
 * Update product translations in normalized table
 *
 * @param {string} productId - Product ID
 * @param {Object} translations - Translations object { en: {...}, nl: {...} }
 * @returns {Promise<void>}
 */
async function updateProductTranslations(productId, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        await sequelize.query(`
          INSERT INTO product_translations (
            product_id, language_code, name, description, short_description,
            created_at, updated_at
          ) VALUES (
            :product_id, :lang_code, :name, :description, :short_description,
            NOW(), NOW()
          )
          ON CONFLICT (product_id, language_code) DO UPDATE
          SET
            name = COALESCE(EXCLUDED.name, product_translations.name),
            description = COALESCE(EXCLUDED.description, product_translations.description),
            short_description = COALESCE(EXCLUDED.short_description, product_translations.short_description),
            updated_at = NOW()
        `, {
          replacements: {
            product_id: productId,
            lang_code: langCode,
            name: data.name,
            description: data.description,
            short_description: data.short_description
          },
          transaction
        });
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  getProductTranslation,
  applyProductTranslations,
  applyProductTranslationsToMany,
  applyAllProductTranslations,
  updateProductTranslations
};
