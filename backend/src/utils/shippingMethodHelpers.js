/**
 * Shipping Method Helpers for Normalized Translations
 *
 * These helpers construct the same JSON format that the frontend expects
 * from normalized translation tables.
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get shipping methods with translations from normalized tables
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @param {Object} options - Query options (limit, offset, lang)
 * @returns {Promise<Array>} Shipping methods with translated fields
 */
async function getShippingMethodsWithTranslations(storeId, where = {}, options = {}) {
  const connection = await ConnectionManager.getStoreConnection(storeId);
  const sequelize = connection.sequelize;

  const lang = options.lang || 'en';
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `sm.${key} = ${value}`;
      }
      if (Array.isArray(value)) {
        // Handle IN clause for arrays
        const values = value.map(v => `'${v}'`).join(', ');
        return `sm.${key} IN (${values})`;
      }
      return `sm.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
  const limitClause = options.limit ? `LIMIT ${options.limit}` : '';
  const offsetClause = options.offset ? `OFFSET ${options.offset}` : '';

  const query = `
    SELECT
      sm.id,
      sm.store_id,
      sm.is_active,
      sm.type,
      sm.flat_rate_cost,
      sm.free_shipping_min_order,
      sm.weight_ranges,
      sm.price_ranges,
      sm.availability,
      sm.countries,
      sm.conditions,
      sm.min_delivery_days,
      sm.max_delivery_days,
      sm.sort_order,
      sm.created_at,
      sm.updated_at,
      COALESCE(smt.name, sm.name) as name,
      COALESCE(smt.description, sm.description) as description
    FROM shipping_methods sm
    LEFT JOIN shipping_method_translations smt ON sm.id = smt.shipping_method_id AND smt.language_code = :lang
    ${whereClause}
    ORDER BY sm.sort_order ASC, sm.name ASC
    ${limitClause}
    ${offsetClause}
  `;

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results;
}

/**
 * Get count of shipping methods
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<number>} Count of shipping methods
 */
async function getShippingMethodsCount(storeId, where = {}) {
  const connection = await ConnectionManager.getStoreConnection(storeId);
  const sequelize = connection.sequelize;
  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `${key} = ${value}`;
      }
      if (Array.isArray(value)) {
        const values = value.map(v => `'${v}'`).join(', ');
        return `${key} IN (${values})`;
      }
      return `${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT COUNT(*) as count
    FROM shipping_methods
    ${whereClause}
  `;

  const [result] = await sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT
  });

  return parseInt(result.count);
}

/**
 * Get single shipping method with translations
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Shipping method ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Shipping method with translated fields
 */
async function getShippingMethodById(storeId, id, lang = 'en') {
  const connection = await ConnectionManager.getStoreConnection(storeId);
  const sequelize = connection.sequelize;
  const query = `
    SELECT
      sm.id,
      sm.store_id,
      sm.is_active,
      sm.type,
      sm.flat_rate_cost,
      sm.free_shipping_min_order,
      sm.weight_ranges,
      sm.price_ranges,
      sm.availability,
      sm.countries,
      sm.conditions,
      sm.min_delivery_days,
      sm.max_delivery_days,
      sm.sort_order,
      sm.created_at,
      sm.updated_at,
      COALESCE(smt.name, sm.name) as name,
      COALESCE(smt.description, sm.description) as description
    FROM shipping_methods sm
    LEFT JOIN shipping_method_translations smt ON sm.id = smt.shipping_method_id AND smt.language_code = :lang
    WHERE sm.id = :id
  `;

  const results = await sequelize.query(query, {
    replacements: { id, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

/**
 * Create shipping method with translations
 *
 * @param {string} storeId - Store ID
 * @param {Object} methodData - Shipping method data (without translations)
 * @param {Object} translations - Translations object { en: {name, description}, nl: {name, description} }
 * @returns {Promise<Object>} Created shipping method with translations
 */
async function createShippingMethodWithTranslations(storeId, methodData, translations = {}) {
  const connection = await ConnectionManager.getStoreConnection(storeId);
  const sequelize = connection.sequelize;
  const transaction = await sequelize.transaction();

  try {
    // Insert shipping method
    const [method] = await sequelize.query(`
      INSERT INTO shipping_methods (
        id, store_id, name, description, is_active, type,
        flat_rate_cost, free_shipping_min_order, weight_ranges, price_ranges,
        availability, countries, conditions, min_delivery_days, max_delivery_days, sort_order,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        :store_id,
        :name,
        :description,
        :is_active,
        :type,
        :flat_rate_cost,
        :free_shipping_min_order,
        :weight_ranges,
        :price_ranges,
        :availability,
        :countries,
        :conditions,
        :min_delivery_days,
        :max_delivery_days,
        :sort_order,
        NOW(),
        NOW()
      )
      RETURNING *
    `, {
      replacements: {
        store_id: methodData.store_id,
        name: methodData.name || '',
        description: methodData.description || '',
        is_active: methodData.is_active !== false,
        type: methodData.type || 'flat_rate',
        flat_rate_cost: methodData.flat_rate_cost || 0,
        free_shipping_min_order: methodData.free_shipping_min_order || 0,
        weight_ranges: JSON.stringify(methodData.weight_ranges || []),
        price_ranges: JSON.stringify(methodData.price_ranges || []),
        availability: methodData.availability || 'all',
        countries: JSON.stringify(methodData.countries || []),
        conditions: JSON.stringify(methodData.conditions || {}),
        min_delivery_days: methodData.min_delivery_days || 1,
        max_delivery_days: methodData.max_delivery_days || 7,
        sort_order: methodData.sort_order || 0
      },
      type: sequelize.QueryTypes.SELECT,
      transaction
    });

    // Insert translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name || data.description)) {
        await sequelize.query(`
          INSERT INTO shipping_method_translations (
            shipping_method_id, language_code, name, description, created_at, updated_at
          ) VALUES (
            :method_id, :lang_code, :name, :description, NOW(), NOW()
          )
          ON CONFLICT (shipping_method_id, language_code) DO UPDATE
          SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW()
        `, {
          replacements: {
            method_id: method.id,
            lang_code: langCode,
            name: data.name || '',
            description: data.description || ''
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the created method with translations
    return await getShippingMethodById(storeId, method.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Update shipping method with translations
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Shipping method ID
 * @param {Object} methodData - Shipping method data (without translations)
 * @param {Object} translations - Translations object { en: {name, description}, nl: {name, description} }
 * @returns {Promise<Object>} Updated shipping method with translations
 */
async function updateShippingMethodWithTranslations(storeId, id, methodData, translations = {}) {
  const connection = await ConnectionManager.getStoreConnection(storeId);
  const sequelize = connection.sequelize;
  const transaction = await sequelize.transaction();

  try {
    // Build update fields
    const updateFields = [];
    const replacements = { id };

    if (methodData.name !== undefined) {
      updateFields.push('name = :name');
      replacements.name = methodData.name;
    }
    if (methodData.description !== undefined) {
      updateFields.push('description = :description');
      replacements.description = methodData.description;
    }
    if (methodData.is_active !== undefined) {
      updateFields.push('is_active = :is_active');
      replacements.is_active = methodData.is_active;
    }
    if (methodData.type !== undefined) {
      updateFields.push('type = :type');
      replacements.type = methodData.type;
    }
    if (methodData.flat_rate_cost !== undefined) {
      updateFields.push('flat_rate_cost = :flat_rate_cost');
      replacements.flat_rate_cost = methodData.flat_rate_cost;
    }
    if (methodData.free_shipping_min_order !== undefined) {
      updateFields.push('free_shipping_min_order = :free_shipping_min_order');
      replacements.free_shipping_min_order = methodData.free_shipping_min_order;
    }
    if (methodData.weight_ranges !== undefined) {
      updateFields.push('weight_ranges = :weight_ranges');
      replacements.weight_ranges = JSON.stringify(methodData.weight_ranges);
    }
    if (methodData.price_ranges !== undefined) {
      updateFields.push('price_ranges = :price_ranges');
      replacements.price_ranges = JSON.stringify(methodData.price_ranges);
    }
    if (methodData.availability !== undefined) {
      updateFields.push('availability = :availability');
      replacements.availability = methodData.availability;
    }
    if (methodData.countries !== undefined) {
      updateFields.push('countries = :countries');
      replacements.countries = JSON.stringify(methodData.countries);
    }
    if (methodData.conditions !== undefined) {
      updateFields.push('conditions = :conditions');
      replacements.conditions = JSON.stringify(methodData.conditions);
    }
    if (methodData.min_delivery_days !== undefined) {
      updateFields.push('min_delivery_days = :min_delivery_days');
      replacements.min_delivery_days = methodData.min_delivery_days;
    }
    if (methodData.max_delivery_days !== undefined) {
      updateFields.push('max_delivery_days = :max_delivery_days');
      replacements.max_delivery_days = methodData.max_delivery_days;
    }
    if (methodData.sort_order !== undefined) {
      updateFields.push('sort_order = :sort_order');
      replacements.sort_order = methodData.sort_order;
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');

      await sequelize.query(`
        UPDATE shipping_methods
        SET ${updateFields.join(', ')}
        WHERE id = :id
      `, {
        replacements,
        transaction
      });
    }

    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name !== undefined || data.description !== undefined)) {
        await sequelize.query(`
          INSERT INTO shipping_method_translations (
            shipping_method_id, language_code, name, description, created_at, updated_at
          ) VALUES (
            :method_id, :lang_code, :name, :description, NOW(), NOW()
          )
          ON CONFLICT (shipping_method_id, language_code) DO UPDATE
          SET
            name = COALESCE(EXCLUDED.name, shipping_method_translations.name),
            description = COALESCE(EXCLUDED.description, shipping_method_translations.description),
            updated_at = NOW()
        `, {
          replacements: {
            method_id: id,
            lang_code: langCode,
            name: data.name,
            description: data.description
          },
          transaction
        });
      }
    }

    await transaction.commit();

    // Return the updated method with translations
    return await getShippingMethodById(storeId, id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Delete shipping method (translations are CASCADE deleted)
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Shipping method ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteShippingMethod(storeId, id) {
  const connection = await ConnectionManager.getStoreConnection(storeId);
  const sequelize = connection.sequelize;

  await sequelize.query(`
    DELETE FROM shipping_methods WHERE id = :id
  `, {
    replacements: { id },
    type: sequelize.QueryTypes.DELETE
  });

  return true;
}

module.exports = {
  getShippingMethodsWithTranslations,
  getShippingMethodsCount,
  getShippingMethodById,
  createShippingMethodWithTranslations,
  updateShippingMethodWithTranslations,
  deleteShippingMethod
};
