/**
 * Translation Helpers for Normalized Tables
 *
 * This module provides utility functions to construct the same JSON response
 * format from normalized translation tables that the frontend expects.
 *
 * WHY THIS EXISTS:
 * - Frontend uses translationUtils.js which expects: entity.translations[lang][field]
 * - We normalized translations from JSON columns to relational tables
 * - These helpers construct the same JSON format via SQL JOINs
 * - Frontend code requires zero changes
 *
 * USAGE:
 * ```javascript
 * // In backend route
 * const products = await getProductsWithTranslations(storeId);
 * // Returns: [{ id, sku, translations: {en: {...}, nl: {...}}, seo: {...} }]
 * ```
 */

const { sequelize } = require('../database/connection');

/**
 * Build translations JSON from normalized table
 *
 * @param {string} entityTable - Main entity table (e.g., 'products')
 * @param {string} translationTable - Translation table (e.g., 'product_translations')
 * @param {string} entityIdField - Foreign key field (e.g., 'product_id')
 * @param {Array<string>} fields - Fields to include (e.g., ['name', 'description'])
 * @param {object} where - WHERE clause conditions
 * @returns {Promise<Array>} Entities with translations JSON
 *
 * @example
 * const products = await buildEntityWithTranslations(
 *   'products',
 *   'product_translations',
 *   'product_id',
 *   ['name', 'description', 'short_description'],
 *   { store_id: '123', status: 'active' }
 * );
 */
async function buildEntityWithTranslations(
  entityTable,
  translationTable,
  entityIdField,
  fields,
  where = {}
) {
  // Build WHERE clause
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === null) return `e.${key} IS NULL`;
      if (Array.isArray(value)) {
        const vals = value.map(v => `'${v}'`).join(', ');
        return `e.${key} IN (${vals})`;
      }
      return `e.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  // Build field list for JSON object
  const fieldList = fields.map(f => `'${f}', t.${f}`).join(', ');

  const query = `
    SELECT
      e.*,
      COALESCE(
        json_object_agg(
          t.language_code,
          json_build_object(${fieldList})
        ) FILTER (WHERE t.language_code IS NOT NULL),
        '{}'::json
      ) as translations
    FROM ${entityTable} e
    LEFT JOIN ${translationTable} t ON e.id = t.${entityIdField}
    ${whereClause}
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  return results;
}

/**
 * Build SEO JSON from normalized SEO table
 *
 * @param {string} entityTable - Main entity table
 * @param {string} seoTable - SEO table (e.g., 'product_seo')
 * @param {string} entityIdField - Foreign key field
 * @param {object} where - WHERE clause conditions
 * @returns {Promise<Array>} Entities with SEO JSON
 */
async function buildEntityWithSEO(entityTable, seoTable, entityIdField, where = {}) {
  const whereConditions = Object.entries(where)
    .map(([key, value]) => `e.${key} = '${value}'`)
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const seoFields = [
    'meta_title', 'meta_description', 'meta_keywords', 'meta_robots_tag',
    'og_title', 'og_description', 'og_image_url',
    'twitter_title', 'twitter_description', 'twitter_image_url',
    'canonical_url'
  ];

  const fieldList = seoFields.map(f => `'${f}', s.${f}`).join(', ');

  const query = `
    SELECT
      e.*,
      COALESCE(
        json_object_agg(
          s.language_code,
          json_build_object(${fieldList})
        ) FILTER (WHERE s.language_code IS NOT NULL),
        '{}'::json
      ) as seo
    FROM ${entityTable} e
    LEFT JOIN ${seoTable} s ON e.id = s.${entityIdField}
    ${whereClause}
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  return results;
}

/**
 * Build complete entity with both translations AND SEO
 *
 * @param {string} entityTable - Main entity table
 * @param {string} translationTable - Translation table
 * @param {string} seoTable - SEO table
 * @param {string} entityIdField - Foreign key field
 * @param {Array<string>} translationFields - Translation fields
 * @param {object} where - WHERE clause conditions
 * @returns {Promise<Array>} Entities with translations and SEO JSON
 */
async function buildEntityComplete(
  entityTable,
  translationTable,
  seoTable,
  entityIdField,
  translationFields,
  where = {}
) {
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === null) return `e.${key} IS NULL`;
      if (Array.isArray(value)) {
        const vals = value.map(v => `'${v}'`).join(', ');
        return `e.${key} IN (${vals})`;
      }
      return `e.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  // Translation fields
  const transFieldList = translationFields.map(f => `'${f}', t.${f}`).join(', ');

  // SEO fields
  const seoFields = [
    'meta_title', 'meta_description', 'meta_keywords', 'meta_robots_tag',
    'og_title', 'og_description', 'og_image_url',
    'twitter_title', 'twitter_description', 'twitter_image_url',
    'canonical_url'
  ];
  const seoFieldList = seoFields.map(f => `'${f}', s.${f}`).join(', ');

  const query = `
    SELECT
      e.*,
      COALESCE(
        json_object_agg(
          t.language_code,
          json_build_object(${transFieldList})
        ) FILTER (WHERE t.language_code IS NOT NULL),
        '{}'::json
      ) as translations,
      COALESCE(
        json_object_agg(
          s.language_code,
          json_build_object(${seoFieldList})
        ) FILTER (WHERE s.language_code IS NOT NULL),
        '{}'::json
      ) as seo
    FROM ${entityTable} e
    LEFT JOIN ${translationTable} t ON e.id = t.${entityIdField}
    LEFT JOIN ${seoTable} s ON e.id = s.${entityIdField}
    ${whereClause}
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  return results;
}

/**
 * Convenience functions for common entities
 */

async function getProductsWithTranslations(where = {}) {
  return buildEntityComplete(
    'products',
    'product_translations',
    'product_seo',
    'product_id',
    ['name', 'description', 'short_description'],
    where
  );
}

async function getCategoriesWithTranslations(where = {}) {
  return buildEntityComplete(
    'categories',
    'category_translations',
    'category_seo',
    'category_id',
    ['name', 'description'],
    where
  );
}

async function getCmsPagesWithTranslations(where = {}) {
  return buildEntityComplete(
    'cms_pages',
    'cms_page_translations',
    'cms_page_seo',
    'cms_page_id',
    ['title', 'content', 'excerpt'],
    where
  );
}

async function getAttributesWithTranslations(where = {}) {
  return buildEntityWithTranslations(
    'attributes',
    'attribute_translations',
    'attribute_id',
    ['label', 'description'],
    where
  );
}

async function getAttributeValuesWithTranslations(where = {}) {
  return buildEntityWithTranslations(
    'attribute_values',
    'attribute_value_translations',
    'attribute_value_id',
    ['value', 'description'],
    where
  );
}

module.exports = {
  buildEntityWithTranslations,
  buildEntityWithSEO,
  buildEntityComplete,
  getProductsWithTranslations,
  getCategoriesWithTranslations,
  getCmsPagesWithTranslations,
  getAttributesWithTranslations,
  getAttributeValuesWithTranslations
};
