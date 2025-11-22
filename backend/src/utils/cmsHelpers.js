/**
 * CMS Helpers for Normalized Translations
 *
 * These helpers fetch translations from normalized cms_page_translations
 * and cms_block_translations tables using Supabase.
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get CMS pages with translations
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} CMS pages with translated fields
 */
async function getCMSPagesWithTranslations(storeId, where = {}, lang = 'en') {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  console.log('🔍 getCMSPagesWithTranslations called with:', { storeId, where, lang });

  // Fetch cms_pages
  let pagesQuery = tenantDb.from('cms_pages').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    console.log(`  📌 Adding where condition: ${key} = ${value}`);
    pagesQuery = pagesQuery.eq(key, value);
  }

  pagesQuery = pagesQuery.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

  const { data: pages, error: pagesError } = await pagesQuery;

  console.log('📊 Query result:', { pageCount: pages?.length || 0, hasError: !!pagesError });

  if (pagesError) {
    console.error('Error fetching cms_pages:', pagesError);
    throw pagesError;
  }

  if (!pages || pages.length === 0) {
    return [];
  }

  // Fetch translations
  const pageIds = pages.map(p => p.id);
  const { data: translations, error: transError } = await tenantDb
    .from('cms_page_translations')
    .select('*')
    .in('cms_page_id', pageIds)
    .in('language_code', [lang, 'en']);

  if (transError) {
    console.error('Error fetching cms_page_translations:', transError);
    throw transError;
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    if (!transMap[t.cms_page_id]) transMap[t.cms_page_id] = {};
    transMap[t.cms_page_id][t.language_code] = t;
  });

  // Merge pages with translations
  return pages.map(page => {
    const trans = transMap[page.id];
    const reqLang = trans?.[lang];
    const enLang = trans?.['en'];

    return {
      ...page,
      title: reqLang?.title || enLang?.title || page.slug,
      content: reqLang?.content || enLang?.content || null,
      excerpt: reqLang?.excerpt || enLang?.excerpt || null
    };
  });
}

/**
 * Get single CMS page with translations
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Page ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} CMS page with translated fields
 */
async function getCMSPageById(storeId, id, lang = 'en') {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch the page
  const { data: page, error: pageError } = await tenantDb
    .from('cms_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (pageError || !page) {
    return null;
  }

  // Fetch translations
  const { data: translations, error: transError } = await tenantDb
    .from('cms_page_translations')
    .select('*')
    .eq('cms_page_id', id)
    .in('language_code', [lang, 'en']);

  if (transError) {
    console.error('Error fetching cms_page_translations:', transError);
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    transMap[t.language_code] = t;
  });

  const reqLang = transMap[lang];
  const enLang = transMap['en'];

  return {
    ...page,
    title: reqLang?.title || enLang?.title || page.slug,
    content: reqLang?.content || enLang?.content || null,
    excerpt: reqLang?.excerpt || enLang?.excerpt || null
  };
}

/**
 * Get CMS blocks with translations
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} CMS blocks with translated fields
 */
async function getCMSBlocksWithTranslations(storeId, where = {}, lang = 'en') {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch cms_blocks
  let blocksQuery = tenantDb.from('cms_blocks').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    blocksQuery = blocksQuery.eq(key, value);
  }

  blocksQuery = blocksQuery.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

  const { data: blocks, error: blocksError } = await blocksQuery;

  if (blocksError) {
    console.error('Error fetching cms_blocks:', blocksError);
    throw blocksError;
  }

  if (!blocks || blocks.length === 0) {
    return [];
  }

  // Fetch translations
  const blockIds = blocks.map(b => b.id);
  const { data: translations, error: transError } = await tenantDb
    .from('cms_block_translations')
    .select('*')
    .in('cms_block_id', blockIds)
    .in('language_code', [lang, 'en']);

  if (transError) {
    console.error('Error fetching cms_block_translations:', transError);
    throw transError;
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    if (!transMap[t.cms_block_id]) transMap[t.cms_block_id] = {};
    transMap[t.cms_block_id][t.language_code] = t;
  });

  // Merge blocks with translations
  return blocks.map(block => {
    const trans = transMap[block.id];
    const reqLang = trans?.[lang];
    const enLang = trans?.['en'];

    return {
      ...block,
      title: reqLang?.title || enLang?.title || block.identifier,
      content: reqLang?.content || enLang?.content || null
    };
  });
}

/**
 * Get single CMS block with translations
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Block ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} CMS block with translated fields
 */
async function getCMSBlockById(storeId, id, lang = 'en') {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch the block
  const { data: block, error: blockError } = await tenantDb
    .from('cms_blocks')
    .select('*')
    .eq('id', id)
    .single();

  if (blockError || !block) {
    return null;
  }

  // Fetch translations
  const { data: translations, error: transError } = await tenantDb
    .from('cms_block_translations')
    .select('*')
    .eq('cms_block_id', id)
    .in('language_code', [lang, 'en']);

  if (transError) {
    console.error('Error fetching cms_block_translations:', transError);
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    transMap[t.language_code] = t;
  });

  const reqLang = transMap[lang];
  const enLang = transMap['en'];

  return {
    ...block,
    title: reqLang?.title || enLang?.title || block.identifier,
    content: reqLang?.content || enLang?.content || null
  };
}

/**
 * Get CMS page with ALL translations (for admin editing)
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Page ID
 * @returns {Promise<Object|null>} CMS page with all translations
 */
