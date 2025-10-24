/**
 * Category Settings Helpers for Normalized Translations
 *
 * These helpers construct the same format that the frontend expects
 * from normalized translation tables.
 */

const { sequelize } = require('../database/connection');

/**
 * Get categories with translations from normalized tables
 *
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} Categories with translated fields
 */
async function getCategoriesWithTranslations(where = {}, lang = 'en') {
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `c.${key} = ${value}`;
      }
      if (Array.isArray(value)) {
        // Handle Op.in case
        return `c.${key} IN (${value.map(v => `'${v}'`).join(', ')})`;
      }
      return `c.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      c.id,
      c.slug,
      c.image_url,
      c.sort_order,
      c.is_active,
      c.hide_in_menu,
      c.seo,
      c.store_id,
      c.parent_id,
      c.level,
      c.path,
      c.product_count,
      c.created_at,
      c.updated_at,
      COALESCE(ct.name, c.translations->>'en.name') as name,
      COALESCE(ct.description, c.translations->>'en.description') as description
    FROM categories c
    LEFT JOIN category_translations ct
      ON c.id = ct.category_id AND ct.language_code = :lang
    ${whereClause}
    ORDER BY c.sort_order ASC, c.created_at DESC
  `;

  console.log('🔍 SQL Query for categories:', query.replace(/\s+/g, ' '));
  console.log('🔍 Language parameter:', lang);

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  console.log('✅ Query returned', results.length, 'categories');
  if (results.length > 0) {
    console.log('📝 Sample category:', JSON.stringify({
      id: results[0].id,
      name: results[0].name,
      description: results[0].description?.substring(0, 50) + '...'
    }, null, 2));
  }

  return results;
}

/**
 * Get single category with translations
 *
 * @param {string} id - Category ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Category with translated fields
 */
async function getCategoryById(id, lang = 'en') {
  const query = `
    SELECT
      c.id,
      c.slug,
      c.image_url,
      c.sort_order,
      c.is_active,
      c.hide_in_menu,
      c.seo,
      c.store_id,
      c.parent_id,
      c.level,
      c.path,
      c.product_count,
      c.created_at,
      c.updated_at,
      COALESCE(ct.name, c.translations->>'en.name') as name,
      COALESCE(ct.description, c.translations->>'en.description') as description
    FROM categories c
    LEFT JOIN category_translations ct
      ON c.id = ct.category_id AND ct.language_code = :lang
    WHERE c.id = :id
  `;

  const results = await sequelize.query(query, {
    replacements: { id, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

/**
 * Create category with translations
 *
 * @param {Object} categoryData - Category data (without translations)
 * @param {Object} translations - Translations object { en: {...}, nl: {...} }
 * @returns {Promise<Object>} Created category with translations
 */
async function createCategoryWithTranslations(categoryData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Insert category
    const [category] = await sequelize.query(`
      INSERT INTO categories (
        id, slug, image_url, sort_order, is_active, hide_in_menu, seo,
        store_id, parent_id, level, path, product_count, translations,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        :slug, :image_url, :sort_order, :is_active, :hide_in_menu, :seo,
        :store_id, :parent_id, :level, :path, :product_count, :translations,
        NOW(), NOW()
      )
      RETURNING *
    `, {
      replacements: {
        slug: categoryData.slug,
        image_url: categoryData.image_url || null,
        sort_order: categoryData.sort_order || 0,
        is_active: categoryData.is_active !== false,
        hide_in_menu: categoryData.hide_in_menu || false,
        seo: JSON.stringify(categoryData.seo || {}),
        store_id: categoryData.store_id,
        parent_id: categoryData.parent_id || null,
        level: categoryData.level || 0,
        path: categoryData.path || null,
        product_count: categoryData.product_count || 0,
        translations: JSON.stringify(categoryData.translations || {})
      },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    // Insert translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        await sequelize.query(`
          INSERT INTO category_translations (
            category_id, language_code, name, description,
            created_at, updated_at
          ) VALUES (
            :category_id, :lang_code, :name, :description,
            NOW(), NOW()
          )
          ON CONFLICT (category_id, language_code) DO UPDATE
          SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = NOW()
        `, {
          replacements: {
            category_id: category.id,
            lang_code: langCode,
            name: data.name || null,
            description: data.description || null
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the created category with translations
    return await getCategoryById(category.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Update category with translations
 *
 * @param {string} id - Category ID
 * @param {Object} categoryData - Category data (without translations)
 * @param {Object} translations - Translations object { en: {...}, nl: {...} }
 * @returns {Promise<Object>} Updated category with translations
 */
async function updateCategoryWithTranslations(id, categoryData, translations = {}) {
  const transaction = await sequelize.transaction();

  try {
    // Build update fields
    const updateFields = [];
    const replacements = { id };

    // Add all possible fields
    const fieldMappings = {
      slug: 'slug',
      image_url: 'image_url',
      sort_order: 'sort_order',
      is_active: 'is_active',
      hide_in_menu: 'hide_in_menu',
      parent_id: 'parent_id',
      level: 'level',
      path: 'path',
      product_count: 'product_count'
    };

    Object.entries(fieldMappings).forEach(([key, field]) => {
      if (categoryData[key] !== undefined) {
        updateFields.push(`${field} = :${key}`);
        replacements[key] = categoryData[key];
      }
    });

    // Handle JSON fields separately
    if (categoryData.seo !== undefined) {
      updateFields.push('seo = :seo');
      replacements.seo = JSON.stringify(categoryData.seo);
    }
    if (categoryData.translations !== undefined) {
      updateFields.push('translations = :translations');
      replacements.translations = JSON.stringify(categoryData.translations);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');

      await sequelize.query(`
        UPDATE categories
        SET ${updateFields.join(', ')}
        WHERE id = :id
      `, {
        replacements,
        transaction
      });
    }

    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        await sequelize.query(`
          INSERT INTO category_translations (
            category_id, language_code, name, description,
            created_at, updated_at
          ) VALUES (
            :category_id, :lang_code, :name, :description,
            NOW(), NOW()
          )
          ON CONFLICT (category_id, language_code) DO UPDATE
          SET
            name = COALESCE(EXCLUDED.name, category_translations.name),
            description = COALESCE(EXCLUDED.description, category_translations.description),
            updated_at = NOW()
        `, {
          replacements: {
            category_id: id,
            lang_code: langCode,
            name: data.name,
            description: data.description
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the updated category with translations
    return await getCategoryById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Delete category (translations are CASCADE deleted)
 *
 * @param {string} id - Category ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteCategory(id) {
  await sequelize.query(`
    DELETE FROM categories WHERE id = :id
  `, {
    replacements: { id },
    type: sequelize.QueryTypes.DELETE
  });

  return true;
}

module.exports = {
  getCategoriesWithTranslations,
  getCategoryById,
  createCategoryWithTranslations,
  updateCategoryWithTranslations,
  deleteCategory
};
