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
 * @param {Object} options - Query options { limit, offset, search }
 * @returns {Promise<Object>} { rows, count } - Categories with translated fields and total count
 */
async function getCategoriesWithTranslations(where = {}, lang = 'en', options = {}) {
  const { limit, offset, search } = options;

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

  const whereClauses = [];
  if (whereConditions) whereClauses.push(whereConditions);

  // Add search to SQL WHERE clause for better performance
  if (search) {
    whereClauses.push(`(
      ct.name ILIKE :search OR
      ct.description ILIKE :search OR
      ct_en.name ILIKE :search OR
      ct_en.description ILIKE :search
    )`);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // First get total count
  const countQuery = `
    SELECT COUNT(DISTINCT c.id) as count
    FROM categories c
    LEFT JOIN category_translations ct
      ON c.id = ct.category_id AND ct.language_code = :lang
    LEFT JOIN category_translations ct_en
      ON c.id = ct_en.category_id AND ct_en.language_code = 'en'
    ${whereClause}
  `;

  // Build pagination clause
  const paginationClause = [];
  if (limit) paginationClause.push(`LIMIT ${parseInt(limit)}`);
  if (offset) paginationClause.push(`OFFSET ${parseInt(offset)}`);

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
      COALESCE(ct.name, ct_en.name, c.slug) as name,
      COALESCE(ct.description, ct_en.description) as description
    FROM categories c
    LEFT JOIN category_translations ct
      ON c.id = ct.category_id AND ct.language_code = :lang
    LEFT JOIN category_translations ct_en
      ON c.id = ct_en.category_id AND ct_en.language_code = 'en'
    ${whereClause}
    ORDER BY c.sort_order ASC, c.created_at DESC
    ${paginationClause.join(' ')}
  `;

  const replacements = { lang };
  if (search) replacements.search = `%${search}%`;

  // Execute count and data queries in parallel
  const [countResult, results] = await Promise.all([
    sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    })
  ]);

  const count = parseInt(countResult[0]?.count || 0);

  return { rows: results, count };
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
      COALESCE(ct.name, ct_en.name, c.slug) as name,
      COALESCE(ct.description, ct_en.description) as description
    FROM categories c
    LEFT JOIN category_translations ct
      ON c.id = ct.category_id AND ct.language_code = :lang
    LEFT JOIN category_translations ct_en
      ON c.id = ct_en.category_id AND ct_en.language_code = 'en'
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
        store_id, parent_id, level, path, product_count,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        :slug, :image_url, :sort_order, :is_active, :hide_in_menu, :seo,
        :store_id, :parent_id, :level, :path, :product_count,
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
        product_count: categoryData.product_count || 0
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
    // Translations handled separately via normalized table (below)

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
    console.log(`   💾 updateCategoryWithTranslations: Saving translations for category ${id}`);
    console.log(`   📋 Translations to save:`, JSON.stringify(translations, null, 2));

    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        console.log(`      💾 Saving ${langCode}:`, {
          name: data.name ? data.name.substring(0, 30) : null,
          description: data.description ? data.description.substring(0, 50) + '...' : null
        });

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
            category_id: id,
            lang_code: langCode,
            name: data.name !== undefined ? data.name : null,
            description: data.description !== undefined ? data.description : null
          },
          transaction
        });

        console.log(`      ✅ Saved ${langCode} translation to category_translations table`);
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
 * Get categories with ALL translations for admin translation management
 *
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<Array>} Categories with all translations nested by language code
 */
async function getCategoriesWithAllTranslations(where = {}) {
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

  // Get categories
  const categoriesQuery = `
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
      ct_en.name as name
    FROM categories c
    LEFT JOIN category_translations ct_en
      ON c.id = ct_en.category_id AND ct_en.language_code = 'en'
    ${whereClause}
    ORDER BY c.sort_order ASC, c.created_at DESC
  `;

  const categories = await sequelize.query(categoriesQuery, {
    type: sequelize.QueryTypes.SELECT
  });

  // Get all translations for these categories
  const categoryIds = categories.map(c => c.id);

  if (categoryIds.length === 0) {
    return [];
  }

  const translationsQuery = `
    SELECT
      category_id,
      language_code,
      name,
      description
    FROM category_translations
    WHERE category_id IN (:categoryIds)
  `;

  const translations = await sequelize.query(translationsQuery, {
    replacements: { categoryIds },
    type: sequelize.QueryTypes.SELECT
  });

  // Group translations by category_id and language_code
  const translationsByCategory = {};
  translations.forEach(t => {
    if (!translationsByCategory[t.category_id]) {
      translationsByCategory[t.category_id] = {};
    }
    translationsByCategory[t.category_id][t.language_code] = {
      name: t.name,
      description: t.description
    };
  });

  // Attach translations to categories
  const result = categories.map(category => ({
    ...category,
    translations: translationsByCategory[category.id] || {}
  }));

  return result;
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
  getCategoriesWithAllTranslations,
  getCategoryById,
  createCategoryWithTranslations,
  updateCategoryWithTranslations,
  deleteCategory
};
