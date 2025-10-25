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
  console.log('🔍 [CMS Helper] getCMSPagesWithTranslations called with:', { where, lang });

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
      p.sort_order,
      p.seo,
      p.store_id,
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

  console.log('📋 [CMS Helper] Executing SQL with lang:', lang);

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  console.log(`📦 [CMS Helper] Query returned ${results.length} pages`);

  if (results.length > 0) {
    console.log('📝 [CMS Helper] First page debug:', {
      slug: results[0].slug,
      pt_title: results[0].pt_title,
      pt_en_title: results[0].pt_en_title,
      final_title: results[0].title,
      has_pt_content: !!results[0].pt_content,
      has_pt_en_content: !!results[0].pt_en_content,
      has_final_content: !!results[0].content,
      lang: lang
    });
  }

  // Remove debug fields before returning
  const cleanResults = results.map(({ pt_title, pt_en_title, pt_content, pt_en_content, ...rest }) => rest);

  return cleanResults;
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
      p.sort_order,
      p.seo,
      p.store_id,
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
  console.log('🔍 [CMS Helper] getCMSBlocksWithTranslations called with:', { where, lang });

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

  console.log('📋 [CMS Helper] Executing SQL with lang:', lang);

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  console.log(`📦 [CMS Helper] Query returned ${results.length} blocks`);

  if (results.length > 0) {
    console.log('📝 [CMS Helper] First block debug:', {
      identifier: results[0].identifier,
      bt_title: results[0].bt_title,
      bt_en_title: results[0].bt_en_title,
      final_title: results[0].title,
      has_bt_content: !!results[0].bt_content,
      has_bt_en_content: !!results[0].bt_en_content,
      has_final_content: !!results[0].content,
      lang: lang
    });
  }

  // Remove debug fields before returning
  const cleanResults = results.map(({ bt_title, bt_en_title, bt_content, bt_en_content, ...rest }) => rest);

  return cleanResults;
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

module.exports = {
  getCMSPagesWithTranslations,
  getCMSPageById,
  getCMSBlocksWithTranslations,
  getCMSBlockById
};
