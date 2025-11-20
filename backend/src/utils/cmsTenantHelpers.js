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
  let query = tenantDb.from('cms_blocks').select('*');

  // Apply where conditions
  Object.entries(where).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  });

  query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

  const { data: blocks, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch CMS blocks: ${error.message}`);
  }

  // Load translations for each block
  for (const block of blocks || []) {
    const { data: translations, error: transError } = await tenantDb
      .from('cms_block_translations')
      .select('language_code, title, content')
      .eq('cms_block_id', block.id);

    if (transError) {
      console.error(`Error loading translations for block ${block.id}:`, transError);
      block.translations = {};
      continue;
    }

    block.translations = {};
    (translations || []).forEach(t => {
      block.translations[t.language_code] = {
        title: t.title,
        content: t.content
      };
    });
  }

  return blocks || [];
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
  const { data: block, error } = await tenantDb
    .from('cms_blocks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !block) return null;

  // Get all translations
  const { data: translations, error: transError } = await tenantDb
    .from('cms_block_translations')
    .select('*')
    .eq('cms_block_id', id);

  if (transError) {
    console.error(`Error loading translations for block ${id}:`, transError);
    block.translations = {};
    return block;
  }

  block.translations = {};
  (translations || []).forEach(t => {
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

    // Upsert translation record
    const { error } = await tenantDb
      .from('cms_block_translations')
      .upsert({
        cms_block_id: blockId,
        language_code: langCode,
        title: title || null,
        content: content || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cms_block_id,language_code'
      });

    if (error) {
      console.error(`Error saving translation for ${langCode}:`, error);
    }
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
  let query = tenantDb.from('cms_pages').select('*');

  Object.entries(where).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  });

  query = query.order('sort_order', { ascending: true });

  const { data: pages, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch CMS pages: ${error.message}`);
  }

  // Load translations for each page
  for (const page of pages || []) {
    const { data: translations, error: transError } = await tenantDb
      .from('cms_page_translations')
      .select('*')
      .eq('cms_page_id', page.id);

    if (transError) {
      console.error(`Error loading translations for page ${page.id}:`, transError);
      page.translations = {};
      continue;
    }

    page.translations = {};
    (translations || []).forEach(t => {
      page.translations[t.language_code] = {
        title: t.title,
        content: t.content,
        excerpt: t.excerpt
      };
    });
  }

  return pages || [];
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
  const { data: page, error } = await tenantDb
    .from('cms_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !page) return null;

  // Get all translations
  const { data: translations, error: transError } = await tenantDb
    .from('cms_page_translations')
    .select('*')
    .eq('cms_page_id', id);

  if (transError) {
    console.error(`Error loading translations for page ${id}:`, transError);
    page.translations = {};
    return page;
  }

  page.translations = {};
  (translations || []).forEach(t => {
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

    // Upsert translation record
    const { error } = await tenantDb
      .from('cms_page_translations')
      .upsert({
        cms_page_id: pageId,
        language_code: langCode,
        title: title || null,
        content: content || null,
        excerpt: excerpt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cms_page_id,language_code'
      });

    if (error) {
      console.error(`Error saving page translation for ${langCode}:`, error);
    }
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
