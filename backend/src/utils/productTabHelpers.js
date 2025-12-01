/**
 * Product Tab Helpers using JSONB translations column
 *
 * Translations are stored directly in the product_tabs.translations JSONB column
 * Format: { "en": { "name": "...", "content": "..." }, "nl": { ... } }
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get product tabs with translations from JSONB column
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en') - ignored if allTranslations is true
 * @param {boolean} allTranslations - If true, returns all translations for all languages
 * @returns {Promise<Array>} Product tabs with translated fields
 */
async function getProductTabsWithTranslations(storeId, where = {}, lang = 'en', allTranslations = false) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch product tabs
  let query = tenantDb.from('product_tabs').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }

  query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });

  const { data: tabs, error } = await query;

  if (error) {
    console.error('Error fetching product tabs:', error);
    throw error;
  }

  if (!tabs || tabs.length === 0) {
    return [];
  }

  // If allTranslations is true, return tabs with translations object as-is
  if (allTranslations) {
    const results = tabs.map(tab => ({
      ...tab,
      translations: tab.translations || {}
    }));

    console.log('✅ Query returned', results.length, 'tabs with all translations');
    return results;
  }

  // Single language mode - merge translation into tab fields
  const results = tabs.map(tab => {
    const trans = tab.translations || {};
    const reqLang = trans[lang];
    const enLang = trans['en'];

    return {
      ...tab,
      name: reqLang?.name || enLang?.name || tab.name,
      content: reqLang?.content || enLang?.content || tab.content
    };
  });

  console.log('✅ Query returned', results.length, 'tabs for language:', lang);
  return results;
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

  // Merge translation if it exists
  const trans = tab.translations || {};
  const reqLang = trans[lang];
  const enLang = trans['en'];

  if (reqLang) {
    tab.name = reqLang.name || tab.name;
    tab.content = reqLang.content || tab.content;
  } else if (enLang) {
    tab.name = enLang.name || tab.name;
    tab.content = enLang.content || tab.content;
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

  const { data: tab, error } = await tenantDb
    .from('product_tabs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tab) {
    return null;
  }

  // Ensure translations object exists
  const result = {
    ...tab,
    translations: tab.translations || {}
  };

  console.log('🔍 Backend: Query result:', {
    hasResults: true,
    translations: result.translations,
    translationType: typeof result.translations,
    translationKeys: Object.keys(result.translations || {})
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

  // Insert product tab with translations JSONB
  const now = new Date().toISOString();
  const { data: tab, error } = await tenantDb
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
      is_active: tabData.is_active !== false,
      translations: translations,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product tab:', error);
    throw error;
  }

  return {
    ...tab,
    translations: tab.translations || {}
  };
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

  // First get existing tab to merge translations
  const { data: existingTab } = await tenantDb
    .from('product_tabs')
    .select('translations')
    .eq('id', id)
    .single();

  // Merge existing translations with new ones
  const existingTranslations = existingTab?.translations || {};
  const mergedTranslations = { ...existingTranslations };

  // Update/add each language translation
  for (const [langCode, data] of Object.entries(translations)) {
    if (data && (data.name !== undefined || data.content !== undefined)) {
      mergedTranslations[langCode] = {
        ...(mergedTranslations[langCode] || {}),
        ...data
      };
      console.log(`   💾 Updating translation for language ${langCode}:`, data);
    }
  }

  // Build update object
  const updateData = {
    updated_at: new Date().toISOString(),
    translations: mergedTranslations
  };

  if (tabData.name !== undefined) updateData.name = tabData.name;
  if (tabData.slug !== undefined) updateData.slug = tabData.slug;
  if (tabData.tab_type !== undefined) updateData.tab_type = tabData.tab_type;
  if (tabData.content !== undefined) updateData.content = tabData.content;
  if (tabData.attribute_ids !== undefined) updateData.attribute_ids = tabData.attribute_ids;
  if (tabData.attribute_set_ids !== undefined) updateData.attribute_set_ids = tabData.attribute_set_ids;
  if (tabData.sort_order !== undefined) updateData.sort_order = tabData.sort_order;
  if (tabData.is_active !== undefined) updateData.is_active = tabData.is_active;

  const { data: tab, error } = await tenantDb
    .from('product_tabs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product tab:', error);
    throw error;
  }

  console.log(`   ✅ Product tab updated with translations`);

  return {
    ...tab,
    translations: tab.translations || {}
  };
}

/**
 * Delete product tab
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
