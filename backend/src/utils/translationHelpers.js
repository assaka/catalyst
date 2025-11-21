/**
 * Translation Helpers for Normalized Tables
 *
 * This module provides utility functions to construct the same JSON response
 * format from normalized translation tables that the frontend expects using Supabase.
 *
 * WHY THIS EXISTS:
 * - Frontend uses translationUtils.js which expects: entity.translations[lang][field]
 * - We normalized translations from JSON columns to relational tables
 * - These helpers construct the same JSON format via Supabase queries
 * - Frontend code requires zero changes
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Build translations JSON from normalized table
 *
 * @param {string} storeId - Store ID
 * @param {string} entityTable - Main entity table (e.g., 'products')
 * @param {string} translationTable - Translation table (e.g., 'product_translations')
 * @param {string} entityIdField - Foreign key field (e.g., 'product_id')
 * @param {Array<string>} fields - Fields to include (e.g., ['name', 'description'])
 * @param {object} where - WHERE clause conditions
 * @returns {Promise<Array>} Entities with translations JSON
 */
async function buildEntityWithTranslations(
  storeId,
  entityTable,
  translationTable,
  entityIdField,
  fields,
  where = {}
) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch entities
  let entityQuery = tenantDb.from(entityTable).select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      entityQuery = entityQuery.is(key, null);
    } else if (Array.isArray(value)) {
      entityQuery = entityQuery.in(key, value);
    } else {
      entityQuery = entityQuery.eq(key, value);
    }
  }

  entityQuery = entityQuery.order('created_at', { ascending: false });

  const { data: entities, error: entitiesError } = await entityQuery;

  if (entitiesError) {
    console.error(`Error fetching ${entityTable}:`, entitiesError);
    throw entitiesError;
  }

  if (!entities || entities.length === 0) {
    return [];
  }

  // Fetch translations
  const entityIds = entities.map(e => e.id);
  const { data: translations, error: transError } = await tenantDb
    .from(translationTable)
    .select('*')
    .in(entityIdField, entityIds);

  if (transError) {
    console.error(`Error fetching ${translationTable}:`, transError);
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    if (!transMap[t[entityIdField]]) {
      transMap[t[entityIdField]] = {};
    }
    const langData = {};
    fields.forEach(field => {
      langData[field] = t[field];
    });
    transMap[t[entityIdField]][t.language_code] = langData;
  });

  // Merge entities with translations
  return entities.map(entity => ({
    ...entity,
    translations: transMap[entity.id] || {}
  }));
}

/**
 * Build SEO JSON from normalized SEO table
 *
 * @param {string} storeId - Store ID
 * @param {string} entityTable - Main entity table
 * @param {string} seoTable - SEO table (e.g., 'product_seo')
 * @param {string} entityIdField - Foreign key field
 * @param {object} where - WHERE clause conditions
 * @returns {Promise<Array>} Entities with SEO JSON
 */
async function buildEntityWithSEO(storeId, entityTable, seoTable, entityIdField, where = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch entities
  let entityQuery = tenantDb.from(entityTable).select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    entityQuery = entityQuery.eq(key, value);
  }

  entityQuery = entityQuery.order('created_at', { ascending: false });

  const { data: entities, error: entitiesError } = await entityQuery;

  if (entitiesError) {
    console.error(`Error fetching ${entityTable}:`, entitiesError);
    throw entitiesError;
  }

  if (!entities || entities.length === 0) {
    return [];
  }

  // Fetch SEO data
  const entityIds = entities.map(e => e.id);
  const { data: seoData, error: seoError } = await tenantDb
    .from(seoTable)
    .select('*')
    .in(entityIdField, entityIds);

  if (seoError) {
    console.error(`Error fetching ${seoTable}:`, seoError);
  }

  const seoFields = [
    'meta_title', 'meta_description', 'meta_keywords', 'meta_robots_tag',
    'og_title', 'og_description', 'og_image_url',
    'twitter_title', 'twitter_description', 'twitter_image_url',
    'canonical_url'
  ];

  // Build SEO map
  const seoMap = {};
  (seoData || []).forEach(s => {
    if (!seoMap[s[entityIdField]]) {
      seoMap[s[entityIdField]] = {};
    }
    const langSeoData = {};
    seoFields.forEach(field => {
      langSeoData[field] = s[field];
    });
    seoMap[s[entityIdField]][s.language_code] = langSeoData;
  });

  // Merge entities with SEO
  return entities.map(entity => ({
    ...entity,
    seo: seoMap[entity.id] || {}
  }));
}

