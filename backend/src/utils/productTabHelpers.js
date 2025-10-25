/**
 * Product Tab Helpers for Normalized Translations
 *
 * These helpers construct the same JSON format that the frontend expects
 * from normalized translation tables.
 */

const { sequelize } = require('../database/connection');

/**
 * Get product tabs with translations from normalized tables
 *
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} Product tabs with translated fields
 */
async function getProductTabsWithTranslations(where = {}, lang = 'en') {
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `pt.${key} = ${value}`;
      }
      return `pt.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      pt.id,
      pt.store_id,
      pt.slug,
      pt.tab_type,
      pt.attribute_ids,
      pt.attribute_set_ids,
      pt.sort_order,
      pt.is_active,
      pt.created_at,
      pt.updated_at,
      COALESCE(ptt.name, pt.name) as name,
      COALESCE(ptt.content, pt.content) as content
    FROM product_tabs pt
    LEFT JOIN product_tab_translations ptt ON pt.id = ptt.product_tab_id AND ptt.language_code = :lang
    ${whereClause}
    ORDER BY pt.sort_order ASC, pt.name ASC
  `;

  console.log('🔍 SQL Query for product tabs:', query.replace(/\s+/g, ' '));
  console.log('🔍 Language parameter:', lang);

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  console.log('✅ Query returned', results.length, 'tabs');
  if (results.length > 0) {
    console.log('📝 Sample tab:', JSON.stringify(results[0], null, 2));
  }

  return results;
}

/**
 * Get single product tab with translations
 *
 * @param {string} id - Product tab ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Product tab with translated fields
 */
