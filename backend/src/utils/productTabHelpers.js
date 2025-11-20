/**
 * Product Tab Helpers for Normalized Translations
 *
 * These helpers construct the same JSON format that the frontend expects
 * from normalized translation tables.
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get product tabs with translations from normalized tables
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en') - ignored if allTranslations is true
 * @param {boolean} allTranslations - If true, returns all translations for all languages
 * @returns {Promise<Array>} Product tabs with translated fields
 */
async function getProductTabsWithTranslations(storeId, where = {}, lang = 'en', allTranslations = false) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `pt.${key} = ${value}`;
      }
      return `pt.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  // If allTranslations is true, return ALL translations for each tab
  if (allTranslations) {
    // Fetch product tabs
    let tabsQuery = tenantDb.from('product_tabs').select('*');

    // Apply where conditions
    for (const [key, value] of Object.entries(where)) {
      tabsQuery = tabsQuery.eq(key, value);
    }

    tabsQuery = tabsQuery.order('sort_order', { ascending: true }).order('name', { ascending: true });

    const { data: tabs, error: tabsError } = await tabsQuery;

    if (tabsError) {
      console.error('Error fetching product tabs:', tabsError);
      throw tabsError;
    }

    if (!tabs || tabs.length === 0) {
      return [];
    }

    // Fetch all translations for these tabs
    const tabIds = tabs.map(t => t.id);
    const { data: translations, error: transError } = await tenantDb
      .from('product_tab_translations')
      .select('*')
      .in('product_tab_id', tabIds);

    if (transError) {
      console.error('Error fetching translations:', transError);
      throw transError;
    }

    // Merge translations into tabs
    const results = tabs.map(tab => {
      const tabTranslations = translations?.filter(t => t.product_tab_id === tab.id) || [];
      const translationsObj = {};

      tabTranslations.forEach(t => {
        translationsObj[t.language_code] = {
          name: t.name,
          content: t.content
        };
      });

      return {
        ...tab,
        translations: translationsObj
      };
    });

    console.log('✅ Query returned', results.length, 'tabs with all translations');
    if (results.length > 0) {
      console.log('📝 Sample tab:', {
        id: results[0].id,
        name: results[0].name,
        translations: results[0].translations,
        translationKeys: Object.keys(results[0].translations || {})
      });
    }

    return results;
  }

  // Original single-language query - use Supabase's query builder
  let query = tenantDb
    .from('product_tabs')
    .select(`
      id,
      store_id,
      name,
      slug,
      tab_type,
      content,
      attribute_ids,
      attribute_set_ids,
      sort_order,
      is_active,
      created_at,
      updated_at
    `);

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }

  query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching product tabs:', error);
    throw error;
  }

  console.log('✅ Query returned', data?.length || 0, 'tabs');
  if (data && data.length > 0) {
    console.log('📝 Sample tab:', JSON.stringify(data[0], null, 2));
  }

  return data || [];
}

/**
 * Get single product tab with translations
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Product tab ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Product tab with translated fields
 */
async function getProductTabById(storeId, id, lang = 'en') {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { data: tab, error } = await tenantDb
    .from('product_tabs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tab) {
    return null;
  }

  // Fetch translation for the specific language
  const { data: translation } = await tenantDb
    .from('product_tab_translations')
    .select('*')
    .eq('product_tab_id', id)
    .eq('language_code', lang)
    .maybeSingle();

  // Merge translation if it exists
  if (translation) {
    tab.name = translation.name || tab.name;
    tab.content = translation.content || tab.content;
  }

  return tab;
}

/**
 * Get single product tab with ALL translations
 * Returns format: { id, name, ..., translations: {en: {name, content}, nl: {...}} }
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Product tab ID
 * @returns {Promise<Object|null>} Product tab with all translations
 */
async function getProductTabWithAllTranslations(storeId, id) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  console.log('🔍 Backend: Querying product tab with all translations for ID:', id);

  const { data: tab, error: tabError } = await tenantDb
    .from('product_tabs')
    .select('*')
    .eq('id', id)
    .single();

  if (tabError || !tab) {
    return null;
  }

  // Fetch all translations for this tab
  const { data: translations, error: transError } = await tenantDb
    .from('product_tab_translations')
    .select('*')
    .eq('product_tab_id', id);

  const translationsObj = {};
  if (translations) {
    translations.forEach(t => {
      translationsObj[t.language_code] = {
        name: t.name,
        content: t.content
      };
    });
  }

  const result = {
    ...tab,
    translations: translationsObj
  };

  console.log('🔍 Backend: Query result:', {
    hasResults: true,
    translations: result.translations,
    translationType: typeof result.translations,
    translationKeys: Object.keys(result.translations || {}),
    enTranslation: result.translations?.en,
    nlTranslation: result.translations?.nl
  });

  return result;
}

/**
 * Create product tab with translations
 *
 * @param {Object} tabData - Product tab data (without translations)
 * @param {Object} translations - Translations object { en: {name, content}, nl: {name, content} }
 * @returns {Promise<Object>} Created product tab with translations
 */
async function createProductTabWithTranslations(tabData, translations = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(tabData.store_id);

  // Generate UUID for the new tab
  const { randomUUID } = require('crypto');
  const newId = randomUUID();

  // Insert product tab
  const { data: tab, error: tabError } = await tenantDb
    .from('product_tabs')
    .insert({
      id: newId,
      store_id: tabData.store_id,
      name: tabData.name || '',
      slug: tabData.slug,
      tab_type: tabData.tab_type || 'text',
      content: tabData.content || '',
      attribute_ids: tabData.attribute_ids || [],
      attribute_set_ids: tabData.attribute_set_ids || [],
      sort_order: tabData.sort_order || 0,
      is_active: tabData.is_active !== false
    })
    .select()
    .single();

  if (tabError) {
    console.error('Error creating product tab:', tabError);
    throw tabError;
  }

  // Insert translations
  for (const [langCode, data] of Object.entries(translations)) {
    if (data && (data.name || data.content)) {
      await tenantDb
        .from('product_tab_translations')
        .upsert({
          product_tab_id: tab.id,
          language_code: langCode,
          name: data.name || '',
          content: data.content || ''
        }, {
          onConflict: 'product_tab_id,language_code'
        });
    }
  }

  // Return the created tab with all translations
  return await getProductTabWithAllTranslations(tabData.store_id, tab.id);
}

/**
 * Update product tab with translations
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Product tab ID
 * @param {Object} tabData - Product tab data (without translations)
 * @param {Object} translations - Translations object { en: {name, content}, nl: {name, content} }
 * @returns {Promise<Object>} Updated product tab with translations
 */
async function updateProductTabWithTranslations(storeId, id, tabData, translations = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Build update object
  const updateData = {};

  if (tabData.name !== undefined) updateData.name = tabData.name;
  if (tabData.slug !== undefined) updateData.slug = tabData.slug;
  if (tabData.tab_type !== undefined) updateData.tab_type = tabData.tab_type;
  if (tabData.content !== undefined) updateData.content = tabData.content;
  if (tabData.attribute_ids !== undefined) updateData.attribute_ids = tabData.attribute_ids;
  if (tabData.attribute_set_ids !== undefined) updateData.attribute_set_ids = tabData.attribute_set_ids;
  if (tabData.sort_order !== undefined) updateData.sort_order = tabData.sort_order;
  if (tabData.is_active !== undefined) updateData.is_active = tabData.is_active;

  if (Object.keys(updateData).length > 0) {
    const { error } = await tenantDb
      .from('product_tabs')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating product tab:', error);
      throw error;
    }
  }

  // Update translations
  for (const [langCode, data] of Object.entries(translations)) {
    if (data && (data.name !== undefined || data.content !== undefined)) {
      console.log(`   💾 Updating translation for language ${langCode}:`, {
        name: data.name,
        content: data.content ? data.content.substring(0, 50) + '...' : data.content
      });

      await tenantDb
        .from('product_tab_translations')
        .upsert({
          product_tab_id: id,
          language_code: langCode,
          name: data.name !== undefined ? data.name : '',
          content: data.content !== undefined ? data.content : ''
        }, {
          onConflict: 'product_tab_id,language_code'
        });

      console.log(`   ✅ Translation saved for ${langCode}: name="${data.name || '(empty)'}"`);
    }
  }

  // Return the updated tab with all translations
  return await getProductTabWithAllTranslations(storeId, id);
}

/**
 * Delete product tab (translations are CASCADE deleted)
 *
 * @param {string} storeId - Store ID
 * @param {string} id - Product tab ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteProductTab(storeId, id) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { error } = await tenantDb
    .from('product_tabs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product tab:', error);
    throw error;
  }

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
