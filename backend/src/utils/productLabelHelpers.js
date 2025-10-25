/**
 * Product Label Helpers for Normalized Translations
 *
 * These helpers construct the same JSON format that the frontend expects
 * from normalized translation tables.
 */

const { sequelize } = require('../database/connection');

/**
 * Get product labels with translations from normalized tables
 *
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} Product labels with translated fields
 */
async function getProductLabelsWithTranslations(where = {}, lang = 'en') {
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `pl.${key} = ${value}`;
      }
      return `pl.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      pl.id,
      pl.store_id,
      pl.slug,
      pl.background_color,
      pl.color,
      pl.position,
      pl.priority,
      pl.sort_order,
      pl.is_active,
      pl.conditions,
      pl.created_at,
      pl.updated_at,
      COALESCE(plt.name, pl.name) as name,
      COALESCE(plt.text, pl.text) as text
    FROM product_labels pl
    LEFT JOIN product_label_translations plt ON pl.id = plt.product_label_id AND plt.language_code = :lang
    ${whereClause}
    ORDER BY pl.sort_order ASC, pl.priority DESC, pl.name ASC
  `;

  console.log('🔍 SQL Query for product labels:', query.replace(/\s+/g, ' '));
  console.log('🔍 Language parameter:', lang);

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  console.log('✅ Query returned', results.length, 'labels');
  if (results.length > 0) {
    console.log('📝 Sample label:', JSON.stringify(results[0], null, 2));
  }

  return results;
}

/**
 * Get single product label with translations
 *
 * @param {string} id - Product label ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Product label with translated fields
 */
async function getProductLabelById(id, lang = 'en') {
  const query = `
    SELECT
      pl.id,
      pl.store_id,
      pl.slug,
      pl.background_color,
      pl.color,
      pl.position,
      pl.priority,
      pl.sort_order,
      pl.is_active,
      pl.conditions,
      pl.created_at,
      pl.updated_at,
      COALESCE(plt.name, pl.name) as name,
      COALESCE(plt.text, pl.text) as text
    FROM product_labels pl
    LEFT JOIN product_label_translations plt ON pl.id = plt.product_label_id AND plt.language_code = :lang
    WHERE pl.id = :id
  `;

  const results = await sequelize.query(query, {
    replacements: { id, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

/**
 * Create product label with translations
 *
 * @param {Object} labelData - Product label data (without translations)
 * @param {Object} translations - Translations object { en: {name, text}, nl: {name, text} }
 * @returns {Promise<Object>} Created product label with translations
 */
async function createProductLabelWithTranslations(labelData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Insert product label
    const [label] = await sequelize.query(`
      INSERT INTO product_labels (
        id, store_id, name, slug, text, background_color, color,
        position, priority, sort_order, is_active, conditions,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        :store_id,
        :name,
        :slug,
        :text,
        :background_color,
        :color,
        :position,
        :priority,
        :sort_order,
        :is_active,
        :conditions,
        NOW(),
        NOW()
      )
      RETURNING *
    `, {
      replacements: {
        store_id: labelData.store_id,
        name: labelData.name || '',
        slug: labelData.slug,
        text: labelData.text || '',
        background_color: labelData.background_color,
        color: labelData.color,
        position: labelData.position || 'top-right',
        priority: labelData.priority || 0,
        sort_order: labelData.sort_order || 0,
        is_active: labelData.is_active !== false,
        conditions: JSON.stringify(labelData.conditions || {})
      },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    // Insert translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name || data.text)) {
        await sequelize.query(`
          INSERT INTO product_label_translations (
            product_label_id, language_code, name, text, created_at, updated_at
          ) VALUES (
            :label_id, :lang_code, :name, :text, NOW(), NOW()
          )
          ON CONFLICT (product_label_id, language_code) DO UPDATE
          SET name = EXCLUDED.name, text = EXCLUDED.text, updated_at = NOW()
        `, {
          replacements: {
            label_id: label.id,
            lang_code: langCode,
            name: data.name ?? null,
            text: data.text ?? null
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the created label with translations
    return await getProductLabelById(label.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Update product label with translations
 *
 * @param {string} id - Product label ID
 * @param {Object} labelData - Product label data (without translations)
 * @param {Object} translations - Translations object { en: {name, text}, nl: {name, text} }
 * @returns {Promise<Object>} Updated product label with translations
 */
async function updateProductLabelWithTranslations(id, labelData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Build update fields
    const updateFields = [];
    const replacements = { id };

    if (labelData.name !== undefined) {
      updateFields.push('name = :name');
      replacements.name = labelData.name;
    }
    if (labelData.slug !== undefined) {
      updateFields.push('slug = :slug');
      replacements.slug = labelData.slug;
    }
    if (labelData.text !== undefined) {
      updateFields.push('text = :text');
      replacements.text = labelData.text;
    }
    if (labelData.background_color !== undefined) {
      updateFields.push('background_color = :background_color');
      replacements.background_color = labelData.background_color;
    }
    if (labelData.color !== undefined) {
      updateFields.push('color = :color');
      replacements.color = labelData.color;
    }
    if (labelData.position !== undefined) {
      updateFields.push('position = :position');
      replacements.position = labelData.position;
    }
    if (labelData.priority !== undefined) {
      updateFields.push('priority = :priority');
      replacements.priority = labelData.priority;
    }
    if (labelData.sort_order !== undefined) {
      updateFields.push('sort_order = :sort_order');
      replacements.sort_order = labelData.sort_order;
    }
    if (labelData.is_active !== undefined) {
      updateFields.push('is_active = :is_active');
      replacements.is_active = labelData.is_active;
    }
    if (labelData.conditions !== undefined) {
      updateFields.push('conditions = :conditions');
      replacements.conditions = JSON.stringify(labelData.conditions);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');

      await sequelize.query(`
        UPDATE product_labels
        SET ${updateFields.join(', ')}
        WHERE id = :id
      `, {
        replacements,
        transaction
      });
    }

    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name !== undefined || data.text !== undefined)) {
        await sequelize.query(`
          INSERT INTO product_label_translations (
            product_label_id, language_code, name, text, created_at, updated_at
          ) VALUES (
            :label_id, :lang_code, :name, :text, NOW(), NOW()
          )
          ON CONFLICT (product_label_id, language_code) DO UPDATE
          SET
            name = COALESCE(EXCLUDED.name, product_label_translations.name),
            text = COALESCE(EXCLUDED.text, product_label_translations.text),
            updated_at = NOW()
        `, {
          replacements: {
            label_id: id,
            lang_code: langCode,
            name: data.name ?? null,
            text: data.text ?? null
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the updated label with translations
    return await getProductLabelById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Delete product label (translations are CASCADE deleted)
 *
 * @param {string} id - Product label ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteProductLabel(id) {
  await sequelize.query(`
    DELETE FROM product_labels WHERE id = :id
  `, {
    replacements: { id },
    type: sequelize.QueryTypes.DELETE
  });

  return true;
}

module.exports = {
  getProductLabelsWithTranslations,
  getProductLabelById,
  createProductLabelWithTranslations,
  updateProductLabelWithTranslations,
  deleteProductLabel
};