async function getProductTabById(id, lang = 'en') {
  const query = `
    SELECT
      pt.id,
      pt.store_id,
      pt.slug,
      pt.tab_type,
      pt.attribute_ids,
      pt.attribute_set_ids,
      pt.sort_order,
      pt.is_active,
      pt.created_at,
      pt.updated_at,
      COALESCE(ptt.name, pt.name) as name,
      COALESCE(ptt.content, pt.content) as content
    FROM product_tabs pt
    LEFT JOIN product_tab_translations ptt ON pt.id = ptt.product_tab_id AND ptt.language_code = :lang
    WHERE pt.id = :id
  `;

  const results = await sequelize.query(query, {
    replacements: { id, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

/**
 * Get single product tab with ALL translations
 * Returns format: { id, name, ..., translations: {en: {name, content}, nl: {...}} }
 *
 * @param {string} id - Product tab ID
 * @returns {Promise<Object|null>} Product tab with all translations
 */
async function getProductTabWithAllTranslations(id) {
  const query = `
    SELECT
      pt.id,
      pt.store_id,
      pt.name,
      pt.slug,
      pt.tab_type,
      pt.content,
      pt.attribute_ids,
      pt.attribute_set_ids,
      pt.sort_order,
      pt.is_active,
      pt.created_at,
      pt.updated_at,
      COALESCE(
        json_object_agg(
          t.language_code,
          json_build_object('name', t.name, 'content', t.content)
        ) FILTER (WHERE t.language_code IS NOT NULL),
        '{}'::json
      ) as translations
    FROM product_tabs pt
    LEFT JOIN product_tab_translations t ON pt.id = t.product_tab_id
    WHERE pt.id = :id
    GROUP BY pt.id
  `;

  console.log('🔍 Backend: Querying product tab with all translations for ID:', id);

  const results = await sequelize.query(query, {
    replacements: { id },
    type: sequelize.QueryTypes.SELECT
  });

  console.log('🔍 Backend: Query result:', {
    hasResults: !!results[0],
    translations: results[0]?.translations,
    translationType: typeof results[0]?.translations,
    translationKeys: Object.keys(results[0]?.translations || {}),
    enTranslation: results[0]?.translations?.en,
    nlTranslation: results[0]?.translations?.nl
  });

  return results[0] || null;
}

/**
 * Create product tab with translations
 *
 * @param {Object} tabData - Product tab data (without translations)
 * @param {Object} translations - Translations object { en: {name, content}, nl: {name, content} }
 * @returns {Promise<Object>} Created product tab with translations
 */
async function createProductTabWithTranslations(tabData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Insert product tab
    const [tab] = await sequelize.query(`
      INSERT INTO product_tabs (
        id, store_id, name, slug, tab_type, content, attribute_ids,
        attribute_set_ids, sort_order, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        :store_id,
        :name,
        :slug,
        :tab_type,
        :content,
        :attribute_ids,
        :attribute_set_ids,
        :sort_order,
        :is_active,
        NOW(),
        NOW()
      )
      RETURNING *
    `, {
      replacements: {
        store_id: tabData.store_id,
        name: tabData.name || '',
        slug: tabData.slug,
        tab_type: tabData.tab_type || 'text',
        content: tabData.content || '',
        attribute_ids: JSON.stringify(tabData.attribute_ids || []),
        attribute_set_ids: JSON.stringify(tabData.attribute_set_ids || []),
        sort_order: tabData.sort_order || 0,
        is_active: tabData.is_active !== false
      },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    // Insert translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name || data.content)) {
        await sequelize.query(`
          INSERT INTO product_tab_translations (
            product_tab_id, language_code, name, content, created_at, updated_at
          ) VALUES (
            :tab_id, :lang_code, :name, :content, NOW(), NOW()
          )
          ON CONFLICT (product_tab_id, language_code) DO UPDATE
          SET name = EXCLUDED.name, content = EXCLUDED.content, updated_at = NOW()
        `, {
          replacements: {
            tab_id: tab.id,
            lang_code: langCode,
            name: data.name || '',
            content: data.content || ''
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the created tab with all translations
    return await getProductTabWithAllTranslations(tab.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Update product tab with translations
 *
 * @param {string} id - Product tab ID
 * @param {Object} tabData - Product tab data (without translations)
 * @param {Object} translations - Translations object { en: {name, content}, nl: {name, content} }
 * @returns {Promise<Object>} Updated product tab with translations
 */
async function updateProductTabWithTranslations(id, tabData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Build update fields
    const updateFields = [];
    const replacements = { id };

    if (tabData.name !== undefined) {
      updateFields.push('name = :name');
      replacements.name = tabData.name;
    }
    if (tabData.slug !== undefined) {
      updateFields.push('slug = :slug');
      replacements.slug = tabData.slug;
    }
    if (tabData.tab_type !== undefined) {
      updateFields.push('tab_type = :tab_type');
      replacements.tab_type = tabData.tab_type;
    }
    if (tabData.content !== undefined) {
      updateFields.push('content = :content');
      replacements.content = tabData.content;
    }
    if (tabData.attribute_ids !== undefined) {
      updateFields.push('attribute_ids = :attribute_ids');
      replacements.attribute_ids = JSON.stringify(tabData.attribute_ids);
    }
    if (tabData.attribute_set_ids !== undefined) {
      updateFields.push('attribute_set_ids = :attribute_set_ids');
      replacements.attribute_set_ids = JSON.stringify(tabData.attribute_set_ids);
    }
    if (tabData.sort_order !== undefined) {
      updateFields.push('sort_order = :sort_order');
      replacements.sort_order = tabData.sort_order;
    }
    if (tabData.is_active !== undefined) {
      updateFields.push('is_active = :is_active');
      replacements.is_active = tabData.is_active;
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');

      await sequelize.query(`
        UPDATE product_tabs
        SET ${updateFields.join(', ')}
        WHERE id = :id
      `, {
        replacements,
        transaction
      });
    }

    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name !== undefined || data.content !== undefined)) {
        await sequelize.query(`
          INSERT INTO product_tab_translations (
            product_tab_id, language_code, name, content, created_at, updated_at
          ) VALUES (
            :tab_id, :lang_code, :name, :content, NOW(), NOW()
          )
          ON CONFLICT (product_tab_id, language_code) DO UPDATE
          SET
            name = COALESCE(EXCLUDED.name, product_tab_translations.name),
            content = COALESCE(EXCLUDED.content, product_tab_translations.content),
            updated_at = NOW()
        `, {
          replacements: {
            tab_id: id,
            lang_code: langCode,
            name: data.name,
            content: data.content
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the updated tab with all translations
    return await getProductTabWithAllTranslations(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Delete product tab (translations are CASCADE deleted)
 *
 * @param {string} id - Product tab ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteProductTab(id) {
  await sequelize.query(`
    DELETE FROM product_tabs WHERE id = :id
  `, {
    replacements: { id },
    type: sequelize.QueryTypes.DELETE
  });

  return true;
}

module.exports = {
  getProductTabsWithTranslations,
  getProductTabById,
  getProductTabWithAllTranslations,
  createProductTabWithTranslations,
  updateProductTabWithTranslations,
  deleteProductTab
};
