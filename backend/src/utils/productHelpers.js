/**
 * Product Helpers for Normalized Translations
 *
 * These helpers fetch translations from the normalized product_translations table
 * and merge them with Sequelize product data.
 */

const { sequelize } = require('../database/connection');
const { Op } = require('sequelize');

/**
 * Get product translation from normalized table with English fallback
 *
 * @param {string} productId - Product ID
 * @param {string} lang - Language code
 * @returns {Promise<Object|null>} Translation data
 */
async function getProductTranslation(productId, lang = 'en') {
  const query = `
    SELECT name, description, short_description, language_code
    FROM product_translations
    WHERE product_id = :productId AND language_code IN (:lang, 'en')
    ORDER BY CASE WHEN language_code = :lang THEN 1 ELSE 2 END
    LIMIT 1
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

  // Fetch translation from normalized table (with English fallback)
  const translation = await getProductTranslation(productData.id, lang);

  if (translation) {
    // Use normalized translation (requested lang or English fallback)
    productData.name = translation.name || '';
    productData.description = translation.description || '';
    productData.short_description = translation.short_description || '';
  } else if (productData.translations) {
    // Fallback to JSON column
    const fallbackLang = productData.translations[lang] || productData.translations.en || {};
    productData.name = fallbackLang.name || '';
    productData.description = fallbackLang.description || '';
    productData.short_description = fallbackLang.short_description || '';
  }
  // If no translations exist, fields will be empty strings

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

  // Fetch both requested language and English fallback in one query
  const query = `
    SELECT product_id, language_code, name, description, short_description
    FROM product_translations
    WHERE product_id IN (:productIds) AND language_code IN (:lang, 'en')
  `;

  // This function is deprecated - callers should pass tenantDb and query translations directly
  // Return products as-is (original implementation used Sequelize which is deprecated)
  return products;

  // Create maps for quick lookup (requested language and English fallback)
  const requestedLangMap = {};
  const englishLangMap = {};

  translations.forEach(t => {
    if (t.language_code === lang) {
      requestedLangMap[t.product_id] = t;
    }
    if (t.language_code === 'en') {
      englishLangMap[t.product_id] = t;
    }
  });

  // Apply translations to each product
  return products.map(product => {
    // Convert to plain object but preserve all nested data
    const productData = product.toJSON ? product.toJSON() : { ...product };

    // Try requested language first, then English, then keep original values
    const translation = requestedLangMap[productData.id] || englishLangMap[productData.id];

    if (translation) {
      // Use normalized translation (requested lang or English fallback)
      productData.name = translation.name || '';
      productData.description = translation.description || '';
      productData.short_description = translation.short_description || '';
    } else if (productData.translations) {
      // Fallback to JSON column
      const fallbackLang = productData.translations[lang] || productData.translations.en || {};
      productData.name = fallbackLang.name || '';
      productData.description = fallbackLang.description || '';
      productData.short_description = fallbackLang.short_description || '';
    }
    // If no translations exist, fields will be empty strings

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

  // Attach translations to products
  const result = productData.map(product => ({
    ...product,
    translations: translationsByProduct[product.id] || {}
  }));

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
    console.log(`   💾 updateProductTranslations called for product ${productId}`);
    console.log(`   📋 Translations to save:`, JSON.stringify(translations, null, 2));

    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        console.log(`      💾 Saving ${langCode} translation:`, {
          name: data.name ? data.name.substring(0, 30) : null,
          description: data.description ? data.description.substring(0, 30) + '...' : null,
          short_description: data.short_description ? data.short_description.substring(0, 30) + '...' : null
        });

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
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            short_description = EXCLUDED.short_description,
            updated_at = NOW()
        `, {
          replacements: {
            product_id: productId,
            lang_code: langCode,
            name: data.name !== undefined ? data.name : null,
            description: data.description !== undefined ? data.description : null,
            short_description: data.short_description !== undefined ? data.short_description : null
          },
          transaction
        });

        console.log(`      ✅ Saved ${langCode} translation to product_translations table`);
      } else {
        console.log(`      ⏭️  Skipping ${langCode}: No data or empty object`);
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Get products with all data (translations, attributes) in optimized SQL queries
 * Reduces N+1 queries by using JOINs
 *
 * @param {Object} where - Sequelize WHERE conditions
 * @param {string} lang - Language code
 * @param {Object} options - { limit, offset, order }
 * @returns {Promise<Object>} { rows, count }
 */
async function getProductsOptimized(where = {}, lang = 'en', options = {}) {
  const { limit, offset, order = [['created_at', 'DESC']] } = options;

  // Build WHERE clause for raw SQL
  const buildWhereClause = (conditions) => {
    const clauses = [];
    const replacements = {};

    Object.entries(conditions).forEach(([key, value]) => {
      if (key === 'category_ids' && value[Op.contains]) {
        // Handle JSONB contains for categories
        clauses.push(`p.category_ids @> :category_ids`);
        replacements.category_ids = JSON.stringify(value[Op.contains]);
      } else if (typeof value === 'object' && value[Op.or]) {
        // Handle complex OR conditions (for stock filtering)
        const orClauses = value[Op.or].map((condition, idx) => {
          if (condition.type === 'configurable') {
            return `p.type = 'configurable'`;
          } else if (condition.infinite_stock === true) {
            return `p.infinite_stock = true`;
          } else if (condition.manage_stock === false) {
            return `p.manage_stock = false`;
          } else if (condition[Op.and]) {
            return `(p.manage_stock = true AND p.stock_quantity > 0)`;
          }
          return null;
        }).filter(Boolean);
        if (orClauses.length > 0) {
          clauses.push(`(${orClauses.join(' OR ')})`);
        }
      } else {
        // Simple equality
        clauses.push(`p.${key} = :${key}`);
        replacements[key] = value;
      }
    });

    return { clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', replacements };
  };

  const { clause: whereClause, replacements: whereReplacements } = buildWhereClause(where);

  // Count query
  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as count
    FROM products p
    ${whereClause}
  `;

  // Main query with JOINs for translations
  const paginationClause = [];
  if (limit) paginationClause.push(`LIMIT ${parseInt(limit)}`);
  if (offset) paginationClause.push(`OFFSET ${parseInt(offset)}`);

  const dataQuery = `
    SELECT
      p.*,
      COALESCE(pt.name, pt_en.name, '') as name,
      COALESCE(pt.description, pt_en.description, '') as description,
      COALESCE(pt.short_description, pt_en.short_description, '') as short_description
    FROM products p
    LEFT JOIN product_translations pt
      ON p.id = pt.product_id AND pt.language_code = :lang
    LEFT JOIN product_translations pt_en
      ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
    ${whereClause}
    ORDER BY p.created_at DESC
    ${paginationClause.join(' ')}
  `;

  const replacements = { ...whereReplacements, lang };

  // Execute both queries in parallel
  const [countResult, products] = await Promise.all([
    sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(dataQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    })
  ]);

  const count = parseInt(countResult[0]?.count || 0);

  return { rows: products, count };
}

module.exports = {
  getProductTranslation,
  applyProductTranslations,
  applyProductTranslationsToMany,
  applyAllProductTranslations,
  updateProductTranslations,
  getProductsOptimized
};
