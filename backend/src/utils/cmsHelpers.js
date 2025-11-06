/**
 * CMS Helpers for Normalized Translations
 *
 * These helpers fetch translations from normalized cms_page_translations
 * and cms_block_translations tables.
 */

const { sequelize } = require('../database/connection');

/**
 * Get CMS pages with translations
 *
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} CMS pages with translated fields
 */
async function getCMSPagesWithTranslations(where = {}, lang = 'en') {

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
      pt.title as pt_title,
      pt_en.title as pt_en_title,
      pt.content as pt_content,
      pt_en.content as pt_en_content,
      COALESCE(pt.title, pt_en.title, p.slug) as title,
      COALESCE(pt.content, pt_en.content) as content
    FROM cms_pages p
    LEFT JOIN cms_page_translations pt
      ON p.id = pt.cms_page_id AND pt.language_code = :lang
    LEFT JOIN cms_page_translations pt_en
      ON p.id = pt_en.cms_page_id AND pt_en.language_code = 'en'
    ${whereClause}
    ORDER BY p.sort_order ASC, p.created_at DESC
  `;

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results;
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
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} CMS blocks with translated fields
 */
async function getCMSBlocksWithTranslations(where = {}, lang = 'en') {

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
      bt.title as bt_title,
      bt_en.title as bt_en_title,
      bt.content as bt_content,
      bt_en.content as bt_en_content,
      COALESCE(bt.title, bt_en.title, b.identifier) as title,
      COALESCE(bt.content, bt_en.content) as content
    FROM cms_blocks b
    LEFT JOIN cms_block_translations bt
      ON b.id = bt.cms_block_id AND bt.language_code = :lang
    LEFT JOIN cms_block_translations bt_en
      ON b.id = bt_en.cms_block_id AND bt_en.language_code = 'en'
    ${whereClause}
    ORDER BY b.sort_order ASC, b.created_at DESC
  `;

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results;
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
