/**
 * Shipping Method Helpers for Normalized Translations
 *
 * These helpers construct the same JSON format that the frontend expects
 * from normalized translation tables using Supabase.
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
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const lang = options.lang || 'en';

  // Build shipping methods query
  let methodsQuery = tenantDb.from('shipping_methods').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      methodsQuery = methodsQuery.in(key, value);
    } else {
      methodsQuery = methodsQuery.eq(key, value);
    }
  }

  // Apply sorting
  methodsQuery = methodsQuery.order('sort_order', { ascending: true }).order('name', { ascending: true });

  // Apply pagination
  if (options.limit) methodsQuery = methodsQuery.limit(options.limit);
  if (options.offset) methodsQuery = methodsQuery.range(options.offset, options.offset + (options.limit || 50) - 1);

  const { data: methods, error: methodsError } = await methodsQuery;

  if (methodsError) {
    console.error('Error fetching shipping_methods:', methodsError);
    throw methodsError;
  }

  if (!methods || methods.length === 0) {
    return [];
  }

  // Fetch translations
  const methodIds = methods.map(m => m.id);
  const { data: translations, error: transError } = await tenantDb
    .from('shipping_method_translations')
    .select('shipping_method_id, language_code, name, description')
    .in('shipping_method_id', methodIds)
    .eq('language_code', lang);

  if (transError) {
    console.error('Error fetching shipping_method_translations:', transError);
  }

  // Build translation map
  const translationMap = {};
  (translations || []).forEach(t => {
    translationMap[t.shipping_method_id] = t;
  });

  // Apply translations to methods
  return methods.map(method => {
    const translation = translationMap[method.id];
    return {
      ...method,
      name: translation?.name || method.name || '',
      description: translation?.description || method.description || ''
    };
  });
}

/**
 * Get count of shipping methods
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<number>} Count of shipping methods
 */
async function getShippingMethodsCount(storeId, where = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Build query
  let countQuery = tenantDb.from('shipping_methods').select('*', { count: 'exact', head: true });

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      countQuery = countQuery.in(key, value);
    } else {
      countQuery = countQuery.eq(key, value);
    }
  }

  const { count, error } = await countQuery;

  if (error) {
    console.error('Error counting shipping methods:', error);
    throw error;
  }

  return count || 0;
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
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch the shipping method
  const { data: method, error: methodError } = await tenantDb
    .from('shipping_methods')
    .select('*')
    .eq('id', id)
    .single();

  if (methodError || !method) {
    return null;
  }

  // Fetch translation
  const { data: translations, error: transError } = await tenantDb
    .from('shipping_method_translations')
    .select('name, description')
    .eq('shipping_method_id', id)
    .eq('language_code', lang)
    .maybeSingle();

  if (transError) {
    console.error('Error fetching shipping method translation:', transError);
  }

  return {
    ...method,
    name: translations?.name || method.name || '',
    description: translations?.description || method.description || ''
  };
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
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  try {
    // Insert shipping method
    const { data: method, error: methodError } = await tenantDb
      .from('shipping_methods')
      .insert({
        store_id: methodData.store_id,
        name: methodData.name || '',
        description: methodData.description || '',
        is_active: methodData.is_active !== false,
        type: methodData.type || 'flat_rate',
        flat_rate_cost: methodData.flat_rate_cost || 0,
        free_shipping_min_order: methodData.free_shipping_min_order || 0,
        weight_ranges: methodData.weight_ranges || [],
        price_ranges: methodData.price_ranges || [],
        availability: methodData.availability || 'all',
        countries: methodData.countries || [],
        conditions: methodData.conditions || {},
        min_delivery_days: methodData.min_delivery_days || 1,
        max_delivery_days: methodData.max_delivery_days || 7,
        sort_order: methodData.sort_order || 0
      })
      .select()
      .single();

    if (methodError) {
      console.error('Error inserting shipping method:', methodError);
      throw methodError;
    }

    // Insert translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name || data.description)) {
        const { error: transError } = await tenantDb
          .from('shipping_method_translations')
          .upsert({
            shipping_method_id: method.id,
            language_code: langCode,
            name: data.name || '',
            description: data.description || ''
          }, {
            onConflict: 'shipping_method_id,language_code'
          });

        if (transError) {
          console.error('Error upserting shipping method translation:', transError);
          // Continue with other translations
        }
      }
    }

    // Return the created method with translations
    return await getShippingMethodById(storeId, method.id);
  } catch (error) {
    console.error('Error creating shipping method:', error);
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
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  try {
    // Build update object
    const updateData = {};

    const fields = [
      'name', 'description', 'is_active', 'type', 'flat_rate_cost',
      'free_shipping_min_order', 'weight_ranges', 'price_ranges',
      'availability', 'countries', 'conditions', 'min_delivery_days',
      'max_delivery_days', 'sort_order'
    ];

    fields.forEach(field => {
      if (methodData[field] !== undefined) {
        updateData[field] = methodData[field];
      }
    });

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await tenantDb
        .from('shipping_methods')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating shipping method:', updateError);
        throw updateError;
      }
    }

    // Update translations
    for (const [langCode, data] of Object.entries(translations)) {
      if (data && (data.name !== undefined || data.description !== undefined)) {
        const { error: transError } = await tenantDb
          .from('shipping_method_translations')
          .upsert({
            shipping_method_id: id,
            language_code: langCode,
            name: data.name,
            description: data.description,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'shipping_method_id,language_code'
          });

        if (transError) {
          console.error('Error upserting shipping method translation:', transError);
          throw transError;
        }
      }
    }

    // Return the updated method with translations
    return await getShippingMethodById(storeId, id);
  } catch (error) {
    console.error('Error updating shipping method:', error);
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
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { error } = await tenantDb
    .from('shipping_methods')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting shipping method:', error);
    throw error;
  }

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
