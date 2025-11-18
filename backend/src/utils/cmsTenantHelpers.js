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

  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `b.${key} = ${value}`;
      }
      if (Array.isArray(value)) {
        return `b.${key} IN (${value.map(v => `'${v}'`).join(', ')})`;
      }
      return `b.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      b.id,
      b.identifier,
      b.is_active,
      b.placement,
      b.sort_order,
      b.store_id,
      b.created_at,
      b.updated_at,
      json_object_agg(
        COALESCE(bt.language_code, 'en'),
        json_build_object(
          'title', bt.title,
          'content', bt.content
        )
      ) FILTER (WHERE bt.language_code IS NOT NULL) as translations
    FROM cms_blocks b
    LEFT JOIN cms_block_translations bt ON b.id = bt.cms_block_id
    ${whereClause}
    GROUP BY b.id
    ORDER BY b.sort_order ASC, b.created_at DESC
  `;

  const { data, error } = await tenantDb.rpc('exec_sql', { sql_query: query });

  if (error) {
    // Fallback to direct query if RPC is not available
    const results = await tenantDb
      .from('cms_blocks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (results.error) throw results.error;

    // Load translations separately
    const blocks = results.data || [];
    for (const block of blocks) {
      const { data: translations } = await tenantDb
        .from('cms_block_translations')
        .select('*')
        .eq('cms_block_id', block.id);

      block.translations = {};
      if (translations) {
        translations.forEach(t => {
          block.translations[t.language_code] = {
            title: t.title,
            content: t.content
          };
        });
      }
    }

    return blocks;
  }

  // Ensure translations object exists even if empty
  return (data || []).map(block => ({
    ...block,
    translations: block.translations || {}
  }));
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
  const { data: block, error: blockError } = await tenantDb
    .from('cms_blocks')
    .select('*')
    .eq('id', id)
    .single();

  if (blockError || !block) return null;

  // Get all translations
  const { data: translations } = await tenantDb
    .from('cms_block_translations')
    .select('*')
    .eq('cms_block_id', id);

  block.translations = {};
  if (translations) {
    translations.forEach(t => {
      block.translations[t.language_code] = {
        title: t.title,
        content: t.content
      };
    });
  }

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

  const { data: pages, error } = await query.order('sort_order', { ascending: true });

  if (error) throw error;

  // Load translations for each page
  for (const page of pages || []) {
    const { data: translations } = await tenantDb
      .from('cms_page_translations')
      .select('*')
      .eq('cms_page_id', page.id);

    page.translations = {};
    if (translations) {
      translations.forEach(t => {
        page.translations[t.language_code] = {
          title: t.title,
          content: t.content,
          excerpt: t.excerpt
        };
      });
    }
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
  const { data: page, error: pageError } = await tenantDb
    .from('cms_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (pageError || !page) return null;

  // Get all translations
  const { data: translations } = await tenantDb
    .from('cms_page_translations')
    .select('*')
    .eq('cms_page_id', id);

  page.translations = {};
  if (translations) {
    translations.forEach(t => {
      page.translations[t.language_code] = {
        title: t.title,
        content: t.content,
        excerpt: t.excerpt
      };
    });
  }

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