/**
 * Build complete entity with both translations AND SEO
 *
 * @param {string} storeId - Store ID
 * @param {string} entityTable - Main entity table
 * @param {string} translationTable - Translation table
 * @param {string} seoTable - SEO table
 * @param {string} entityIdField - Foreign key field
 * @param {Array<string>} translationFields - Translation fields
 * @param {object} where - WHERE clause conditions
 * @returns {Promise<Array>} Entities with translations and SEO JSON
 */
async function buildEntityComplete(
  storeId,
  entityTable,
  translationTable,
  seoTable,
  entityIdField,
  translationFields,
  where = {}
) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch entities
  let entityQuery = tenantDb.from(entityTable).select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      entityQuery = entityQuery.is(key, null);
    } else if (Array.isArray(value)) {
      entityQuery = entityQuery.in(key, value);
    } else {
      entityQuery = entityQuery.eq(key, value);
    }
  }

  entityQuery = entityQuery.order('created_at', { ascending: false });

  const { data: entities, error: entitiesError } = await entityQuery;

  if (entitiesError) {
    console.error(`Error fetching ${entityTable}:`, entitiesError);
    throw entitiesError;
  }

  if (!entities || entities.length === 0) {
    return [];
  }

  const entityIds = entities.map(e => e.id);

  // Fetch translations
  const { data: translations, error: transError } = await tenantDb
    .from(translationTable)
    .select('*')
    .in(entityIdField, entityIds);

  if (transError) {
    console.error(`Error fetching ${translationTable}:`, transError);
  }

  // Fetch SEO data
  const { data: seoData, error: seoError } = await tenantDb
    .from(seoTable)
    .select('*')
    .in(entityIdField, entityIds);

  if (seoError) {
    console.error(`Error fetching ${seoTable}:`, seoError);
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    if (!transMap[t[entityIdField]]) {
      transMap[t[entityIdField]] = {};
    }
    const langData = {};
    translationFields.forEach(field => {
      langData[field] = t[field];
    });
    transMap[t[entityIdField]][t.language_code] = langData;
  });

  // Build SEO map
  const seoFields = [
    'meta_title', 'meta_description', 'meta_keywords', 'meta_robots_tag',
    'og_title', 'og_description', 'og_image_url',
    'twitter_title', 'twitter_description', 'twitter_image_url',
    'canonical_url'
  ];

  const seoMap = {};
  (seoData || []).forEach(s => {
    if (!seoMap[s[entityIdField]]) {
      seoMap[s[entityIdField]] = {};
    }
    const langSeoData = {};
    seoFields.forEach(field => {
      langSeoData[field] = s[field];
    });
    seoMap[s[entityIdField]][s.language_code] = langSeoData;
  });

  // Merge entities with translations and SEO
  return entities.map(entity => ({
    ...entity,
    translations: transMap[entity.id] || {},
    seo: seoMap[entity.id] || {}
  }));
}

/**
 * Convenience functions for common entities
 */

async function getProductsWithTranslations(storeId, where = {}) {
  return buildEntityComplete(
    storeId,
    'products',
    'product_translations',
    'product_seo',
    'product_id',
    ['name', 'description', 'short_description'],
    where
  );
}

async function getCategoriesWithTranslations(storeId, where = {}) {
  return buildEntityComplete(
    storeId,
    'categories',
    'category_translations',
    'category_seo',
    'category_id',
    ['name', 'description'],
    where
  );
}

async function getCmsPagesWithTranslations(storeId, where = {}) {
  return buildEntityComplete(
    storeId,
    'cms_pages',
    'cms_page_translations',
    'cms_page_seo',
    'cms_page_id',
    ['title', 'content', 'excerpt'],
    where
  );
}

async function getAttributesWithTranslations(storeId, where = {}) {
  return buildEntityWithTranslations(
    storeId,
    'attributes',
    'attribute_translations',
    'attribute_id',
    ['label', 'description'],
    where
  );
}

async function getAttributeValuesWithTranslations(storeId, where = {}) {
  return buildEntityWithTranslations(
    storeId,
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
