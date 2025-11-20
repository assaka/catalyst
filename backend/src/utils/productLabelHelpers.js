/**
 * Product Label Helpers for Normalized Translations
 *
 * These helpers construct the same JSON format that the frontend expects
 * from normalized translation tables.
 *
 * IMPORTANT: These functions require tenantDb connection parameter.
 * Routes should call ConnectionManager.getStoreConnection(storeId) and pass the tenantDb.
 */

/**
 * Get product labels with translations from normalized tables
 *
 * @param {Object} tenantDb - Tenant database connection (Supabase client)
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en') - ignored if allTranslations is true
 * @param {boolean} allTranslations - If true, returns all translations for all languages
 * @returns {Promise<Array>} Product labels with translated fields
 */
async function getProductLabelsWithTranslations(tenantDb, where = {}, lang = 'en', allTranslations = false) {
  if (!tenantDb) {
    throw new Error('tenantDb connection required');
  }

  // Fetch product labels
  let labelsQuery = tenantDb.from('product_labels').select('*');

  // Apply where conditions
  Object.entries(where).forEach(([key, value]) => {
    if (value === true || value === false) {
      labelsQuery = labelsQuery.eq(key, value);
    } else {
      labelsQuery = labelsQuery.eq(key, value);
    }
  });

  labelsQuery = labelsQuery.order('sort_order', { ascending: true }).order('priority', { ascending: false });

  const { data: labels, error: labelsError } = await labelsQuery;

  if (labelsError) throw labelsError;
  if (!labels || labels.length === 0) return [];

  // Fetch translations
  const labelIds = labels.map(l => l.id);
  const { data: translations, error: transError } = await tenantDb
    .from('product_label_translations')
    .select('*')
    .in('product_label_id', labelIds);

  if (transError) {
    console.error('Error fetching product label translations:', transError);
    return labels.map(l => allTranslations ? { ...l, translations: {} } : l);
  }

  // Group translations
  const translationsByLabel = {};
  (translations || []).forEach(t => {
    if (!translationsByLabel[t.product_label_id]) {
      translationsByLabel[t.product_label_id] = {};
    }
    translationsByLabel[t.product_label_id][t.language_code] = {
      name: t.name,
      text: t.text
    };
  });

  // Return with all translations or single language
  if (allTranslations) {
    return labels.map(label => ({
      ...label,
      translations: translationsByLabel[label.id] || {}
    }));
  }

  // Single language mode - merge translations into label
  return labels.map(label => {
    const trans = translationsByLabel[label.id];
    const reqLang = trans?.[lang];
    const enLang = trans?.['en'];

    return {
      ...label,
      name: reqLang?.name || enLang?.name || label.name,
      text: reqLang?.text || enLang?.text || label.text
    };
  });
}

/**
 * Get single product label with translations
 *
 * @param {Object} tenantDb - Tenant database connection
 * @param {string} id - Product label ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Product label with translated fields
 */
async function getProductLabelById(tenantDb, id, lang = 'en') {
  const labels = await getProductLabelsWithTranslations(tenantDb, { id }, lang, false);
  return labels[0] || null;
}

/**
 * Get single product label with ALL translations
 * Returns format: { id, name, text, ..., translations: {en: {name, text}, nl: {...}} }
 *
 * @param {Object} tenantDb - Tenant database connection
 * @param {string} id - Product label ID
 * @returns {Promise<Object|null>} Product label with all translations
 */
async function getProductLabelWithAllTranslations(tenantDb, id) {
  const labels = await getProductLabelsWithTranslations(tenantDb, { id }, 'en', true);
  return labels[0] || null;
}

/**
 * @deprecated Routes should implement their own create logic using tenantDb directly
 * This function exists for backward compatibility but should not be used.
 */
async function createProductLabelWithTranslations() {
  throw new Error('createProductLabelWithTranslations is deprecated. Routes should implement create logic using tenantDb directly.');
}

/**
 * @deprecated Routes should implement their own update logic using tenantDb directly
 * This function exists for backward compatibility but should not be used.
 */
async function updateProductLabelWithTranslations() {
  throw new Error('updateProductLabelWithTranslations is deprecated. Routes should implement update logic using tenantDb directly.');
}

/**
 * @deprecated Routes should implement their own delete logic using tenantDb directly
 * This function exists for backward compatibility but should not be used.
 */
async function deleteProductLabel() {
  throw new Error('deleteProductLabel is deprecated. Routes should implement delete logic using tenantDb directly.');
}

module.exports = {
  getProductLabelsWithTranslations,
  getProductLabelById,
  getProductLabelWithAllTranslations,
  createProductLabelWithTranslations,
  updateProductLabelWithTranslations,
  deleteProductLabel
};
