/**
 * CMS Helpers for Normalized Translations
 *
 * ⚠️ PARTIALLY DEPRECATED: Some functions use deprecated Sequelize raw queries.
 *
 * CONVERTED FUNCTIONS (use tenantDb):
 * - getCMSPagesWithTranslations ✅
 * - getCMSBlocksWithTranslations ✅
 *
 * DEPRECATED FUNCTIONS (use raw Sequelize):
 * - getCMSPageById
 * - getCMSBlockById
 * - getCMSPageWithAllTranslations
 * - getCMSPagesWithAllTranslations
 * - getCMSBlockWithAllTranslations
 * - getCMSBlocksWithAllTranslations
 * - saveCMSPageTranslations
 * - saveCMSBlockTranslations
 *
 * MIGRATION PATH:
 * - Routes should use ConnectionManager.getStoreConnection(storeId) to get tenantDb
 * - Use getCMSPagesWithTranslations or getCMSBlocksWithTranslations (already converted)
 * - For other functions, implement directly using tenantDb query builder
 *
 * These helpers fetch translations from normalized cms_page_translations
 * and cms_block_translations tables.
 */

const ConnectionManager = require('../services/database/ConnectionManager');
const { sequelize } = require('../database/connection');

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

  // Fetch cms_pages
  let pagesQuery = tenantDb.from('cms_pages').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    pagesQuery = pagesQuery.eq(key, value);
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
 * @param {string} id - Page ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} CMS page with translated fields
 */