async function getCMSPageWithAllTranslations(storeId, id) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch the page
  const { data: page, error: pageError } = await tenantDb
    .from('cms_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (pageError || !page) {
    return null;
  }

  // Fetch all translations
  const { data: translations, error: transError } = await tenantDb
    .from('cms_page_translations')
    .select('*')
    .eq('cms_page_id', id);

  if (transError) {
    console.error('Error fetching cms_page_translations:', transError);
  }

  // Build translations object
  const translationsObj = {};
  (translations || []).forEach(t => {
    translationsObj[t.language_code] = {
      title: t.title,
      content: t.content,
      excerpt: t.excerpt
    };
  });

  return {
    ...page,
    translations: translationsObj
  };
}

/**
 * Get CMS pages with ALL translations (for admin listing)
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<Array>} CMS pages with all translations
 */
async function getCMSPagesWithAllTranslations(storeId, where = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch cms_pages
  let pagesQuery = tenantDb.from('cms_pages').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      pagesQuery = pagesQuery.in(key, value);
    } else {
      pagesQuery = pagesQuery.eq(key, value);
    }
  }

  pagesQuery = pagesQuery.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

  const { data: pages, error: pagesError } = await pagesQuery;

  if (pagesError) {
    console.error('Error fetching cms_pages:', pagesError);
    throw pagesError;
  }

  if (!pages || pages.length === 0) {
    return [];
  }

  // Fetch all translations for these pages
  const pageIds = pages.map(p => p.id);
  const { data: translations, error: transError } = await tenantDb
    .from('cms_page_translations')
    .select('*')
    .in('cms_page_id', pageIds);

  if (transError) {
    console.error('Error fetching cms_page_translations:', transError);
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    if (!transMap[t.cms_page_id]) transMap[t.cms_page_id] = {};
    transMap[t.cms_page_id][t.language_code] = {
      title: t.title,
      content: t.content,
      excerpt: t.excerpt
    };
  });

  // Merge pages with translations
  return pages.map(page => ({
    ...page,
    translations: transMap[page.id] || {}
  }));
}

/**
 * Get CMS block with ALL translations (for admin editing)
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Block ID
 * @returns {Promise<Object|null>} CMS block with all translations
 */
async function getCMSBlockWithAllTranslations(storeId, id) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch the block
  const { data: block, error: blockError } = await tenantDb
    .from('cms_blocks')
    .select('*')
    .eq('id', id)
    .single();

  if (blockError || !block) {
    return null;
  }

  // Fetch all translations
  const { data: translations, error: transError } = await tenantDb
    .from('cms_block_translations')
    .select('*')
    .eq('cms_block_id', id);

  if (transError) {
    console.error('Error fetching cms_block_translations:', transError);
  }

  // Build translations object
  const translationsObj = {};
  (translations || []).forEach(t => {
    translationsObj[t.language_code] = {
      title: t.title,
      content: t.content
    };
  });

  return {
    ...block,
    translations: translationsObj
  };
}

/**
 * Get CMS blocks with ALL translations (for admin listing)
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<Array>} CMS blocks with all translations
 */
async function getCMSBlocksWithAllTranslations(storeId, where = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch cms_blocks
  let blocksQuery = tenantDb.from('cms_blocks').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      blocksQuery = blocksQuery.in(key, value);
    } else {
      blocksQuery = blocksQuery.eq(key, value);
    }
  }

  blocksQuery = blocksQuery.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

  const { data: blocks, error: blocksError } = await blocksQuery;

  if (blocksError) {
    console.error('Error fetching cms_blocks:', blocksError);
    throw blocksError;
  }

  if (!blocks || blocks.length === 0) {
    return [];
  }

  // Fetch all translations for these blocks
  const blockIds = blocks.map(b => b.id);
  const { data: translations, error: transError } = await tenantDb
    .from('cms_block_translations')
    .select('*')
    .in('cms_block_id', blockIds);

  if (transError) {
    console.error('Error fetching cms_block_translations:', transError);
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    if (!transMap[t.cms_block_id]) transMap[t.cms_block_id] = {};
    transMap[t.cms_block_id][t.language_code] = {
      title: t.title,
      content: t.content
    };
  });

  // Merge blocks with translations
  return blocks.map(block => ({
    ...block,
    translations: transMap[block.id] || {}
  }));
}

/**
 * Save CMS page translations
 *
 * @param {string} storeId - Store ID
 * @param {string} pageId - Page ID
 * @param {Object} translations - Translations object {en: {title, content}, nl: {title, content}}
 * @returns {Promise<void>}
 */
async function saveCMSPageTranslations(storeId, pageId, translations) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  if (!translations || typeof translations !== 'object') {
    return;
  }

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
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cms_page_id,language_code'
      });

    if (error) {
      console.error('Error upserting cms_page_translation:', error);
      throw error;
    }
  }
}

/**
 * Save CMS block translations
 *
 * @param {string} storeId - Store ID
 * @param {string} blockId - Block ID
 * @param {Object} translations - Translations object {en: {title, content}, nl: {title, content}}
 * @returns {Promise<void>}
 */
async function saveCMSBlockTranslations(storeId, blockId, translations) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  if (!translations || typeof translations !== 'object') {
    return;
  }

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
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cms_block_id,language_code'
      });

    if (error) {
      console.error('Error upserting cms_block_translation:', error);
      throw error;
    }
  }
}

module.exports = {
  getCMSPagesWithTranslations,
  getCMSPageById,
  getCMSBlocksWithTranslations,
  getCMSBlockById,
  getCMSPageWithAllTranslations,
  getCMSPagesWithAllTranslations,
  getCMSBlockWithAllTranslations,
  getCMSBlocksWithAllTranslations,
  saveCMSPageTranslations,
  saveCMSBlockTranslations
};
