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
      COALESCE(ct.name, ct_en.name, c.slug) as name,
      COALESCE(ct.description, ct_en.description) as description
    FROM categories c
    LEFT JOIN category_translations ct
      ON c.id = ct.category_id AND ct.language_code = :lang
    LEFT JOIN category_translations ct_en
      ON c.id = ct_en.category_id AND ct_en.language_code = 'en'
    ${whereClause}
    ORDER BY c.sort_order ASC, c.created_at DESC
  `;

  console.log('🔍 SQL Query for categories:', query.replace(/\s+/g, ' '));
  console.log('🔍 Language parameter:', lang);
  console.log('🔍 Where conditions:', whereConditions || 'NONE');

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  console.log('✅ Query returned', results.length, 'categories');
  if (results.length > 0) {
    console.log('📝 First 3 categories:');
    results.slice(0, 3).forEach((cat, index) => {
      console.log(`   Category ${index + 1}:`, JSON.stringify({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        is_active: cat.is_active,
        hide_in_menu: cat.hide_in_menu,
        parent_id: cat.parent_id,
        description_preview: cat.description?.substring(0, 30),
        has_name: !!cat.name,
        name_length: cat.name?.length,
        name_type: typeof cat.name
      }, null, 2));
    });
  } else {
    console.log('⚠️ NO CATEGORIES RETURNED FROM DATABASE');
    console.log('⚠️ Check if category_translations table has data for language:', lang);
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
            meta_title, meta_description, meta_keywords,
            created_at, updated_at
          ) VALUES (
            :category_id, :lang_code, :name, :description,
            :meta_title, :meta_description, :meta_keywords,
            NOW(), NOW()
          )
          ON CONFLICT (category_id, language_code) DO UPDATE
          SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            meta_title = EXCLUDED.meta_title,
            meta_description = EXCLUDED.meta_description,
            meta_keywords = EXCLUDED.meta_keywords,
            updated_at = NOW()
        `, {
          replacements: {
            category_id: category.id,
            lang_code: langCode,
            name: data.name || null,
            description: data.description || null,
            meta_title: data.meta_title || null,
            meta_description: data.meta_description || null,
            meta_keywords: data.meta_keywords || null
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
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && Object.keys(data).length > 0) {
        await sequelize.query(`
          INSERT INTO category_translations (
            category_id, language_code, name, description,
            meta_title, meta_description, meta_keywords,
            created_at, updated_at
          ) VALUES (
            :category_id, :lang_code, :name, :description,
            :meta_title, :meta_description, :meta_keywords,
            NOW(), NOW()
          )
          ON CONFLICT (category_id, language_code) DO UPDATE
          SET
            name = COALESCE(EXCLUDED.name, category_translations.name),
            description = COALESCE(EXCLUDED.description, category_translations.description),
            meta_title = COALESCE(EXCLUDED.meta_title, category_translations.meta_title),
            meta_description = COALESCE(EXCLUDED.meta_description, category_translations.meta_description),
            meta_keywords = COALESCE(EXCLUDED.meta_keywords, category_translations.meta_keywords),
            updated_at = NOW()
        `, {
          replacements: {
            category_id: id,
            lang_code: langCode,
            name: data.name,
            description: data.description,
            meta_title: data.meta_title,
            meta_description: data.meta_description,
            meta_keywords: data.meta_keywords
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
      description,
      meta_title,
      meta_description,
      meta_keywords
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
      description: t.description,
      meta_title: t.meta_title,
      meta_description: t.meta_description,
      meta_keywords: t.meta_keywords
    };
  });

  // Attach translations to categories
  return categories.map(category => ({
    ...category,
    translations: translationsByCategory[category.id] || {}
  }));
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