async function getCMSPageById(id, lang = 'en') {
  const query = `
    SELECT
      p.id,
      p.slug,
      p.is_active,
      p.is_system,
      p.sort_order,
      p.seo,
      p.store_id,
      p.related_product_ids,
      p.published_at,
      p.created_at,
      p.updated_at,
      COALESCE(pt.title, pt_en.title, p.slug) as title,
      COALESCE(pt.content, pt_en.content) as content
    FROM cms_pages p
    LEFT JOIN cms_page_translations pt
      ON p.id = pt.cms_page_id AND pt.language_code = :lang
    LEFT JOIN cms_page_translations pt_en
      ON p.id = pt_en.cms_page_id AND pt_en.language_code = 'en'
    WHERE p.id = :id
  `;

  const results = await sequelize.query(query, {
    replacements: { id, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
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
 * @param {string} id - Block ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} CMS block with translated fields
 */
async function getCMSBlockById(id, lang = 'en') {
  const query = `
    SELECT
      b.id,
      b.identifier,
      b.is_active,
      b.position,
      b.sort_order,
      b.store_id,
      b.created_at,
      b.updated_at,
      COALESCE(bt.title, bt_en.title, b.identifier) as title,
      COALESCE(bt.content, bt_en.content) as content
    FROM cms_blocks b
    LEFT JOIN cms_block_translations bt
      ON b.id = bt.cms_block_id AND bt.language_code = :lang
    LEFT JOIN cms_block_translations bt_en
      ON b.id = bt_en.cms_block_id AND bt_en.language_code = 'en'
    WHERE b.id = :id
  `;

  const results = await sequelize.query(query, {
    replacements: { id, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

/**
 * Get CMS page with ALL translations (for admin editing)
 *
 * @param {string} id - Page ID
 * @returns {Promise<Object|null>} CMS page with all translations
 */
async function getCMSPageWithAllTranslations(id) {
  const query = `
    SELECT
      p.id,
      p.slug,
      p.is_active,
      p.is_system,
      p.sort_order,
      p.seo,
      p.store_id,
      p.related_product_ids,
      p.published_at,
      p.created_at,
      p.updated_at,
      json_object_agg(
        COALESCE(pt.language_code, 'en'),
        json_build_object(
          'title', pt.title,
          'content', pt.content,
          'excerpt', pt.excerpt
        )
      ) FILTER (WHERE pt.language_code IS NOT NULL) as translations
    FROM cms_pages p
    LEFT JOIN cms_page_translations pt ON p.id = pt.cms_page_id
    WHERE p.id = :id
    GROUP BY p.id
  `;

  const results = await sequelize.query(query, {
    replacements: { id },
    type: sequelize.QueryTypes.SELECT
  });

  const page = results[0] || null;

  // Ensure translations object exists even if empty
  if (page && !page.translations) {
    page.translations = {};
  }

  return page;
}

/**
 * Get CMS pages with ALL translations (for admin listing)
 *
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<Array>} CMS pages with all translations
 */
async function getCMSPagesWithAllTranslations(where = {}) {
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `p.${key} = ${value}`;
      }
      if (Array.isArray(value)) {
        return `p.${key} IN (${value.map(v => `'${v}'`).join(', ')})`;
      }
      return `p.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      p.id,
      p.slug,
      p.is_active,
      p.is_system,
      p.sort_order,
      p.seo,
      p.store_id,
      p.related_product_ids,
      p.published_at,
      p.created_at,
      p.updated_at,
      json_object_agg(
        COALESCE(pt.language_code, 'en'),
        json_build_object(
          'title', pt.title,
          'content', pt.content,
          'excerpt', pt.excerpt
        )
      ) FILTER (WHERE pt.language_code IS NOT NULL) as translations
    FROM cms_pages p
    LEFT JOIN cms_page_translations pt ON p.id = pt.cms_page_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.sort_order ASC, p.created_at DESC
  `;

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  // Ensure translations object exists even if empty
  return results.map(page => ({
    ...page,
    translations: page.translations || {}
  }));
}

/**
 * Get CMS block with ALL translations (for admin editing)
 *
 * @param {string} id - Block ID
 * @returns {Promise<Object|null>} CMS block with all translations
 */
async function getCMSBlockWithAllTranslations(id) {
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
    WHERE b.id = :id
    GROUP BY b.id
  `;

  const results = await sequelize.query(query, {
    replacements: { id },
    type: sequelize.QueryTypes.SELECT
  });

  const block = results[0] || null;

  // Ensure translations object exists even if empty
  if (block && !block.translations) {
    block.translations = {};
  }

  return block;
}

/**
 * Get CMS blocks with ALL translations (for admin listing)
 *
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<Array>} CMS blocks with all translations
 */
async function getCMSBlocksWithAllTranslations(where = {}) {
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

  const results = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  // Ensure translations object exists even if empty
  return results.map(block => ({
    ...block,
    translations: block.translations || {}
  }));
}

/**
 * Save CMS page translations
 *
 * @param {string} pageId - Page ID
 * @param {Object} translations - Translations object {en: {title, content}, nl: {title, content}}
 * @returns {Promise<void>}
 */
async function saveCMSPageTranslations(pageId, translations) {
  if (!translations || typeof translations !== 'object') {
    return;
  }

  for (const [langCode, fields] of Object.entries(translations)) {
    if (!fields || typeof fields !== 'object') continue;

    const { title, content, excerpt } = fields;

    // Skip if all fields are empty
    if (!title && !content && !excerpt) continue;

    // Upsert translation record
    await sequelize.query(`
      INSERT INTO cms_page_translations (cms_page_id, language_code, title, content, excerpt, created_at, updated_at)
      VALUES (:pageId, :langCode, :title, :content, :excerpt, NOW(), NOW())
      ON CONFLICT (cms_page_id, language_code)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        updated_at = NOW()
    `, {
      replacements: {
        pageId,
        langCode,
        title: title || null,
        content: content || null,
        excerpt: excerpt || null
      }
    });
  }
}

/**
 * Save CMS block translations
 *
 * @param {string} blockId - Block ID
 * @param {Object} translations - Translations object {en: {title, content}, nl: {title, content}}
 * @returns {Promise<void>}
 */
async function saveCMSBlockTranslations(blockId, translations) {
  if (!translations || typeof translations !== 'object') {
    return;
  }

  for (const [langCode, fields] of Object.entries(translations)) {
    if (!fields || typeof fields !== 'object') continue;

    const { title, content } = fields;

    // Skip if all fields are empty
    if (!title && !content) continue;

    // Upsert translation record
    await sequelize.query(`
      INSERT INTO cms_block_translations (cms_block_id, language_code, title, content, created_at, updated_at)
      VALUES (:blockId, :langCode, :title, :content, NOW(), NOW())
      ON CONFLICT (cms_block_id, language_code)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        updated_at = NOW()
    `, {
      replacements: {
        blockId,
        langCode,
        title: title || null,
        content: content || null
      }
    });
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
