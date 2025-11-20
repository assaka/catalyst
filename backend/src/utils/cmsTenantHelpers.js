/**
 * CMS Tenant Helpers for Multi-Tenant Database Architecture
 *
 * These helpers fetch CMS data from tenant-specific databases using ConnectionManager
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get CMS blocks with ALL translations from tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<Array>} CMS blocks with all translations
 */
async function getCMSBlocksWithAllTranslations(storeId, where = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Build query for cms_blocks
  let query = tenantDb.select('*').from('cms_blocks');

  // Apply where conditions
  Object.entries(where).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.whereIn(key, value);
    } else {
      query = query.where(key, value);
    }
  });

  query = query.orderBy('sort_order', 'asc').orderBy('created_at', 'desc');

  const blocks = await query;

  // Load translations for each block
  for (const block of blocks) {
    const translations = await tenantDb
      .select('language_code', 'title', 'content')
      .from('cms_block_translations')
      .where('cms_block_id', block.id);

    block.translations = {};
    translations.forEach(t => {
      block.translations[t.language_code] = {
        title: t.title,
        content: t.content
      };
    });
  }

  return blocks;
}

/**
 * Get CMS block with ALL translations from tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {string} id - Block ID
 * @returns {Promise<Object|null>} CMS block with all translations
 */
async function getCMSBlockWithAllTranslations(storeId, id) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Get the block
  const block = await tenantDb
    .select('*')
    .from('cms_blocks')
    .where('id', id)
    .first();

  if (!block) return null;

  // Get all translations
  const translations = await tenantDb
    .select('*')
    .from('cms_block_translations')
    .where('cms_block_id', id);

  block.translations = {};
  translations.forEach(t => {
    block.translations[t.language_code] = {
      title: t.title,
      content: t.content
    };
  });

  return block;
}

/**
 * Save CMS block translations to tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {string} blockId - Block ID
 * @param {Object} translations - Translations object {en: {title, content}, nl: {title, content}}
 * @returns {Promise<void>}
 */
async function saveCMSBlockTranslations(storeId, blockId, translations) {
  if (!translations || typeof translations !== 'object') {
    return;
  }

  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  for (const [langCode, fields] of Object.entries(translations)) {
    if (!fields || typeof fields !== 'object') continue;

    const { title, content } = fields;

    // Skip if all fields are empty
    if (!title && !content) continue;

    // Upsert translation record using knex
    await tenantDb
      .insert({
        cms_block_id: blockId,
        language_code: langCode,
        title: title || null,
        content: content || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .into('cms_block_translations')
      .onConflict(['cms_block_id', 'language_code'])
      .merge()
      .catch(error => {
        console.error(`Error saving translation for ${langCode}:`, error);
      });
  }
}

/**
 * Get CMS pages with ALL translations from tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<Array>} CMS pages with all translations
 */
async function getCMSPagesWithAllTranslations(storeId, where = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Get pages with filters
  let query = tenantDb.select('*').from('cms_pages');

  Object.entries(where).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.whereIn(key, value);
    } else {
      query = query.where(key, value);
    }
  });

  const pages = await query.orderBy('sort_order', 'asc');

  // Load translations for each page
  for (const page of pages) {
    const translations = await tenantDb
      .select('*')
      .from('cms_page_translations')
      .where('cms_page_id', page.id);

    page.translations = {};
    translations.forEach(t => {
      page.translations[t.language_code] = {
        title: t.title,
        content: t.content,
        excerpt: t.excerpt
      };
    });
  }

  return pages;
}

/**
 * Get CMS page with ALL translations from tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {string} id - Page ID
 * @returns {Promise<Object|null>} CMS page with all translations
 */
async function getCMSPageWithAllTranslations(storeId, id) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Get the page
  const page = await tenantDb
    .select('*')
    .from('cms_pages')
    .where('id', id)
    .first();

  if (!page) return null;

  // Get all translations
  const translations = await tenantDb
    .select('*')
    .from('cms_page_translations')
    .where('cms_page_id', id);

  page.translations = {};
  translations.forEach(t => {
    page.translations[t.language_code] = {
      title: t.title,
      content: t.content,
      excerpt: t.excerpt
    };
  });

  return page;
}

/**
 * Save CMS page translations to tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {string} pageId - Page ID
 * @param {Object} translations - Translations object {en: {title, content, excerpt}, nl: {title, content, excerpt}}
 * @returns {Promise<void>}
 */
async function saveCMSPageTranslations(storeId, pageId, translations) {
  if (!translations || typeof translations !== 'object') {
    return;
  }

  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  for (const [langCode, fields] of Object.entries(translations)) {
    if (!fields || typeof fields !== 'object') continue;

    const { title, content, excerpt } = fields;

    // Skip if all fields are empty
    if (!title && !content && !excerpt) continue;

    // Upsert translation record using knex
    await tenantDb
      .insert({
        cms_page_id: pageId,
        language_code: langCode,
        title: title || null,
        content: content || null,
        excerpt: excerpt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .into('cms_page_translations')
      .onConflict(['cms_page_id', 'language_code'])
      .merge()
      .catch(error => {
        console.error(`Error saving page translation for ${langCode}:`, error);
      });
  }
}

module.exports = {
  getCMSBlocksWithAllTranslations,
  getCMSBlockWithAllTranslations,
  saveCMSBlockTranslations,
  getCMSPagesWithAllTranslations,
  getCMSPageWithAllTranslations,
  saveCMSPageTranslations
};
